import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';

const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
export const digest = (domain, value) => createHash('sha256').update(`${domain}\0${JSON.stringify(stable(value))}`).digest('hex');

export function createGithubSimulation(seed = 'gef') {
  return { seed, revision: 0, resources: {}, actions: [], digest: digest('GSM55', { seed, revision: 0, resources: {} }) };
}
export function simulateGithub(state, action, permission = 'WRITE') {
  const before = structuredClone(state);
  if (permission === 'UNKNOWN' || permission === 'NONE') return { state: before, result: permission === 'UNKNOWN' ? 'UNKNOWN' : 'FORBIDDEN', mutated: false };
  if (!action?.type || !action?.id) return { state: before, result: 'INVALID', mutated: false };
  const next = structuredClone(state);
  if (action.expectedRevision !== undefined && action.expectedRevision !== state.revision) return { state: before, result: 'CONFLICT', mutated: false };
  if (action.type === 'CREATE') {
    if (next.resources[action.id]) return { state: before, result: 'CONFLICT', mutated: false };
    next.resources[action.id] = stable(action.value ?? {});
  } else if (action.type === 'UPDATE') {
    if (!next.resources[action.id]) return { state: before, result: 'NOT_FOUND', mutated: false };
    next.resources[action.id] = stable(action.value ?? {});
  } else if (action.type === 'DELETE') {
    if (!next.resources[action.id]) return { state: before, result: 'NOT_FOUND', mutated: false };
    delete next.resources[action.id];
  } else return { state: before, result: 'CAPABILITY_GAP', mutated: false };
  next.revision++;
  next.actions.push(stable(action));
  next.digest = digest('GSM55', { seed: next.seed, revision: next.revision, resources: next.resources, actions: next.actions });
  return { state: next, result: 'OK', mutated: true };
}

export function retryPlan(kind, maxAttempts = 3) {
  const allowed = new Set(['SAFE_READ', 'IDEMPOTENT_WRITE', 'RECONCILE_THEN_RETRY']);
  return { kind, maxAttempts: allowed.has(kind) ? Math.max(1, Math.min(maxAttempts, 8)) : 1, requiresReconciliation: kind === 'RECONCILE_THEN_RETRY' };
}

export function e2eReceipt(scenario, phases) {
  const normalized = phases.map((phase, index) => ({ index, phase: phase.phase, status: phase.status, digest: digest('E2E_PHASE', phase) }));
  return { scenario, phases: normalized, status: normalized.every(x => x.status === 'PASS') ? 'PASS' : 'FAIL', digest: digest('E2E56', { scenario, normalized }) };
}

export function benchmarkSummary(samples = []) {
  if (!samples.length || samples.some(x => !Number.isFinite(x) || x < 0)) return { verdict: 'INSUFFICIENT_DATA' };
  const sorted = [...samples].sort((a,b)=>a-b);
  const q = p => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return { n: sorted.length, median: q(.5), p90: q(.9), p95: q(.95), min: sorted[0], max: sorted.at(-1) };
}
export function performanceGate(baseline, candidate, threshold = 0.15) {
  if (!baseline?.population || baseline.population !== candidate?.population) return { verdict: 'INCOMPARABLE' };
  if (!baseline.median || !candidate?.median) return { verdict: 'INSUFFICIENT_DATA' };
  const delta = (candidate.median - baseline.median) / baseline.median;
  return { verdict: delta > threshold ? 'REGRESSION' : delta < -threshold ? 'IMPROVEMENT' : 'PASS', delta };
}

export function containedPath(root, candidate) {
  const base = resolve(root), target = resolve(base, candidate), rel = relative(base, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
export function redactSecrets(value, secrets = []) {
  let text = typeof value === 'string' ? value : JSON.stringify(value);
  for (const secret of secrets.filter(Boolean).sort((a,b)=>b.length-a.length)) text = text.split(secret).join('[REDACTED]');
  return text;
}
export function validateConfig(config, { maxDepth = 12, maxKeys = 1000 } = {}) {
  let keys = 0;
  const walk = (v, depth) => {
    if (depth > maxDepth) return false;
    if (!v || typeof v !== 'object') return true;
    for (const [k, child] of Object.entries(v)) {
      keys++; if (keys > maxKeys || ['__proto__','prototype','constructor'].includes(k)) return false;
      if (!walk(child, depth + 1)) return false;
    }
    return true;
  };
  return { valid: walk(config, 0), keys };
}

export function documentationManifest(entries = []) {
  const normalized = entries.map(x => ({ id: x.id, source: x.source, version: x.version, digest: digest('DOC_ENTRY', x) })).sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return { entries: normalized, digest: digest('DOC_MANIFEST', normalized) };
}
export function runbookDecision(finding) {
  const table = {
    BOOTSTRAP_AMBIGUOUS: ['PRESERVE_EVIDENCE','DOCTOR_READ_ONLY','RECONCILE'],
    RECOVERY_JOURNAL_CONFLICT: ['STOP_WRITES','PRESERVE_EVIDENCE','MANUAL_ACTION_REQUIRED'],
    UPGRADE_STALE_PREVIEW: ['STOP','REGENERATE_PREVIEW'],
    GITHUB_CAPABILITY_GAP: ['DETECT_CAPABILITIES','LEAST_PRIVILEGE_REMEDIATION','VERIFY']
  };
  return { finding, steps: table[finding] ?? ['PRESERVE_EVIDENCE','INDETERMINATE'], automatic: false };
}
