/**
 * Result rendering.
 *
 * Rendering is the only output authority of the CLI. Both renderers project the same
 * `GefResult` produced by the kernel runtime; neither reinterprets engine payloads, derives
 * new semantics or invents fields. The JSON envelope is a stable, ordered projection so
 * machine consumers never parse human text.
 *
 * Help *semantics* (the command inventory and its deterministic sorted order) come from the
 * verified `helpIndex` engine; this module only draws the lines.
 */

import type { FailureResult, GefResult, SuccessResult } from "@gef-bootstrap/contracts";
import type { HelpEntry } from "./registry.js";

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

/**
 * Deterministic help text derived from the engine-projected inventory.
 *
 * The entry set and its order are owned by `helpIndex`; a caller that cannot obtain the
 * inventory must not render invented help.
 */
export function renderHelp(entries: readonly HelpEntry[], verb?: string): string {
  const lines: string[] = ["gef - GEF Bootstrap operator surface", "", "Usage: gef <command> [options]", "", "Commands:"];
  const prefix = verb === undefined ? undefined : `gef.${verb}.`;
  for (const entry of entries) {
    if (prefix !== undefined && !entry.id.startsWith(prefix)) continue;
    const width = Math.max(...entries.map((candidate) => candidate.id.length));
    lines.push(`  ${entry.id.padEnd(width)}  ${entry.summary}`);
  }
  lines.push("", "Options:");
  lines.push("  --json              force a machine-readable envelope (automatic when stdout is not a TTY)");
  lines.push("  --apply             run the governed mutation path instead of the safe plan");
  lines.push("  --target <ref>      target project directory");
  lines.push("  -h, --help          show help");
  lines.push("  -V, --version       show version");
  lines.push("", "Not yet available: upgrade.");
  return `${lines.join("\n")}\n`;
}

export function renderHelpJson(entries: readonly HelpEntry[], verb?: string): string {
  const prefix = verb === undefined ? undefined : `gef.${verb}.`;
  const filtered = prefix === undefined ? entries : entries.filter((entry) => entry.id.startsWith(prefix));
  const envelope = { schemaVersion: ENVELOPE_SCHEMA_VERSION, ok: true, kind: "help", commands: filtered.map((entry) => ({ id: entry.id, summary: entry.summary, schema: entry.schema })) };
  return `${JSON.stringify(envelope, null, 2)}\n`;
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

/** Deterministic version projection. */
export function renderVersion(version: string, nodeVersion: string, platform: string): string {
  return `gef ${version}\nnode ${nodeVersion}\nplatform ${platform}\n`;
}

export function renderVersionJson(version: string, nodeVersion: string, platform: string): string {
  const envelope = { schemaVersion: ENVELOPE_SCHEMA_VERSION, ok: true, name: "gef", version, nodeVersion, platform };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}
