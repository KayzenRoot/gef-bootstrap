export type AuthorityDomain =
  | 'REPOSITORY_STATE' | 'PROJECT_STATE' | 'DECISION' | 'SCOPE' | 'REQUIREMENT'
  | 'ARCHITECTURE' | 'SECURITY' | 'COMPLETION' | 'EXECUTION' | 'VALIDATION'
  | 'PLANNING' | 'FUTURE_WORK' | 'INNOVATION' | 'CONVERSATION' | (string & {});

export type ApplicabilityState = 'ACTIVE' | 'INACTIVE' | 'UNKNOWN' | 'CONTRADICTORY';
export type RequiredState = 'RESOLVED_ACTIVE' | 'RESOLVED_NOT_APPLICABLE' | 'MISSING_REQUIRED' | 'AMBIGUOUS' | 'CONFLICT' | 'INVALID_BINDING';
export type IntegrityState = 'VALID' | 'STALE' | 'INCOMPLETE' | 'CONFLICTED' | 'UNSUPPORTED_VERSION' | 'PROJECT_MISMATCH' | 'INDETERMINATE';

export interface DigestPort { algorithm: 'sha256'; digest(input: string): string; }
export interface CancellationPort { isCancelled(): boolean; }
export interface OperationOptions { digest: DigestPort; cancellation?: CancellationPort; maxEntries?: number; maxEdges?: number; maxDepth?: number; }

export interface Diagnostic { code: string; message: string; subject?: string | undefined; }
export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

export type SourceKind = 'DOCUMENT' | 'SECTION' | 'FACT' | 'DEPENDENCY_SET' | 'TEMPLATE' | 'ALIAS' | 'DORMANT';
export interface SourceEntryInput {
  id: string;
  kind: SourceKind;
  domain: AuthorityDomain;
  locator: string;
  fingerprint: string;
  dependencies?: readonly string[];
  lifecycle?: 'ACTIVE' | 'SUPERSEDED' | 'INACTIVE';
  canonicality?: 'CANONICAL' | 'DERIVED' | 'DESCRIPTIVE';
  applicability?: ApplicabilityState;
  semanticKey?: string;
  supersedes?: readonly string[];
  template?: { templateId: string; version: string; digest?: string };
}

export interface RequirementRule { classId: string; state: 'REQUIRED' | 'CONDITIONAL' | 'NOT_APPLICABLE'; witness?: string | undefined; }
export interface RequirementResolution { classId: string; state: RequiredState; entryIds: readonly string[]; witness?: string | undefined; }

export type Predicate =
  | { op: 'FACT_EQ'; fact: string; value: string | boolean | number }
  | { op: 'ALL'; items: readonly Predicate[] }
  | { op: 'ANY'; items: readonly Predicate[] }
  | { op: 'NOT'; item: Predicate };

export interface ConditionWitness { state: ApplicabilityState; facts: readonly { key: string; value: unknown }[]; }

export interface AuthorityResolutionProof {
  semanticKey: string;
  domain: AuthorityDomain;
  considered: readonly { id: string; excluded?: string }[];
  selected?: string;
  governingRules: readonly string[];
}

export interface IntegrityLayers { structural: IntegrityState; source: IntegrityState; authority: IntegrityState; applicability: IntegrityState; overall: IntegrityState; }

export interface SourcePackSnapshot {
  schemaVersion: 1;
  projectId: string;
  entries: readonly Readonly<SourceEntryInput>[];
  requirementResolutions: readonly RequirementResolution[];
  semanticIdentity: string;
  integrityEpoch: string;
  constitutionFingerprint?: string;
  receiptSeed: Readonly<{ projectId: string; semanticIdentity: string; unresolved: readonly string[]; }>;
}

const DEFAULT_MAX_ENTRIES = 2048;
const DEFAULT_MAX_EDGES = 8192;
const DEFAULT_MAX_DEPTH = 64;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

function fail<T>(code: string, message: string, subject?: string): Result<T> { return { ok: false, diagnostics: [{ code, message, subject }] }; }
function cancelled(options: OperationOptions): Result<never> | null { return options.cancellation?.isCancelled() ? fail('CANCELLED', 'Operation cancelled') : null; }
function safeLimit(value: number | undefined, fallback: number): number { return Math.max(1, Math.min(value ?? fallback, fallback)); }
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const obj = value as Record<string, unknown>;
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
}
function digest(options: OperationOptions, value: unknown): Result<string> {
  if (!options.digest || options.digest.algorithm !== 'sha256' || typeof options.digest.digest !== 'function') return fail('DIGEST_CAPABILITY_INVALID', 'Injected SHA-256 digest capability is required');
  try {
    const out = options.digest.digest(canonical(value));
    if (!/^[a-fA-F0-9]{64}$/.test(out)) return fail('DIGEST_RESULT_INVALID', 'Digest capability must return 64 hex characters');
    return { ok: true, value: `sha256:${out.toLowerCase()}` };
  } catch { return fail('DIGEST_CAPABILITY_FAILURE', 'Digest capability failed'); }
}
function frozen<T>(value: T): T { if (value && typeof value === 'object') { Object.freeze(value); for (const v of Object.values(value as Record<string, unknown>)) frozen(v); } return value; }

function validateEntry(entry: SourceEntryInput): Diagnostic[] {
  const d: Diagnostic[] = [];
  if (!ID_RE.test(entry.id)) d.push({ code: 'ENTRY_ID_INVALID', message: 'Invalid source entry id', subject: entry.id });
  if (!entry.domain || !entry.locator || !entry.fingerprint) d.push({ code: 'ENTRY_REQUIRED_FIELD_MISSING', message: 'domain, locator and fingerprint are required', subject: entry.id });
  if (entry.dependencies?.includes(entry.id)) d.push({ code: 'SELF_DEPENDENCY', message: 'Entry cannot depend on itself', subject: entry.id });
  return d;
}

function validateGraph(entries: readonly SourceEntryInput[], options: OperationOptions): Result<void> {
  const byId = new Map(entries.map(e => [e.id, e] as const));
  let edges = 0;
  for (const e of entries) {
    edges += e.dependencies?.length ?? 0;
    if (edges > safeLimit(options.maxEdges, DEFAULT_MAX_EDGES)) return fail('EDGE_BUDGET_EXCEEDED', 'Source topology edge budget exceeded');
    for (const dep of e.dependencies ?? []) if (!byId.has(dep)) return fail('DEPENDENCY_NOT_FOUND', `Dependency ${dep} not found`, e.id);
  }
  const visiting = new Set<string>(); const done = new Set<string>();
  const walk = (id: string, depth: number): Result<void> => {
    if (options.cancellation?.isCancelled()) return fail('CANCELLED', 'Operation cancelled');
    if (depth > safeLimit(options.maxDepth, DEFAULT_MAX_DEPTH)) return fail('DEPTH_BUDGET_EXCEEDED', 'Source topology depth budget exceeded', id);
    if (visiting.has(id)) return fail('TOPOLOGY_CYCLE', 'Dependency cycle detected', id);
    if (done.has(id)) return { ok: true, value: undefined };
    visiting.add(id);
    for (const dep of byId.get(id)?.dependencies ?? []) { const r = walk(dep, depth + 1); if (!r.ok) return r; }
    visiting.delete(id); done.add(id); return { ok: true, value: undefined };
  };
  for (const e of entries) { const r = walk(e.id, 0); if (!r.ok) return r; }
  return { ok: true, value: undefined };
}

export function evaluateApplicability(predicate: Predicate, facts: Readonly<Record<string, unknown>>): ConditionWitness {
  const used = new Map<string, unknown>();
  const evalOne = (p: Predicate): ApplicabilityState => {
    if (p.op === 'FACT_EQ') {
      if (!Object.prototype.hasOwnProperty.call(facts, p.fact)) return 'UNKNOWN';
      const value = facts[p.fact]; used.set(p.fact, value);
      return Object.is(value, p.value) ? 'ACTIVE' : 'INACTIVE';
    }
    if (p.op === 'NOT') { const s = evalOne(p.item); return s === 'ACTIVE' ? 'INACTIVE' : s === 'INACTIVE' ? 'ACTIVE' : s; }
    const states = p.items.map(evalOne);
    if (states.includes('CONTRADICTORY')) return 'CONTRADICTORY';
    if (p.op === 'ALL') {
      if (states.includes('INACTIVE')) return 'INACTIVE';
      if (states.includes('UNKNOWN')) return 'UNKNOWN';
      return 'ACTIVE';
    }
    if (states.includes('ACTIVE')) return 'ACTIVE';
    if (states.includes('UNKNOWN')) return 'UNKNOWN';
    return 'INACTIVE';
  };
  const state = evalOne(predicate);
  return frozen({ state, facts: [...used.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([key,value]) => ({ key, value })) });
}

export function evaluateRequirements(rules: readonly RequirementRule[], entries: readonly SourceEntryInput[]): readonly RequirementResolution[] {
  const byKey = new Map<string, SourceEntryInput[]>();
  for (const e of entries) if (e.semanticKey) { const list = byKey.get(e.semanticKey) ?? []; list.push(e); byKey.set(e.semanticKey, list); }
  return frozen([...rules].sort((a,b) => a.classId.localeCompare(b.classId)).map(rule => {
    const candidates = (byKey.get(rule.classId) ?? []).filter(e => e.lifecycle !== 'SUPERSEDED');
    if (rule.state === 'NOT_APPLICABLE') return { classId: rule.classId, state: 'RESOLVED_NOT_APPLICABLE' as const, entryIds: [], witness: rule.witness };
    if (candidates.length === 0) return { classId: rule.classId, state: 'MISSING_REQUIRED' as const, entryIds: [] };
    if (candidates.some(e => e.applicability === 'CONTRADICTORY')) return { classId: rule.classId, state: 'CONFLICT' as const, entryIds: candidates.map(e=>e.id).sort() };
    if (candidates.length > 1) return { classId: rule.classId, state: 'AMBIGUOUS' as const, entryIds: candidates.map(e=>e.id).sort() };
    return { classId: rule.classId, state: 'RESOLVED_ACTIVE' as const, entryIds: [candidates[0]!.id] };
  }));
}

export function resolveAuthority(entries: readonly SourceEntryInput[], semanticKey: string, domain: AuthorityDomain): Result<AuthorityResolutionProof> {
  const candidates = entries.filter(e => e.semanticKey === semanticKey && e.domain === domain);
  const considered: { id: string; excluded?: string }[] = [];
  const active: SourceEntryInput[] = [];
  for (const e of candidates.sort((a,b)=>a.id.localeCompare(b.id))) {
    let excluded: string | undefined;
    if (e.lifecycle === 'SUPERSEDED') excluded = 'SUPERSEDED';
    else if (e.applicability && e.applicability !== 'ACTIVE') excluded = `APPLICABILITY_${e.applicability}`;
    else if (e.canonicality === 'DERIVED') excluded = 'DERIVED_NON_CANONICAL';
    considered.push(excluded ? { id: e.id, excluded } : { id: e.id });
    if (!excluded) active.push(e);
  }
  if (active.length === 0) return fail('AUTHORITY_NOT_FOUND', 'No active authority candidate', semanticKey);
  const explicitlySuperseded = new Set(active.flatMap(e => [...(e.supersedes ?? [])]));
  const finalists = active.filter(e => !explicitlySuperseded.has(e.id));
  if (finalists.length !== 1) return fail('AUTHORITY_CONFLICT', 'Authority resolution is ambiguous or conflicting', semanticKey);
  return { ok: true, value: frozen({ semanticKey, domain, considered, selected: finalists[0]!.id, governingRules: ['D-0021','D-0055'] }) };
}

export interface ExactTemplateRef { templateId: string; version: string; digest?: string; }
export function resolveExactTemplate(entries: readonly SourceEntryInput[], ref: ExactTemplateRef): Result<Readonly<SourceEntryInput>> {
  const templates = entries.filter(e => e.kind === 'TEMPLATE' && e.template?.templateId === ref.templateId);
  if (!templates.length) return fail('TEMPLATE_NOT_FOUND', 'Exact template identity not found', ref.templateId);
  const versions = templates.filter(e => e.template?.version === ref.version);
  if (!versions.length) return fail('TEMPLATE_VERSION_MISMATCH', 'Template version mismatch', ref.templateId);
  const digests = ref.digest ? versions.filter(e => e.template?.digest === ref.digest) : versions;
  if (!digests.length) return fail('TEMPLATE_DIGEST_MISMATCH', 'Template digest mismatch', ref.templateId);
  if (digests.length !== 1) return fail('TEMPLATE_AMBIGUOUS_SOURCE', 'Multiple exact template sources found', ref.templateId);
  return { ok: true, value: frozen({ ...digests[0]!, dependencies: [...(digests[0]!.dependencies ?? [])], supersedes: [...(digests[0]!.supersedes ?? [])] }) };
}

export function computeDriftShockwave(entries: readonly SourceEntryInput[], changedIds: readonly string[]): readonly string[] {
  const affected = new Set(changedIds);
  let moved = true;
  while (moved) {
    moved = false;
    for (const e of entries) if (!affected.has(e.id) && (e.dependencies ?? []).some(d => affected.has(d))) { affected.add(e.id); moved = true; }
  }
  return frozen([...affected].sort());
}

export function evaluateIntegrity(snapshot: SourcePackSnapshot, expectedProjectId: string, currentFingerprints: Readonly<Record<string,string>>): IntegrityLayers {
  if (snapshot.projectId !== expectedProjectId) return frozen({ structural:'VALID', source:'PROJECT_MISMATCH', authority:'INDETERMINATE', applicability:'INDETERMINATE', overall:'PROJECT_MISMATCH' });
  const stale = snapshot.entries.some(e => currentFingerprints[e.id] !== undefined && currentFingerprints[e.id] !== e.fingerprint);
  const incomplete = snapshot.requirementResolutions.some(r => !['RESOLVED_ACTIVE','RESOLVED_NOT_APPLICABLE'].includes(r.state));
  const conflicted = snapshot.requirementResolutions.some(r => ['AMBIGUOUS','CONFLICT'].includes(r.state));
  const source: IntegrityState = stale ? 'STALE' : 'VALID';
  const authority: IntegrityState = conflicted ? 'CONFLICTED' : 'VALID';
  const applicability: IntegrityState = incomplete ? 'INCOMPLETE' : 'VALID';
  const overall: IntegrityState = conflicted ? 'CONFLICTED' : stale ? 'STALE' : incomplete ? 'INCOMPLETE' : 'VALID';
  return frozen({ structural:'VALID', source, authority, applicability, overall });
}

export function buildSourcePack(input: { projectId: string; entries: readonly SourceEntryInput[]; requirements?: readonly RequirementRule[]; constitutionEntryIds?: readonly string[] }, options: OperationOptions): Result<SourcePackSnapshot> {
  const c = cancelled(options); if (c) return c;
  if (!ID_RE.test(input.projectId)) return fail('PROJECT_ID_INVALID', 'Invalid project id');
  if (input.entries.length > safeLimit(options.maxEntries, DEFAULT_MAX_ENTRIES)) return fail('ENTRY_BUDGET_EXCEEDED', 'Source entry budget exceeded');
  const ids = new Set<string>(); const diagnostics: Diagnostic[] = [];
  for (const entry of input.entries) { if (ids.has(entry.id)) diagnostics.push({ code:'DUPLICATE_ENTRY_ID', message:'Duplicate entry id', subject:entry.id }); ids.add(entry.id); diagnostics.push(...validateEntry(entry)); }
  if (diagnostics.length) return { ok:false, diagnostics };
  const graph = validateGraph(input.entries, options); if (!graph.ok) return graph;
  const normalized = [...input.entries].map(e => ({ ...e, dependencies:[...(e.dependencies ?? [])].sort(), supersedes:[...(e.supersedes ?? [])].sort() })).sort((a,b)=>a.id.localeCompare(b.id));
  const requirements = evaluateRequirements(input.requirements ?? [], normalized);
  const semantic = digest(options, { schemaVersion:1, projectId:input.projectId, entries:normalized, requirements }); if (!semantic.ok) return semantic;
  let constitutionFingerprint: string | undefined;
  if (input.constitutionEntryIds?.length) {
    const selected = normalized.filter(e => input.constitutionEntryIds!.includes(e.id));
    if (selected.length !== new Set(input.constitutionEntryIds).size) return fail('CONSTITUTION_SOURCE_MISSING', 'Constitution source set is incomplete');
    const d = digest(options, selected.map(e => ({ id:e.id, fingerprint:e.fingerprint }))); if (!d.ok) return d;
    constitutionFingerprint = d.value;
  }
  const epoch = digest(options, { semanticIdentity:semantic.value, constitutionFingerprint }); if (!epoch.ok) return epoch;
  const unresolved = requirements.filter(r => !['RESOLVED_ACTIVE','RESOLVED_NOT_APPLICABLE'].includes(r.state)).map(r => `${r.classId}:${r.state}`).sort();
  const snapshot: SourcePackSnapshot = { schemaVersion:1, projectId:input.projectId, entries:normalized, requirementResolutions:requirements, semanticIdentity:semantic.value, integrityEpoch:epoch.value, ...(constitutionFingerprint ? { constitutionFingerprint } : {}), receiptSeed:{ projectId:input.projectId, semanticIdentity:semantic.value, unresolved } };
  return { ok:true, value:frozen(snapshot) };
}
