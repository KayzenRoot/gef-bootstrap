/**
 * Result rendering.
 *
 * Rendering is the only output authority of the CLI. Both renderers project the same
 * `GefResult` produced by the kernel runtime; neither reinterprets engine payloads,
 * derives new semantics or invents fields. The JSON envelope is a stable, ordered
 * projection so machine consumers never parse human text.
 */

import type { FailureResult, GefResult, SuccessResult } from "@gef-bootstrap/contracts";

export const ENVELOPE_SCHEMA_VERSION = 1;

export interface JsonEnvelope {
  readonly schemaVersion: number;
  readonly ok: boolean;
  readonly commandId: string;
  readonly contractVersion: string;
  readonly terminal: string;
  readonly value?: unknown;
  readonly error?: JsonErrorProjection;
}

export interface JsonErrorProjection {
  readonly id: string;
  readonly category: string;
  readonly reasonCode: string;
  readonly severity: string;
  readonly summary: string;
  readonly retryability: string;
  readonly recoverability: string;
  readonly effectStatus: string;
  readonly causes: readonly { readonly id: string; readonly reasonCode: string; readonly summary: string }[];
  readonly remediations: readonly { readonly actionId: string; readonly parameters?: Readonly<Record<string, unknown>> }[];
}

function projectError(error: FailureResult["error"]): JsonErrorProjection {
  return {
    id: error.id,
    category: error.category,
    reasonCode: error.reasonCode,
    severity: error.severity,
    summary: error.summary,
    retryability: error.retryability,
    recoverability: error.recoverability,
    effectStatus: error.effectStatus,
    causes: error.causes.map((cause) => ({ id: cause.id, reasonCode: cause.reasonCode, summary: cause.summary })),
    remediations: error.remediations.map((action) => ({
      actionId: action.actionId,
      ...(action.parameters === undefined ? {} : { parameters: action.parameters }),
    })),
  };
}

/** Stable, ordered JSON projection of a kernel result. */
export function resultEnvelope(result: GefResult<unknown>, commandId: string, contractVersion: string): JsonEnvelope {
  const ok = result.ok;
  const terminal = result.lifecycle.terminal;
  if (result.ok) {
    const success: SuccessResult<unknown> = result;
    return { schemaVersion: ENVELOPE_SCHEMA_VERSION, ok, commandId, contractVersion, terminal, value: success.value };
  }
  return { schemaVersion: ENVELOPE_SCHEMA_VERSION, ok, commandId, contractVersion, terminal, error: projectError(result.error) };
}

export function renderResultJson(result: GefResult<unknown>, commandId: string, contractVersion: string): string {
  return `${JSON.stringify(resultEnvelope(result, commandId, contractVersion), null, 2)}\n`;
}

/** Human projection of the same result. Summarises; it does not add meaning. */
export function renderResultHuman(result: GefResult<unknown>, commandId: string): string {
  const lines: string[] = [];
  if (result.ok) {
    lines.push(`${commandId}: ${result.lifecycle.terminal}`);
    lines.push(JSON.stringify(result.value, null, 2));
    return `${lines.join("\n")}\n`;
  }
  lines.push(`${commandId}: ${result.lifecycle.terminal}`);
  lines.push(`  category    ${result.error.category}`);
  lines.push(`  reason      ${result.error.reasonCode}`);
  lines.push(`  summary     ${result.error.summary}`);
  lines.push(`  retry       ${result.error.retryability}`);
  lines.push(`  recovery    ${result.error.recoverability}`);
  for (const remediation of result.error.remediations) lines.push(`  remediation ${remediation.actionId}`);
  return `${lines.join("\n")}\n`;
}

export function renderLines(lines: readonly string[]): string {
  return `${lines.join("\n")}\n`;
}

/** A usage/input failure is rendered here rather than through the kernel, because no command was resolved. */
export function renderUsageFailureJson(reason: string, summary: string): string {
  const envelope = {
    schemaVersion: ENVELOPE_SCHEMA_VERSION,
    ok: false,
    commandId: null,
    contractVersion: null,
    terminal: "BLOCKED",
    error: { category: "INPUT", reasonCode: `gef.input.${reason}`, summary },
  };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export function renderUsageFailureHuman(reason: string, summary: string): string {
  return `gef: ${summary}\nRun 'gef --help' for usage.\n(gef.input.${reason})\n`;
}

/** Deterministic help projection, built from parsed metadata only. */
export function renderHelp(usage: readonly string[]): string {
  return renderLines(usage);
}

/** Deterministic version projection. */
export function renderVersion(version: string, nodeVersion: string, platform: string): string {
  return `gef ${version}\nnode ${nodeVersion}\nplatform ${platform}\n`;
}

export function renderVersionJson(version: string, nodeVersion: string, platform: string): string {
  const envelope = { schemaVersion: ENVELOPE_SCHEMA_VERSION, ok: true, name: "gef", version, nodeVersion, platform };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}
