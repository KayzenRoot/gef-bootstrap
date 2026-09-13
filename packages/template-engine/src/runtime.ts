import type { TemplateBudgets, TemplateControl, TemplateError, TemplateResult } from "./types.js";

export const TEMPLATE_SCHEMA_VERSION = 1 as const;
export const TEMPLATE_CONTRACT_VERSION = "1.0" as const;
export const VARIABLE_CONTRACT_VERSION = "1.0" as const;
export const CONDITION_CONTRACT_VERSION = "1.0" as const;
export const RENDER_CONTRACT_VERSION = "1.0" as const;
export const VALIDATION_CONTRACT_VERSION = "1.0" as const;

export const DEFAULT_TEMPLATE_BUDGETS: TemplateBudgets = Object.freeze({
  maxManifestBytes: 256 * 1024,
  maxEntries: 512,
  maxSourceBytes: 4 * 1024 * 1024,
  maxAggregateSourceBytes: 32 * 1024 * 1024,
  maxMarkers: 32768,
  maxMarkerLength: 256,
  maxNestingDepth: 64,
  maxVariables: 1024,
  maxBindings: 2048,
  maxValueBytes: 1024 * 1024,
  maxRenderedBytesPerEntry: 8 * 1024 * 1024,
  maxRenderedBytesTotal: 64 * 1024 * 1024,
  maxTargetBytes: 4096,
  maxTargetComponents: 128,
  maxEvidenceEntries: 65536,
});

export function templateError(code: string, stage: TemplateError["stage"], summary: string, ref?: string): TemplateError {
  return ref === undefined ? { code, stage, summary } : { code, stage, summary, ref };
}

export function fail<T>(code: string, stage: TemplateError["stage"], summary: string, ref?: string): TemplateResult<T> {
  return { ok: false, error: templateError(code, stage, summary, ref) };
}

export function checkControl(control: TemplateControl, stage: TemplateError["stage"]): TemplateResult<true> {
  if (control.signal?.aborted) return fail("TEMPLATE_CANCELLED", stage, "Template operation was cancelled.");
  if (control.deadlineMs !== undefined) {
    if (!control.nowMs) return fail("CONTROL_CLOCK_REQUIRED", "CONTROL", "A deadline requires an injected clock.");
    if (control.nowMs() >= control.deadlineMs) return fail("TEMPLATE_DEADLINE_EXCEEDED", stage, "Template operation deadline was exceeded.");
  }
  return { ok: true, value: true };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value).sort()) result[key] = canonicalize(value[key]);
  return result;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function utf8Length(value: string): number {
  return encodeUtf8(value).byteLength;
}

export function decodeUtf8(bytes: Uint8Array): TemplateResult<string> {
  try {
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes) };
  } catch {
    return fail("UTF8_INVALID", "FORMAT", "Input is not valid UTF-8.");
  }
}

export function hasUtf8Bom(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

export function freezeBytes(bytes: Uint8Array): readonly number[] {
  return Object.freeze(Array.from(bytes));
}

export function thawBytes(bytes: readonly number[]): Uint8Array {
  return Uint8Array.from(bytes);
}

const SIMPLE_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const DOTTED_ID = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/u;
const INVALID_PORTABLE = /[<>:"|?*]/u;

export function validSimpleId(value: string): boolean {
  return value.length <= 64 && SIMPLE_ID.test(value);
}

export function validVariableId(value: string): boolean {
  if (value.length > 128 || !DOTTED_ID.test(value)) return false;
  const segments = value.split(".");
  return segments.every((segment) => segment.length <= 32);
}

export function validTemplateVariableDeclarationId(value: string): boolean {
  return validVariableId(value) && value.split(".")[0] !== "gef";
}

export function validSemver(value: string): boolean {
  return value.length <= 128 && SEMVER.test(value);
}

export function validPortableSegment(value: string): boolean {
  if (value.length === 0 || value.normalize("NFC") !== value) return false;
  if (value === "." || value === ".." || value.trim() !== value) return false;
  if (value.endsWith(".") || value.endsWith(" ")) return false;
  if (value.includes("/") || value.includes("\\") || CONTROL_CHARS.test(value) || INVALID_PORTABLE.test(value)) return false;
  const stem = value.split(".", 1)[0] ?? "";
  return !WINDOWS_RESERVED.test(stem);
}

export function validateLogicalFileTarget(target: string, budgets: TemplateBudgets): boolean {
  if (target.length === 0 || target.startsWith("/") || target.endsWith("/") || target.includes("\\")) return false;
  if (/^[A-Za-z]:/.test(target) || target.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(target)) return false;
  if (utf8Length(target) > budgets.maxTargetBytes) return false;
  const parts = target.split("/");
  if (parts.length > budgets.maxTargetComponents) return false;
  return parts.every(validPortableSegment);
}

export function validateSourceRef(ref: string, budgets: TemplateBudgets): boolean {
  if (!ref.startsWith("content/") || !validateLogicalFileTarget(ref, budgets)) return false;
  return ref.split("/").length >= 2;
}

export function asciiFoldTarget(target: string): string {
  return target.replace(/[A-Z]/g, (char) => char.toLowerCase());
}

export function canonicalInteger(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}
