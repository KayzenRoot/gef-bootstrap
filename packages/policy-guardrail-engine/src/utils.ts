import type { Diagnostic, OperationOptions, Result } from './types.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
export function compareCodePoint(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
export function validId(v: string): boolean { return ID_RE.test(v); }
export function sortedUnique(values: readonly string[]): readonly string[] { return [...new Set(values)].sort(compareCodePoint); }
export function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  const x = sortedUnique(a); const y = sortedUnique(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}
export function isSubset(a: readonly string[], b: readonly string[]): boolean { const s = new Set(b); return a.every(v => s.has(v)); }
export function intersects(a: readonly string[], b: readonly string[]): boolean { const s = new Set(b); return a.some(v => s.has(v)); }
export function fail<T>(code: string, message: string, subject?: string): Result<T> {
  const d: Diagnostic = subject === undefined ? { code, message } : { code, message, subject };
  return { ok: false, diagnostics: [d] };
}
export function cancelled(options: OperationOptions): Result<never> | null { return options.cancellation?.isCancelled() ? fail('CANCELLED', 'Operation cancelled') : null; }
export function canonical(value: unknown, seen = new Set<object>()): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  const o = value as object;
  if (seen.has(o)) throw new Error('CANONICAL_CYCLE');
  seen.add(o);
  try {
    if (Array.isArray(value)) return '[' + value.map(v => canonical(v, seen)).join(',') + ']';
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new Error('UNSUPPORTED_PROTOTYPE');
    const obj = value as Record<string, unknown>;
    return '{' + Object.keys(obj).sort(compareCodePoint).map(k => JSON.stringify(k) + ':' + canonical(obj[k], seen)).join(',') + '}';
  } finally { seen.delete(o); }
}
export function sha(options: OperationOptions, value: unknown): Result<string> {
  if (!options.digest || options.digest.algorithm !== 'sha256' || typeof options.digest.digest !== 'function') return fail('DIGEST_CAPABILITY_INVALID', 'Injected SHA-256 digest capability is required');
  try {
    const output = options.digest.digest(canonical(value));
    if (!/^[a-fA-F0-9]{64}$/.test(output)) return fail('DIGEST_RESULT_INVALID', 'Digest capability must return 64 hexadecimal characters');
    return { ok: true, value: `sha256:${output.toLowerCase()}` };
  } catch { return fail('DIGEST_CAPABILITY_FAILURE', 'Unable to compute deterministic semantic digest'); }
}
export function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (!value || typeof value !== 'object') return value;
  const o = value as object; if (seen.has(o)) return value; seen.add(o); Object.freeze(o);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child, seen);
  return value;
}
