import type { GefError, RuntimeSeverity } from "@gef-bootstrap/contracts";

export type ConfigLayer = "PRODUCT_DEFAULT" | "GLOBAL_CONFIG" | "PROJECT_CONFIG" | "EXPLICIT_OVERRIDE";
export type AssuranceLevel = "STANDARD" | "ELEVATED" | "HIGH_ASSURANCE";
export type CompatibilityClass =
  | "NATIVE"
  | "MIGRATABLE"
  | "READ_ONLY_COMPATIBLE"
  | "TOO_NEW"
  | "TOO_OLD_UNSUPPORTED"
  | "INVALID_OR_AMBIGUOUS";

export interface ConfigSourceDescriptor {
  readonly layer: ConfigLayer;
  readonly ref: string;
  readonly fingerprint: string;
}

export interface ConfigProvenance {
  readonly layer: ConfigLayer;
  readonly sourceRef: string;
  readonly explicit: boolean;
}

export interface ConfigDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly summary: string;
  readonly severity: "ERROR" | "WARNING";
}

export interface GefConfigDocument {
  readonly schemaVersion: "1.0";
  readonly configVersion: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface GefProjectConfigDocument extends GefConfigDocument {
  readonly adopted: true;
  readonly projectId?: string;
  readonly repositoryBinding?: Readonly<Record<string, unknown>>;
}

export interface ResolvedConfigurationSnapshot {
  readonly schemaVersion: "1";
  readonly effective: Readonly<Record<string, unknown>>;
  readonly provenance: Readonly<Record<string, ConfigProvenance>>;
  readonly warnings: readonly ConfigDiagnostic[];
  readonly fingerprint: string;
  readonly defaultCatalogFingerprint: string;
  readonly sources: readonly ConfigSourceDescriptor[];
}

export interface ConfigReadPort {
  readText(path: string): Promise<string | null>;
}

export interface ConfigWritePort {
  writeText(path: string, content: string): Promise<void>;
}

export interface GlobalPathInput {
  readonly platform: "win32" | "linux" | "darwin";
  readonly env: Readonly<Record<string, string | undefined>>;
}

export interface ProjectConfigPaths {
  readonly configPath: string;
  readonly privateRoot: string;
}

const MAX_CONFIG_BYTES = 256 * 1024;
const MAX_DEPTH = 32;
const MAX_KEYS = 2048;
const CORE_KEYS = new Set(["schemaVersion", "configVersion", "extensions"]);
const PROJECT_KEYS = new Set(["schemaVersion", "configVersion", "extensions", "adopted", "projectId", "repositoryBinding"]);
const SECRET_KEY_PATTERN = /(token|secret|password|privatekey|api[_-]?key|credential)/i;
const REFERENCE_KEY_PATTERN = /(ref|reference)$/i;
const PROJECT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function slashJoin(...parts: readonly string[]): string {
  const raw = parts.filter((part) => part.length > 0).join("/").replace(/\\/g, "/");
  const unc = raw.startsWith("//");
  const normalized = raw.replace(/\/{2,}/g, "/").replace(/:\//, ":/");
  return unc && !normalized.startsWith("//") ? `/${normalized}` : normalized;
}

export function resolveGlobalConfigPath(input: GlobalPathInput): string {
  if (input.platform === "win32") {
    const root = input.env.APPDATA ?? (input.env.USERPROFILE ? slashJoin(input.env.USERPROFILE, "AppData", "Roaming") : undefined);
    if (!root) throw new Error("gef.config.global_path_unavailable");
    return slashJoin(root, "gef", "config.json");
  }
  if (input.platform === "darwin") {
    if (!input.env.HOME) throw new Error("gef.config.global_path_unavailable");
    return slashJoin(input.env.HOME, "Library", "Application Support", "gef", "config.json");
  }
  const root = input.env.XDG_CONFIG_HOME ?? (input.env.HOME ? slashJoin(input.env.HOME, ".config") : undefined);
  if (!root) throw new Error("gef.config.global_path_unavailable");
  return slashJoin(root, "gef", "config.json");
}

export function resolveProjectConfigPaths(projectRoot: string): ProjectConfigPaths {
  return {
    configPath: slashJoin(projectRoot, ".gef", "project.json"),
    privateRoot: slashJoin(projectRoot, ".gef", "private"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countAndDepth(value: unknown, depth = 0): { keys: number; depth: number } {
  if (depth > MAX_DEPTH) return { keys: MAX_KEYS + 1, depth };
  if (Array.isArray(value)) {
    let keys = 0;
    let maxDepth = depth;
    for (const item of value) {
      const child = countAndDepth(item, depth + 1);
      keys += child.keys;
      maxDepth = Math.max(maxDepth, child.depth);
      if (keys > MAX_KEYS) break;
    }
    return { keys, depth: maxDepth };
  }
  if (!isRecord(value)) return { keys: 0, depth };
  let keys = Object.keys(value).length;
  let maxDepth = depth;
  for (const childValue of Object.values(value)) {
    const child = countAndDepth(childValue, depth + 1);
    keys += child.keys;
    maxDepth = Math.max(maxDepth, child.depth);
    if (keys > MAX_KEYS) break;
  }
  return { keys, depth: maxDepth };
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) out[key] = stableNormalize(value[key]);
  return out;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

export function fingerprint(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

function scanSecretLikeKeys(value: unknown, path = "$", diagnostics: ConfigDiagnostic[] = []): ConfigDiagnostic[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSecretLikeKeys(item, `${path}[${index}]`, diagnostics));
    return diagnostics;
  }
  if (!isRecord(value)) return diagnostics;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    const explicitReference = REFERENCE_KEY_PATTERN.test(key);
    if (SECRET_KEY_PATTERN.test(key) && !explicitReference && typeof child === "string" && child.length > 0) {
      diagnostics.push({ code: "gef.config.secret_value_forbidden", path: childPath, summary: "Secret-like values must be external references, not persisted configuration values.", severity: "ERROR" });
    } else {
      scanSecretLikeKeys(child, childPath, diagnostics);
    }
  }
  return diagnostics;
}

export const globalConfigSchema = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:gef:schema:global-config:1",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "configVersion"],
  properties: {
    schemaVersion: { const: "1.0" },
    configVersion: { type: "string", pattern: "^[0-9]+\\.[0-9]+$" },
    extensions: { type: "object" },
  },
} as const);

export const projectConfigSchema = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:gef:schema:project-config:1",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "configVersion", "adopted"],
  properties: {
    schemaVersion: { const: "1.0" },
    configVersion: { type: "string", pattern: "^[0-9]+\\.[0-9]+$" },
    adopted: { const: true },
    projectId: { type: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$" },
    repositoryBinding: { type: "object" },
    extensions: { type: "object" },
  },
} as const);

export type CanonicalSchema = typeof globalConfigSchema | typeof projectConfigSchema;

export class SchemaRegistry {
  readonly #schemas = new Map<string, CanonicalSchema>();

  register(schema: CanonicalSchema): void {
    if (!schema.$id.startsWith("urn:gef:schema:")) throw new Error("gef.config.schema_id_invalid");
    if (this.#schemas.has(schema.$id)) throw new Error("gef.config.schema_duplicate");
    this.#schemas.set(schema.$id, schema);
  }

  get(schemaId: string): CanonicalSchema {
    const schema = this.#schemas.get(schemaId);
    if (!schema) throw new Error("gef.config.schema_unknown");
    return schema;
  }

  listIds(): readonly string[] {
    return [...this.#schemas.keys()].sort();
  }

  fingerprint(): string {
    return fingerprint(this.listIds().map((id) => this.#schemas.get(id)));
  }
}

function validateDocument(value: unknown, project: boolean): readonly ConfigDiagnostic[] {
  const diagnostics: ConfigDiagnostic[] = [];
  if (!isRecord(value)) return [{ code: "gef.config.document_not_object", path: "$", summary: "Configuration document must be a JSON object.", severity: "ERROR" }];

  const shape = countAndDepth(value);
  if (shape.keys > MAX_KEYS || shape.depth > MAX_DEPTH) diagnostics.push({ code: "gef.config.document_too_complex", path: "$", summary: "Configuration document exceeds bounded complexity.", severity: "ERROR" });

  const allowed = project ? PROJECT_KEYS : CORE_KEYS;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) diagnostics.push({ code: "gef.config.unknown_core_field", path: `$.${key}`, summary: "Unknown core configuration field.", severity: "ERROR" });
  }
  if (value.schemaVersion !== "1.0") diagnostics.push({ code: "gef.config.schema_version_invalid", path: "$.schemaVersion", summary: "schemaVersion must be 1.0.", severity: "ERROR" });
  if (typeof value.configVersion !== "string" || !/^\d+\.\d+$/.test(value.configVersion)) diagnostics.push({ code: "gef.config.contract_version_invalid", path: "$.configVersion", summary: "configVersion must use MAJOR.MINOR.", severity: "ERROR" });
  if (project && value.adopted !== true) diagnostics.push({ code: "gef.config.project_adoption_invalid", path: "$.adopted", summary: "Project configuration must explicitly declare adopted=true.", severity: "ERROR" });
  if (project && value.projectId !== undefined && (typeof value.projectId !== "string" || !PROJECT_ID_PATTERN.test(value.projectId))) diagnostics.push({ code: "gef.config.project_id_invalid", path: "$.projectId", summary: "projectId must be a canonical lowercase UUIDv4 when present.", severity: "ERROR" });
  if (project && value.repositoryBinding !== undefined && !isRecord(value.repositoryBinding)) diagnostics.push({ code: "gef.config.repository_binding_invalid", path: "$.repositoryBinding", summary: "repositoryBinding must be an object when present.", severity: "ERROR" });
  if (value.extensions !== undefined && !isRecord(value.extensions)) diagnostics.push({ code: "gef.config.extensions_invalid", path: "$.extensions", summary: "extensions must be an object.", severity: "ERROR" });
  diagnostics.push(...scanSecretLikeKeys(value));
  return diagnostics.slice(0, 64);
}

export function validateGlobalConfig(value: unknown): readonly ConfigDiagnostic[] {
  return validateDocument(value, false);
}

export function validateProjectConfig(value: unknown): readonly ConfigDiagnostic[] {
  return validateDocument(value, true);
}

export interface LoadedConfig<T> {
  readonly path: string;
  readonly value: T | null;
  readonly fingerprint: string;
  readonly diagnostics: readonly ConfigDiagnostic[];
}

async function loadConfig<T>(reader: ConfigReadPort, path: string, validate: (value: unknown) => readonly ConfigDiagnostic[]): Promise<LoadedConfig<T>> {
  const text = await reader.readText(path);
  if (text === null) return { path, value: null, fingerprint: fingerprint(null), diagnostics: [] };
  if (text.length > MAX_CONFIG_BYTES) return { path, value: null, fingerprint: fingerprint(text.length), diagnostics: [{ code: "gef.config.document_too_large", path: "$", summary: "Configuration document exceeds size limit.", severity: "ERROR" }] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { path, value: null, fingerprint: fingerprint(text), diagnostics: [{ code: "gef.config.json_invalid", path: "$", summary: "Configuration is not valid JSON.", severity: "ERROR" }] };
  }
  const diagnostics = validate(parsed);
  return { path, value: diagnostics.some((item) => item.severity === "ERROR") ? null : (parsed as T), fingerprint: fingerprint(parsed), diagnostics };
}

export function loadGlobalConfig(reader: ConfigReadPort, path: string): Promise<LoadedConfig<GefConfigDocument>> {
  return loadConfig(reader, path, validateGlobalConfig);
}

export function loadProjectConfig(reader: ConfigReadPort, path: string): Promise<LoadedConfig<GefProjectConfigDocument>> {
  return loadConfig(reader, path, validateProjectConfig);
}

export interface DefaultEntry {
  readonly path: string;
  readonly owner: "M02";
  readonly value?: unknown;
  readonly noDefault: boolean;
  readonly introducedIn: string;
}

export const defaultCatalogVersion = "1.0";
export const defaultCatalog: readonly DefaultEntry[] = Object.freeze([
  { path: "extensions", owner: "M02", value: Object.freeze({}), noDefault: false, introducedIn: "1.0" },
  { path: "adopted", owner: "M02", noDefault: true, introducedIn: "1.0" },
]);
export const defaultCatalogFingerprint = fingerprint({ version: defaultCatalogVersion, entries: defaultCatalog });

export type DefaultResolution =
  | { readonly status: "VALUE"; readonly entry: DefaultEntry; readonly value: unknown }
  | { readonly status: "NO_DEFAULT"; readonly entry: DefaultEntry }
  | { readonly status: "UNKNOWN" };

export function resolveDefault(path: string): DefaultResolution {
  const entry = defaultCatalog.find((item) => item.path === path);
  if (!entry) return { status: "UNKNOWN" };
  if (entry.noDefault) return { status: "NO_DEFAULT", entry };
  return { status: "VALUE", entry, value: entry.value };
}

export interface DefaultBehaviorDelta {
  readonly path: string;
  readonly assurance: AssuranceLevel;
  readonly behaviorChanged: boolean;
}

export function requireDefaultBehaviorAcknowledgement(deltas: readonly DefaultBehaviorDelta[], acknowledged: boolean): void {
  const elevated = deltas.some((delta) => delta.behaviorChanged && assuranceRank(delta.assurance) >= assuranceRank("ELEVATED"));
  if (elevated && !acknowledged) throw new Error("gef.config.default_behavior_acknowledgement_required");
}

function flattenConfig(value: Readonly<Record<string, unknown>>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(child) && key !== "extensions") Object.assign(out, flattenConfig(child, path));
    else out[path] = child;
  }
  return out;
}

function unflattenConfig(value: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, fieldValue] of Object.entries(value)) {
    const parts = path.split(".");
    let cursor = out;
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      if (part === undefined) continue;
      if (index === parts.length - 1) cursor[part] = fieldValue;
      else {
        const next = cursor[part];
        if (!isRecord(next)) cursor[part] = {};
        cursor = cursor[part] as Record<string, unknown>;
      }
    }
  }
  return out;
}

export interface ResolveConfigInput {
  readonly global?: GefConfigDocument | null;
  readonly project?: GefProjectConfigDocument | null;
  readonly override?: Readonly<Record<string, unknown>>;
  readonly globalRef?: string;
  readonly projectRef?: string;
  readonly overrideRef?: string;
}

export function resolveConfiguration(input: ResolveConfigInput): ResolvedConfigurationSnapshot {
  const effectiveFlat: Record<string, unknown> = {};
  const provenance: Record<string, ConfigProvenance> = {};
  const sources: ConfigSourceDescriptor[] = [];

  for (const entry of defaultCatalog) {
    if (!entry.noDefault) {
      effectiveFlat[entry.path] = entry.value;
      provenance[entry.path] = { layer: "PRODUCT_DEFAULT", sourceRef: `default:${defaultCatalogVersion}`, explicit: false };
    }
  }

  const apply = (layer: ConfigLayer, ref: string, value: Readonly<Record<string, unknown>> | null | undefined): void => {
    if (!value) return;
    const flat = flattenConfig(value);
    for (const [path, fieldValue] of Object.entries(flat)) {
      effectiveFlat[path] = fieldValue;
      provenance[path] = { layer, sourceRef: ref, explicit: true };
    }
    sources.push({ layer, ref, fingerprint: fingerprint(value) });
  };

  apply("GLOBAL_CONFIG", input.globalRef ?? "global", input.global as unknown as Readonly<Record<string, unknown>> | null | undefined);
  apply("PROJECT_CONFIG", input.projectRef ?? "project", input.project as unknown as Readonly<Record<string, unknown>> | null | undefined);
  apply("EXPLICIT_OVERRIDE", input.overrideRef ?? "override", input.override);

  const effective = unflattenConfig(effectiveFlat);
  return {
    schemaVersion: "1",
    effective,
    provenance,
    warnings: [],
    fingerprint: fingerprint({ effective, provenance }),
    defaultCatalogFingerprint,
    sources,
  };
}

export function configDiagnosticsToGefError(diagnostics: readonly ConfigDiagnostic[], runId?: string, commandId?: string): GefError {
  const first = diagnostics[0];
  const severity: RuntimeSeverity = diagnostics.some((item) => item.severity === "ERROR") ? "ERROR" : "WARNING";
  return {
    schemaVersion: 1,
    id: fingerprint({ diagnostics, runId, commandId }),
    category: "INPUT",
    reasonCode: first?.code ?? "gef.config.invalid",
    severity,
    summary: first?.summary ?? "Configuration validation failed.",
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    effectStatus: "NONE",
    ...(commandId ? { commandId } : {}),
    ...(runId ? { runId } : {}),
    causes: diagnostics.slice(1, 8).map((item, index) => ({ id: `config-${index + 1}`, reasonCode: item.code, summary: item.summary })),
    evidenceRefs: [],
    remediations: [{ actionId: "gef.config.edit" }],
    metadata: { diagnostics: diagnostics.slice(0, 16).map(({ code, path, severity: itemSeverity }) => ({ code, path, severity: itemSeverity })) },
  };
}

export interface ContractVersion { readonly major: number; readonly minor: number }

export function parseContractVersion(value: string): ContractVersion | null {
  const match = /^(\d+)\.(\d+)$/.exec(value);
  if (!match) return null;
  const majorText = match[1];
  const minorText = match[2];
  if (majorText === undefined || minorText === undefined) return null;
  return { major: Number(majorText), minor: Number(minorText) };
}

export interface MigrationStep {
  readonly id: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly affectedPaths: readonly string[];
  readonly risk: AssuranceLevel;
  readonly transform: (input: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>;
}

export class MigrationGraph {
  readonly #steps = new Map<string, MigrationStep>();

  add(step: MigrationStep): void {
    if (this.#steps.has(step.id)) throw new Error("gef.config.migration_duplicate_id");
    if (!parseContractVersion(step.fromVersion) || !parseContractVersion(step.toVersion)) throw new Error("gef.config.migration_version_invalid");
    for (const existing of this.#steps.values()) {
      if (existing.fromVersion === step.fromVersion && existing.toVersion === step.toVersion) throw new Error("gef.config.migration_ambiguous_edge");
    }
    this.#steps.set(step.id, step);
    try {
      this.assertAcyclic();
    } catch (error) {
      this.#steps.delete(step.id);
      throw error;
    }
  }

  list(): readonly MigrationStep[] {
    return [...this.#steps.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  fingerprint(): string {
    return fingerprint(this.list().map(({ transform: _transform, ...step }) => step));
  }

  assertAcyclic(): void {
    const edges = new Map<string, string[]>();
    for (const step of this.#steps.values()) {
      const list = edges.get(step.fromVersion) ?? [];
      list.push(step.toVersion);
      edges.set(step.fromVersion, list);
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (node: string): void => {
      if (visiting.has(node)) throw new Error("gef.config.migration_cycle");
      if (visited.has(node)) return;
      visiting.add(node);
      for (const next of edges.get(node) ?? []) visit(next);
      visiting.delete(node);
      visited.add(node);
    };
    for (const node of edges.keys()) visit(node);
  }

  path(fromVersion: string, toVersion: string): readonly MigrationStep[] | null {
    if (fromVersion === toVersion) return [];
    type Node = { version: string; path: MigrationStep[] };
    const queue: Node[] = [{ version: fromVersion, path: [] }];
    const found: MigrationStep[][] = [];
    let bestLength = Number.POSITIVE_INFINITY;
    const seenDepth = new Map<string, number>([[fromVersion, 0]]);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || current.path.length > bestLength) continue;
      const outgoing = this.list().filter((step) => step.fromVersion === current.version);
      for (const step of outgoing) {
        const nextPath = [...current.path, step];
        if (step.toVersion === toVersion) {
          bestLength = nextPath.length;
          found.push(nextPath);
          continue;
        }
        const previousDepth = seenDepth.get(step.toVersion);
        if (previousDepth === undefined || nextPath.length <= previousDepth) {
          seenDepth.set(step.toVersion, nextPath.length);
          queue.push({ version: step.toVersion, path: nextPath });
        }
      }
    }
    const shortest = found.filter((item) => item.length === bestLength);
    if (shortest.length > 1) throw new Error("gef.config.migration_ambiguous_path");
    return shortest[0] ?? null;
  }
}

export interface CompatibilityPolicy {
  readonly currentVersion: string;
  readonly currentMajor: number;
  readonly previousMajor?: number;
  readonly readOnlySameMajorFutureMinor: boolean;
}

export function classifyCompatibility(version: string, policy: CompatibilityPolicy, graph: MigrationGraph): CompatibilityClass {
  const input = parseContractVersion(version);
  const current = parseContractVersion(policy.currentVersion);
  if (!input || !current || current.major !== policy.currentMajor) return "INVALID_OR_AMBIGUOUS";
  if (input.major === current.major && input.minor <= current.minor) return "NATIVE";
  if (input.major === current.major && input.minor > current.minor) return policy.readOnlySameMajorFutureMinor ? "READ_ONLY_COMPATIBLE" : "TOO_NEW";
  if (input.major > current.major) return "TOO_NEW";
  if (policy.previousMajor !== undefined && input.major === policy.previousMajor) return graph.path(version, policy.currentVersion) ? "MIGRATABLE" : "TOO_OLD_UNSUPPORTED";
  return graph.path(version, policy.currentVersion) ? "MIGRATABLE" : "TOO_OLD_UNSUPPORTED";
}

export interface MigrationPreview {
  readonly sourceVersion: string;
  readonly targetVersion: string;
  readonly sourceFingerprint: string;
  readonly migrationGraphFingerprint: string;
  readonly stepIds: readonly string[];
  readonly affectedPaths: readonly string[];
  readonly assurance: AssuranceLevel;
  readonly acknowledgementRequired: boolean;
  readonly mutationFree: true;
}

function assuranceRank(level: AssuranceLevel): number {
  return level === "STANDARD" ? 0 : level === "ELEVATED" ? 1 : 2;
}

export function previewMigration(input: Readonly<Record<string, unknown>>, sourceVersion: string, targetVersion: string, graph: MigrationGraph): MigrationPreview {
  const path = graph.path(sourceVersion, targetVersion);
  if (!path) throw new Error("gef.config.migration_path_missing");
  const assurance = path.reduce<AssuranceLevel>((current, step) => assuranceRank(step.risk) > assuranceRank(current) ? step.risk : current, "STANDARD");
  return {
    sourceVersion,
    targetVersion,
    sourceFingerprint: fingerprint(input),
    migrationGraphFingerprint: graph.fingerprint(),
    stepIds: path.map((step) => step.id),
    affectedPaths: [...new Set(path.flatMap((step) => step.affectedPaths))].sort(),
    assurance,
    acknowledgementRequired: assurance !== "STANDARD",
    mutationFree: true,
  };
}

export interface MigrationApplyInput {
  readonly document: Readonly<Record<string, unknown>>;
  readonly preview: MigrationPreview;
  readonly graph: MigrationGraph;
  readonly explicitApply: boolean;
  readonly acknowledged: boolean;
  readonly validateTarget: (value: unknown) => readonly ConfigDiagnostic[];
  readonly write?: (value: Readonly<Record<string, unknown>>) => Promise<void>;
}

export interface MigrationReceipt {
  readonly status: "APPLIED" | "NOOP";
  readonly sourceVersion: string;
  readonly targetVersion: string;
  readonly preFingerprint: string;
  readonly postFingerprint: string;
  readonly migrationGraphFingerprint: string;
  readonly stepIds: readonly string[];
  readonly acknowledgementRequired: boolean;
  readonly acknowledgementObtained: boolean;
}

export async function applyMigration(input: MigrationApplyInput): Promise<{ value: Readonly<Record<string, unknown>>; receipt: MigrationReceipt }> {
  if (!input.explicitApply) throw new Error("gef.config.migration_explicit_apply_required");
  if (input.preview.migrationGraphFingerprint !== input.graph.fingerprint()) throw new Error("gef.config.migration_graph_stale");
  const preFingerprint = fingerprint(input.document);
  if (preFingerprint !== input.preview.sourceFingerprint) throw new Error("gef.config.migration_source_stale");
  if (input.preview.acknowledgementRequired && !input.acknowledged) throw new Error("gef.config.migration_acknowledgement_required");
  if (input.preview.sourceVersion === input.preview.targetVersion || input.preview.stepIds.length === 0) {
    return { value: input.document, receipt: { status: "NOOP", sourceVersion: input.preview.sourceVersion, targetVersion: input.preview.targetVersion, preFingerprint, postFingerprint: preFingerprint, migrationGraphFingerprint: input.preview.migrationGraphFingerprint, stepIds: [], acknowledgementRequired: input.preview.acknowledgementRequired, acknowledgementObtained: input.acknowledged } };
  }
  const path = input.graph.path(input.preview.sourceVersion, input.preview.targetVersion);
  if (!path || path.map((step) => step.id).join("|") !== input.preview.stepIds.join("|")) throw new Error("gef.config.migration_plan_stale");
  let current: Readonly<Record<string, unknown>> = input.document;
  for (const step of path) current = step.transform(current);
  for (const field of ["projectId", "repositoryBinding"] as const) {
    if (stableStringify(input.document[field]) !== stableStringify(current[field])) throw new Error("gef.config.identity_field_mutation_forbidden");
  }
  const diagnostics = input.validateTarget(current);
  if (diagnostics.some((item) => item.severity === "ERROR")) throw new Error("gef.config.migration_target_invalid");
  if (input.write) await input.write(current);
  const postFingerprint = fingerprint(current);
  return { value: current, receipt: { status: "APPLIED", sourceVersion: input.preview.sourceVersion, targetVersion: input.preview.targetVersion, preFingerprint, postFingerprint, migrationGraphFingerprint: input.preview.migrationGraphFingerprint, stepIds: input.preview.stepIds, acknowledgementRequired: input.preview.acknowledgementRequired, acknowledgementObtained: input.acknowledged } };
}

export function createAdoptionDocument(configVersion = "1.0"): GefProjectConfigDocument {
  return { schemaVersion: "1.0", configVersion, adopted: true };
}
