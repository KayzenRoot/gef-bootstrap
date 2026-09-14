// M16 Policy & Guardrail Engine - utils.ts
// Shared deterministic utilities. No side effects.

import type { Diagnostic, OperationOptions, Result } from './types.js';

export const DEFAULT_MAX_NODES = 2048;
export const DEFAULT_MAX_EDGES = 8192;
export const DEFAULT_MAX_DEPTH = 64;

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

export function compareCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function validId(value: string): boolean {
  return ID_RE.test(value);
}

export function safeLimit(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.min(value ?? fallback, fallback));
}

export function fail<T>(code: string, message: string, subject?: string): Result<T> {
  const diagnostic: Diagnostic = subject === undefined ? { code, message } : { code, message, subject };
  return { ok: false, diagnostics: [diagnostic] };
}

export function cancelled(options?: OperationOptions): Result<never> | null {
  return options?.cancellation?.isCancelled() ? fail('CANCELLED', 'Operation cancelled') : null;
}

/** Canonical JSON serialization: sorted keys, stable ordering. */
export function canonical(value: unknown, seen = new Set<object>()): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  const objectValue = value as object;
  if (seen.has(objectValue)) throw new Error('CANONICAL_CYCLE');
  seen.add(objectValue);
  try {
    if (Array.isArray(value)) return '[' + value.map(v => canonical(v, seen)).join(',') + ']';
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new Error('UNSUPPORTED_PROTOTYPE');
    const obj = value as Record<string, unknown>;
    return '{' + Object.keys(obj).sort(compareCodePoint).map(k => JSON.stringify(k) + ':' + canonical(obj[k], seen)).join(',') + '}';
  } finally {
    seen.delete(objectValue);
  }
}

/** Compute SHA-256 semantic digest via injected capability. */
export function sha(options: OperationOptions, value: unknown): Result<string> {
  if (!options.digest || options.digest.algorithm !== 'sha256' || typeof options.digest.digest !== 'function') {
    return fail('DIGEST_CAPABILITY_INVALID', 'Injected SHA-256 digest capability is required');
  }
  try {
    const output = options.digest.digest(canonical(value));
    if (!/^[a-fA-F0-9]{64}$/.test(output)) {
      return fail('DIGEST_RESULT_INVALID', 'Digest capability must return 64 hexadecimal characters');
    }
    return { ok: true, value: `sha256:${output.toLowerCase()}` };
  } catch (error) {
    const code =
      error instanceof Error && error.message === 'CANONICAL_CYCLE' ? 'INPUT_CYCLE' :
      error instanceof Error && error.message === 'UNSUPPORTED_PROTOTYPE' ? 'UNSUPPORTED_PROTOTYPE' :
      'DIGEST_CAPABILITY_FAILURE';
    return fail(code, 'Unable to compute deterministic semantic digest');
  }
}

/** Deep-freeze an object graph. */
export function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (!value || typeof value !== 'object') return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  Object.freeze(objectValue);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child, seen);
  return value;
}

/** Sort strings by code point without dedup check. */
export function sortedStrings(values: readonly string[]): readonly string[] {
  return [...values].sort(compareCodePoint);
}
