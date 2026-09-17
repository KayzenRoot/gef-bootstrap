/**
 * Process boundary.
 *
 * Owns argv/stdout/stderr/exit projection and the composition of the kernel runtime ports.
 * No domain policy lives here: commands are resolved by the parser, executed by the kernel
 * runtime through the registry, and projected by the renderer.
 *
 * The CLI never reads stdin, so a non-TTY invocation cannot block on an implicit prompt.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import type { CommandRequest, GefError } from "@gef-bootstrap/contracts";
import { ProcessExitCode } from "@gef-bootstrap/contracts";
import { KernelRuntime, authorizeFilesystemPath, createGefError, projectExitCode } from "@gef-bootstrap/kernel";
import type { RuntimePorts, TargetBindingPort, VerificationPort, ReceiptPort, PolicyPort } from "@gef-bootstrap/kernel";

import { CLI_CONTRACT_VERSION, parseArgv, usageText } from "./parser.js";
import { renderHelp, renderResultHuman, renderResultJson, renderUsageFailureHuman, renderUsageFailureJson, renderVersion, renderVersionJson } from "./render.js";
import { buildRegistry, loadEngines, observeTarget, rootDescriptorFor } from "./registry.js";
import type { CliVerb } from "./registry.js";

/** Used only when the packaged manifest cannot be read (for example a partially broken install). */
export const FALLBACK_PRODUCT_VERSION = "1.1.0";

const GEF_STATE_DIRECTORY = ".gef";
const RECEIPTS_DIRECTORY = "receipts";

export function resolveProductVersion(moduleUrl: string = import.meta.url): string {
  try {
    const here = dirname(fileURLToPath(moduleUrl));
    const manifest: unknown = JSON.parse(readFileSync(resolve(here, "../package.json"), "utf8"));
    if (manifest !== null && typeof manifest === "object") {
      const version = (manifest as { readonly version?: unknown }).version;
      if (typeof version === "string" && version.length > 0) return version;
    }
  } catch {
    // fall through to the compiled fallback
  }
  return FALLBACK_PRODUCT_VERSION;
}

export interface RunDependencies {
  readonly argv: readonly string[];
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly cwd: string;
  readonly platform: string;
  readonly nodeVersion: string;
  readonly architecture: string;
  readonly productVersion: string;
}

function monoticIdFactory(): { nextId(prefix: string): string } {
  let counter = 0;
  return {
    nextId(prefix: string): string {
      counter += 1;
      return `${prefix}-${counter.toString(36)}-${createHash("sha256").update(`${prefix}:${counter}`).digest("hex").slice(0, 12)}`;
    },
  };
}

function policyError(summary: string, reason: string, commandId: string, runId: string): GefError {
  return createGefError({
    id: `cli-policy-${commandId}`,
    category: "POLICY",
    reason,
    severity: "ERROR",
    summary,
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    terminal: "BLOCKED",
    commandId,
    runId,
  });
}

function buildPorts(deps: RunDependencies): RuntimePorts {
  const ids = monoticIdFactory();

  const policy: PolicyPort = {
    async check(context) {
      if (!context.mutation) return { ok: true };
      try {
        const engines = await loadEngines();
        const decision = engines.safetyDecision({ classification: "MUTATING", blastRadius: "known", requested: "AUTO", restricted: false });
        if (decision.state !== "READY" || decision.confirmation === "FORBIDDEN") {
          return { ok: false, error: policyError("Mutation is not authorized by the safety policy", "mutation_not_authorized", context.commandId, context.runId) };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: policyError("Safety engine is unavailable; mutation refused", "safety_engine_unavailable", context.commandId, context.runId) };
      }
    },
  };

  const targetBinding: TargetBindingPort = {
    bind(request: CommandRequest) {
      const input = request.input;
      const fromInput = input !== null && typeof input === "object" ? (input as { readonly targetRef?: unknown }).targetRef : undefined;
      const requested = typeof fromInput === "string" ? fromInput : deps.env["GEF_TARGET"] ?? deps.cwd;
      const observation = observeTarget(requested);
      return { ok: true, target: { targetRef: observation.targetRef, stateFingerprint: observation.stateFingerprint } };
    },
  };

  const verification: VerificationPort = {
    verify(request) {
      const value = request.value;
      const receipt = value !== null && typeof value === "object" ? (value as { readonly receipt?: unknown }).receipt : undefined;
      if (receipt === null || typeof receipt !== "object") {
        return { ok: false, error: policyError("Mutation produced no receipt to verify", "receipt_missing", request.commandId, request.runId) };
      }
      const { artifactRef, artifactFingerprint } = receipt as { readonly artifactRef?: unknown; readonly artifactFingerprint?: unknown };
      if (typeof artifactRef !== "string" || typeof artifactFingerprint !== "string") {
        return { ok: false, error: policyError("Mutation receipt is malformed", "receipt_malformed", request.commandId, request.runId) };
      }
      if (request.target === undefined) {
        return { ok: false, error: policyError("Mutation verification requires a bound target", "target_missing", request.commandId, request.runId) };
      }
      try {
        const physical = resolve(request.target.targetRef, artifactRef);
        const body = readFileSync(physical);
        const observed = createHash("sha256").update(body).digest("hex");
        if (observed !== artifactFingerprint) {
          return {
            ok: false,
            error: createGefError({
              id: `cli-verify-${request.commandId}`,
              category: "VERIFICATION",
              reason: "artifact_fingerprint_mismatch",
              severity: "CRITICAL",
              summary: "Written artifact does not match the reported fingerprint",
              retryability: "MANUAL_ONLY",
              recoverability: "MANUAL_REPAIR_REQUIRED",
              terminal: "RECOVERY_REQUIRED",
              commandId: request.commandId,
              runId: request.runId,
              effectStatus: "PARTIAL",
              metadata: { artifactRef, expected: artifactFingerprint, observed },
            }),
          };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: policyError("Written artifact could not be read back", "artifact_unreadable", request.commandId, request.runId) };
      }
    },
  };

  const receipts: ReceiptPort = {
    write(request) {
      if (request.target === undefined) {
        return { ok: false, error: policyError("Receipt requires a bound target", "target_missing", request.commandId, request.runId) };
      }
      const relative = `${GEF_STATE_DIRECTORY}/${RECEIPTS_DIRECTORY}/${request.runId}.json`;
      const authorized = authorizeFilesystemPath({ root: rootDescriptorFor(request.target.targetRef), relativePath: relative, operation: "CREATE" });
      if (!authorized.ok) return { ok: false, error: authorized.error };
      const payload = {
        schemaVersion: 1,
        kind: "gef.cli.receipt",
        runId: request.runId,
        commandId: request.commandId,
        contractVersion: CLI_CONTRACT_VERSION,
        effectStatus: request.effectStatus,
        lifecyclePhases: [...request.lifecyclePhases],
        result: request.value,
      };
      const body = `${JSON.stringify(payload, null, 2)}\n`;
      try {
        mkdirSync(dirname(authorized.value.physicalTarget), { recursive: true });
        writeFileSync(authorized.value.physicalTarget, body, { flag: "wx" });
      } catch (cause: unknown) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        return { ok: false, error: policyError(`Receipt could not be written: ${detail}`, "receipt_write_failed", request.commandId, request.runId) };
      }
      return { ok: true, receiptRef: `${relative}#${createHash("sha256").update(body).digest("hex").slice(0, 16)}` };
    },
  };

  return Object.freeze({
    clock: { nowMs: () => Date.now() },
    ids,
    policy,
    targetBinding,
    verification,
    receipts,
    environment: { values: deps.env },
  });
}

function commandRequestFor(commandId: string, verb: CliVerb, apply: boolean, targetRef: string | undefined): CommandRequest {
  return {
    commandId,
    contractVersion: CLI_CONTRACT_VERSION,
    input: { verb, apply, ...(targetRef === undefined ? {} : { targetRef }) },
  };
}

/** Execute one CLI invocation and return the projected process exit code. */
export async function runCli(deps: RunDependencies): Promise<number> {
  const parsed = parseArgv(deps.argv);

  if (parsed.kind === "failure") {
    deps.stderr(parsed.json ? renderUsageFailureJson(parsed.reason, parsed.summary) : renderUsageFailureHuman(parsed.reason, parsed.summary));
    return ProcessExitCode.USAGE_OR_INPUT_ERROR;
  }

  if (parsed.kind === "help") {
    const usage = usageText(parsed.verb);
    deps.stdout(parsed.json ? `${JSON.stringify({ schemaVersion: 1, ok: true, kind: "help", usage: [...usage] }, null, 2)}\n` : renderHelp(usage));
    return 0;
  }

  if (parsed.kind === "version") {
    deps.stdout(parsed.json ? renderVersionJson(deps.productVersion, deps.nodeVersion, deps.platform) : renderVersion(deps.productVersion, deps.nodeVersion, deps.platform));
    return 0;
  }

  if (parsed.kind !== "command") {
    // Defensive: every non-command outcome is handled above and returns.
    deps.stderr(renderUsageFailureHuman("unresolved_intent", "Command intent could not be resolved"));
    return ProcessExitCode.USAGE_OR_INPUT_ERROR;
  }

  const ports = buildPorts(deps);
  const runtime = new KernelRuntime(buildRegistry(), ports, {
    identity: { productVersion: deps.productVersion, nodeVersion: deps.nodeVersion, platform: deps.platform, architecture: deps.architecture },
  });
  const request = commandRequestFor(parsed.commandId, parsed.verb, parsed.apply, parsed.targetRef);
  const result = await runtime.execute(request);
  deps.stdout(parsed.json ? renderResultJson(result, parsed.commandId, CLI_CONTRACT_VERSION) : renderResultHuman(result, parsed.commandId));
  return projectExitCode(result);
}

/** Real process entry. */
export async function main(): Promise<void> {
  const write = (stream: NodeJS.WriteStream, text: string): void => {
    stream.write(text);
  };
  const code = await runCli({
    argv: process.argv.slice(2),
    stdout: (text) => write(process.stdout, text),
    stderr: (text) => write(process.stderr, text),
    env: process.env,
    cwd: process.cwd(),
    platform: process.platform,
    nodeVersion: process.version,
    architecture: process.arch,
    productVersion: resolveProductVersion(),
  });
  process.exitCode = code;
}
