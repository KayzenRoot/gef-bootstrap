/**
 * Process boundary.
 *
 * Owns argv/stdout/stderr/exit projection and the composition of the kernel runtime ports.
 * No domain policy lives here: commands are resolved by the parser, executed by the kernel
 * runtime through the registry, and projected by the renderer.
 *
 * Output selection follows the frozen contract: a JSON envelope is emitted when `--json` is
 * present **or** when stdout is not a TTY. The TTY capability is an explicit, injectable input
 * (`RunDependencies.stdoutIsTty`) rather than ambient state read during parsing.
 *
 * The CLI never reads stdin, so a non-TTY invocation cannot block on an implicit prompt.
 */

import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { CommandRequest, GefError } from "@gef-bootstrap/contracts";
import { ProcessExitCode } from "@gef-bootstrap/contracts";
import { KernelRuntime, createGefError, projectExitCode } from "@gef-bootstrap/kernel";
import type { PolicyPort, ReceiptPort, RuntimePorts, TargetBindingPort, VerificationPort } from "@gef-bootstrap/kernel";

import { CLI_CONTRACT_VERSION, parseArgv } from "./parser.js";
import { renderHelp, renderHelpJson, renderResultHuman, renderResultJson, renderUsageFailureHuman, renderUsageFailureJson, renderVersion, renderVersionJson } from "./render.js";
import { buildRegistry, loadEngines, observeTarget } from "./registry.js";
import type { CliVerb, HelpEntry } from "./registry.js";
import { DEFAULT_GIT_TRUST_POLICY, withGitToolInvocation } from "./registry.js";
import type { GitExecutableTrustPolicy } from "./registry.js";
import { UnsupportedDocumentVersionError, buildReceiptDocument, requireSupportedSchemaVersion } from "./schemas.js";
import type { TransactionSummary } from "./schemas.js";
import { applyGovernedCreate } from "./transaction.js";

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
  /** Explicit TTY capability for stdout. Drives the automatic JSON selection. */
  readonly stdoutIsTty: boolean;
  /**
   * Optional injected Git executable trust policy.
   *
   * The default is the frozen platform policy. This is the injection point for embeddings and for
   * tests that must exercise physical-trust behaviour with a temporary root instead of writing into
   * real system locations; it is deliberately **not** an environment variable, so no ambient value
   * can widen the trusted set.
   */
  readonly gitExecutablePolicy?: GitExecutableTrustPolicy;
  /**
   * Optional hook invoked once this invocation's Git authority is bound and before any command
   * runs. Embeddings use it to observe the binding; tests use it as a synchronisation barrier to
   * hold two invocations open at once deterministically, without sleeping.
   */
  readonly onGitInvocationScoped?: () => Promise<void> | void;
}

/**
 * Run identity factory.
 *
 * Identities must be unique across invocations: a receipt is persisted under `<runId>.json`,
 * so a repeating id would collide with a previous run's receipt. The per-process nonce is
 * drawn once, so ids stay stable within a single invocation while differing between them.
 */
function idFactory(): { nextId(prefix: string): string } {
  const nonce = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}`;
  let counter = 0;
  return {
    nextId(prefix: string): string {
      counter += 1;
      return `${prefix}-${counter.toString(36)}-${createHash("sha256").update(`${prefix}:${counter}:${nonce}`).digest("hex").slice(0, 12)}`;
    },
  };
}

function cliError(params: { readonly category: GefError["category"]; readonly reason: string; readonly summary: string; readonly commandId: string; readonly runId: string; readonly terminal?: Exclude<GefError["terminal"], undefined> }): GefError {
  return createGefError({
    id: `cli-${params.reason}`,
    category: params.category,
    reason: params.reason,
    severity: "ERROR",
    summary: params.summary,
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    terminal: params.terminal ?? "BLOCKED",
    commandId: params.commandId,
    runId: params.runId,
  });
}

function buildPorts(deps: RunDependencies): RuntimePorts {
  const ids = idFactory();

  const policy: PolicyPort = {
    async check(context) {
      if (!context.mutation) return { ok: true };
      try {
        const engines = await loadEngines();
        const decision = engines.safetyDecision({ classification: "MUTATING", blastRadius: "known", requested: "AUTO", restricted: false });
        if (decision.state !== "READY" || decision.confirmation === "FORBIDDEN") {
          return { ok: false, error: cliError({ category: "POLICY", reason: "mutation_not_authorized", summary: "Mutation is not authorized by the safety policy", commandId: context.commandId, runId: context.runId }) };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: cliError({ category: "CAPABILITY", reason: "safety_engine_unavailable", summary: "Safety engine is unavailable; mutation refused", commandId: context.commandId, runId: context.runId }) };
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
      if (value === null || typeof value !== "object") {
        return { ok: false, error: cliError({ category: "VERIFICATION", reason: "mutation_produced_no_document", summary: "Mutation produced no document to verify", commandId: request.commandId, runId: request.runId }) };
      }
      const record = value as { readonly artifactRef?: unknown; readonly document?: unknown; readonly transaction?: { readonly postFingerprint?: unknown } };
      if (typeof record.artifactRef !== "string" || request.target === undefined) {
        return { ok: false, error: cliError({ category: "VERIFICATION", reason: "mutation_receipt_malformed", summary: "Mutation result is missing its artifact binding", commandId: request.commandId, runId: request.runId }) };
      }
      const expected = record.transaction?.postFingerprint;
      let body: Buffer;
      try {
        body = readFileSync(resolve(request.target.targetRef, record.artifactRef));
      } catch {
        return { ok: false, error: cliError({ category: "VERIFICATION", reason: "artifact_unreadable", summary: "Written artifact could not be read back", commandId: request.commandId, runId: request.runId, terminal: "RECOVERY_REQUIRED" }) };
      }
      const observed = createHash("sha256").update(body).digest("hex");
      if (typeof expected !== "string" || observed !== expected) {
        return {
          ok: false,
          error: createGefError({
            id: "cli-artifact-fingerprint-mismatch",
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
            metadata: { artifactRef: record.artifactRef, expected: expected ?? null, observed },
          }),
        };
      }
      // Consuming a persisted document enforces its schema version contract and fails closed
      // on an unsupported major version.
      try {
        requireSupportedSchemaVersion(JSON.parse(body.toString("utf8")));
      } catch (cause: unknown) {
        if (cause instanceof UnsupportedDocumentVersionError) {
          return { ok: false, error: cliError({ category: "INTEGRITY", reason: "unsupported_document_version", summary: "Persisted document uses an unsupported schema version", commandId: request.commandId, runId: request.runId, terminal: "RECOVERY_REQUIRED" }) };
        }
        return { ok: false, error: cliError({ category: "VERIFICATION", reason: "document_not_parseable", summary: "Persisted document is not parseable JSON", commandId: request.commandId, runId: request.runId, terminal: "RECOVERY_REQUIRED" }) };
      }
      return { ok: true };
    },
  };

  const receipts: ReceiptPort = {
    async write(request) {
      if (request.target === undefined) {
        return { ok: false, error: cliError({ category: "PRECONDITION", reason: "receipt_target_missing", summary: "Receipt requires a bound target", commandId: request.commandId, runId: request.runId, terminal: "RECOVERY_REQUIRED" }) };
      }
      const value = request.value;
      const record = value !== null && typeof value === "object" ? (value as { readonly transaction?: { readonly planDigest?: unknown; readonly receiptDigest?: unknown; readonly outcome?: unknown; readonly postFingerprint?: unknown } }) : {};
      const transactionRecord = record.transaction ?? {};
      if (typeof transactionRecord.planDigest !== "string" || (transactionRecord.outcome !== "APPLIED" && transactionRecord.outcome !== "NOOP_APPLIED")) {
        return { ok: false, error: cliError({ category: "PRECONDITION", reason: "receipt_transaction_missing", summary: "Receipt requires a completed transaction summary", commandId: request.commandId, runId: request.runId, terminal: "RECOVERY_REQUIRED" }) };
      }
      const transaction: TransactionSummary = {
        planDigest: transactionRecord.planDigest,
        outcome: transactionRecord.outcome,
        ...(typeof transactionRecord.receiptDigest === "string" ? { receiptDigest: transactionRecord.receiptDigest } : {}),
        ...(typeof transactionRecord.postFingerprint === "string" ? { postFingerprint: transactionRecord.postFingerprint } : {}),
      };
      const document = buildReceiptDocument({
        runId: request.runId,
        commandId: request.commandId,
        contractVersion: CLI_CONTRACT_VERSION,
        productVersion: deps.productVersion,
        effectStatus: request.effectStatus,
        lifecyclePhases: request.lifecyclePhases,
        resultDigest: createHash("sha256").update(JSON.stringify(value)).digest("hex"),
        transaction,
      });

      // Receipt persistence uses the same governed transaction path as the state artifact:
      // there is no ungoverned filesystem side channel.
      const relative = `${GEF_STATE_DIRECTORY}/${RECEIPTS_DIRECTORY}/${request.runId}.json`;
      const applied = await applyGovernedCreate({
        targetRoot: request.target.targetRef,
        relativePath: relative,
        content: `${JSON.stringify(document, null, 2)}\n`,
        contentFingerprint: createHash("sha256").update(`${JSON.stringify(document, null, 2)}\n`).digest("hex"),
        runId: request.runId,
        transactionId: `${request.runId}:receipt`,
        policyRef: "cli:receipt:managed-write:v1",
        moduleOwner: "cli.transport",
        commandId: request.commandId,
        // Receipt persistence has its own admitted purpose; it never borrows the state purpose.
        purpose: request.commandId === "gef.upgrade.apply" ? "RECEIPT_UPGRADE" : request.commandId === "gef.adopt.apply" ? "RECEIPT_ADOPT" : "RECEIPT_INIT",
      });
      if (!applied.ok) {
        const error = applied.error ?? cliError({ category: "RECOVERY", reason: "receipt_transaction_failed", summary: "Receipt transaction did not apply", commandId: request.commandId, runId: request.runId, terminal: "RECOVERY_REQUIRED" });
        return { ok: false, error };
      }
      return { ok: true, receiptRef: `${relative}#${(applied.postFingerprint ?? "").slice(0, 16)}` };
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
  // Read-only commands declare no mutation intent, so their input carries no apply flag at all.
  const readOnly = verb === "doctor" || verb === "status";
  return {
    commandId,
    contractVersion: CLI_CONTRACT_VERSION,
    input: { verb, ...(readOnly ? {} : { apply }), ...(targetRef === undefined ? {} : { targetRef }) },
  };
}

async function helpEntries(): Promise<readonly HelpEntry[]> {
  const { HELP_INVENTORY } = await import("./registry.js");
  const engines = await loadEngines();
  return engines.helpIndex(HELP_INVENTORY);
}

/** Execute one CLI invocation and return the projected process exit code. */
export async function runCli(deps: RunDependencies): Promise<number> {
  // One invocation owns its Git authority. The binding follows the asynchronous chain, so
  // overlapping invocations in the same process cannot observe each other's policy, port or
  // executable, and nested or out-of-order completion changes nothing.
  return withGitToolInvocation(deps.gitExecutablePolicy ?? DEFAULT_GIT_TRUST_POLICY, async () => {
    // Optional embedding/test seam: lets a caller observe or synchronise on the point where this
    // invocation's authority is already bound and no command has run yet.
    if (deps.onGitInvocationScoped !== undefined) await deps.onGitInvocationScoped();
    return runCliWithinInvocation(deps);
  });
}

async function runCliWithinInvocation(deps: RunDependencies): Promise<number> {
  const parsed = parseArgv(deps.argv);
  // Frozen output contract: JSON when explicitly requested, or automatically when stdout is
  // not a TTY. The capability is injected, never sniffed inside pure parsing.
  const useJson = parsed.json || !deps.stdoutIsTty;

  if (parsed.kind === "failure") {
    deps.stderr(useJson ? renderUsageFailureJson(parsed.reason, parsed.summary) : renderUsageFailureHuman(parsed.reason, parsed.summary));
    return ProcessExitCode.USAGE_OR_INPUT_ERROR;
  }

  if (parsed.kind === "help") {
    try {
      const entries = await helpEntries();
      deps.stdout(useJson ? renderHelpJson(entries, parsed.verb) : renderHelp(entries, parsed.verb));
      return ProcessExitCode.SUCCESS;
    } catch (cause: unknown) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      deps.stderr(useJson ? renderUsageFailureJson("help_inventory_unavailable", `Help inventory is unavailable: ${detail}`) : renderUsageFailureHuman("help_inventory_unavailable", "Help inventory is unavailable"));
      return ProcessExitCode.DEPENDENCY_OR_CAPABILITY_FAILURE;
    }
  }

  if (parsed.kind === "version") {
    deps.stdout(useJson ? renderVersionJson(deps.productVersion, deps.nodeVersion, deps.platform) : renderVersion(deps.productVersion, deps.nodeVersion, deps.platform));
    return ProcessExitCode.SUCCESS;
  }

  if (parsed.kind !== "command") {
    deps.stderr(renderUsageFailureHuman("unresolved_intent", "Command intent could not be resolved"));
    return ProcessExitCode.USAGE_OR_INPUT_ERROR;
  }

  const runtime = new KernelRuntime(buildRegistry(), buildPorts(deps), {
    identity: { productVersion: deps.productVersion, nodeVersion: deps.nodeVersion, platform: deps.platform, architecture: deps.architecture },
  });
  const request = commandRequestFor(parsed.commandId, parsed.verb, parsed.apply, parsed.targetRef);
  const result = await runtime.execute(request);
  deps.stdout(useJson ? renderResultJson(result, parsed.commandId, CLI_CONTRACT_VERSION) : renderResultHuman(result, parsed.commandId));
  return projectExitCode(result);
}

/** Real process entry. */
export async function main(): Promise<void> {
  const code = await runCli({
    argv: process.argv.slice(2),
    stdout: (text) => {
      process.stdout.write(text);
    },
    stderr: (text) => {
      process.stderr.write(text);
    },
    env: process.env,
    cwd: process.cwd(),
    platform: process.platform,
    nodeVersion: process.version,
    architecture: process.arch,
    productVersion: resolveProductVersion(),
    stdoutIsTty: process.stdout.isTTY === true,
  });
  process.exitCode = code;
}
