import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  SchemaRegistry,
  applyMigration,
  classifyCompatibility,
  configDiagnosticsToGefError,
  createAdoptionDocument,
  defaultCatalogFingerprint,
  fingerprint,
  globalConfigSchema,
  loadGlobalConfig,
  loadProjectConfig,
  MigrationGraph,
  previewMigration,
  projectConfigSchema,
  requireDefaultBehaviorAcknowledgement,
  resolveConfiguration,
  resolveDefault,
  resolveGlobalConfigPath,
  resolveProjectConfigPaths,
  validateGlobalConfig,
  validateProjectConfig,
} from "../packages/config/dist/index.js";

const reader = (files) => ({
  async readText(path) { return Object.prototype.hasOwnProperty.call(files, path) ? files[path] : null; },
});

test("global config path is deterministic and platform aware", () => {
  assert.equal(resolveGlobalConfigPath({ platform: "linux", env: { HOME: "/home/alice" } }), "/home/alice/.config/gef/config.json");
  assert.equal(resolveGlobalConfigPath({ platform: "linux", env: { HOME: "/home/alice", XDG_CONFIG_HOME: "/cfg" } }), "/cfg/gef/config.json");
  assert.equal(resolveGlobalConfigPath({ platform: "darwin", env: { HOME: "/Users/alice" } }), "/Users/alice/Library/Application Support/gef/config.json");
  assert.equal(resolveGlobalConfigPath({ platform: "win32", env: { APPDATA: "C:\\Users\\alice\\AppData\\Roaming" } }), "C:/Users/alice/AppData/Roaming/gef/config.json");
  assert.equal(resolveGlobalConfigPath({ platform: "win32", env: { APPDATA: "\\\\server\\share\\roaming" } }), "//server/share/roaming/gef/config.json");
});

test("project paths separate canonical config from private state", () => {
  assert.deepEqual(resolveProjectConfigPaths("/repo"), { configPath: "/repo/.gef/project.json", privateRoot: "/repo/.gef/private" });
});

test("missing global config is valid and bounded to exact path", async () => {
  let reads = 0;
  const loaded = await loadGlobalConfig({ async readText(path) { reads += 1; assert.equal(path, "/cfg/gef/config.json"); return null; } }, "/cfg/gef/config.json");
  assert.equal(reads, 1);
  assert.equal(loaded.value, null);
  assert.deepEqual(loaded.diagnostics, []);
});

test("global and project schemas expose stable local URNs", () => {
  assert.equal(globalConfigSchema.$id, "urn:gef:schema:global-config:1");
  assert.equal(projectConfigSchema.$id, "urn:gef:schema:project-config:1");
  assert.equal(globalConfigSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
});

test("persisted JSON schemas are mechanically aligned with exported contracts", async () => {
  const globalJson = JSON.parse(await readFile(new URL("../packages/config/schemas/global-config.schema.json", import.meta.url), "utf8"));
  const projectJson = JSON.parse(await readFile(new URL("../packages/config/schemas/project-config.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(globalJson, globalConfigSchema);
  assert.deepEqual(projectJson, projectConfigSchema);
});

test("schema registry is deterministic and rejects duplicate ids", () => {
  const registry = new SchemaRegistry();
  registry.register(projectConfigSchema);
  registry.register(globalConfigSchema);
  assert.deepEqual(registry.listIds(), ["urn:gef:schema:global-config:1", "urn:gef:schema:project-config:1"]);
  assert.throws(() => registry.register(globalConfigSchema), /schema_duplicate/);
  assert.match(registry.fingerprint(), /^fnv1a64:/);
});

test("core unknown fields fail closed while extensions stay inert", () => {
  assert.equal(validateGlobalConfig({ schemaVersion: "1.0", configVersion: "1.0", typo: true }).some((d) => d.code === "gef.config.unknown_core_field"), true);
  assert.deepEqual(validateGlobalConfig({ schemaVersion: "1.0", configVersion: "1.0", extensions: { "adapter.future": { arbitrary: true } } }), []);
});

test("persisted secret-like values are rejected while credential references are allowed", () => {
  const diagnostics = validateGlobalConfig({ schemaVersion: "1.0", configVersion: "1.0", extensions: { provider: { apiKey: "secret-value" } } });
  assert.equal(diagnostics.some((d) => d.code === "gef.config.secret_value_forbidden"), true);
  assert.deepEqual(validateGlobalConfig({ schemaVersion: "1.0", configVersion: "1.0", extensions: { provider: { credentialRef: "os-keychain:github" } } }), []);
});

test("project adoption marker is mandatory and minimal", () => {
  assert.deepEqual(createAdoptionDocument(), { schemaVersion: "1.0", configVersion: "1.0", adopted: true });
  assert.equal(validateProjectConfig({ schemaVersion: "1.0", configVersion: "1.0" }).some((d) => d.code === "gef.config.project_adoption_invalid"), true);
  assert.deepEqual(validateProjectConfig(createAdoptionDocument()), []);
});

test("loaders reject malformed json and oversized complexity safely", async () => {
  const malformed = await loadGlobalConfig(reader({ "/x": "{" }), "/x");
  assert.equal(malformed.value, null);
  assert.equal(malformed.diagnostics[0].code, "gef.config.json_invalid");

  let nested = {};
  let cursor = nested;
  for (let i = 0; i < 40; i += 1) { cursor.child = {}; cursor = cursor.child; }
  nested.schemaVersion = "1.0";
  nested.configVersion = "1.0";
  const complex = validateGlobalConfig(nested);
  assert.equal(complex.some((d) => d.code === "gef.config.document_too_complex"), true);
});

test("precedence is defaults < global < project < explicit and provenance remains explicit", () => {
  const global = { schemaVersion: "1.0", configVersion: "1.0", extensions: { x: "global" } };
  const project = { schemaVersion: "1.0", configVersion: "1.0", adopted: true, extensions: { x: "project" } };
  const snapshot = resolveConfiguration({ global, project, override: { extensions: { x: "override" } }, globalRef: "g", projectRef: "p", overrideRef: "o" });
  assert.deepEqual(snapshot.effective.extensions, { x: "override" });
  assert.equal(snapshot.provenance.extensions.layer, "EXPLICIT_OVERRIDE");
  assert.equal(snapshot.provenance.extensions.explicit, true);
  assert.equal(snapshot.defaultCatalogFingerprint, defaultCatalogFingerprint);
});

test("explicit value equal to product default remains explicit", () => {
  const snapshot = resolveConfiguration({ override: { extensions: {} } });
  assert.equal(snapshot.provenance.extensions.layer, "EXPLICIT_OVERRIDE");
  assert.equal(snapshot.provenance.extensions.explicit, true);
});

test("NO_DEFAULT is first class", () => {
  assert.equal(resolveDefault("adopted").status, "NO_DEFAULT");
  assert.equal(resolveDefault("extensions").status, "VALUE");
  assert.equal(resolveDefault("does.not.exist").status, "UNKNOWN");
});

test("elevated default behavior changes require explicit acknowledgement", () => {
  const delta = [{ path: "future.assurance.mode", assurance: "ELEVATED", behaviorChanged: true }];
  assert.throws(() => requireDefaultBehaviorAcknowledgement(delta, false), /default_behavior_acknowledgement_required/);
  assert.doesNotThrow(() => requireDefaultBehaviorAcknowledgement(delta, true));
  assert.doesNotThrow(() => requireDefaultBehaviorAcknowledgement([{ path: "x", assurance: "STANDARD", behaviorChanged: true }], false));
});

test("fingerprints are deterministic and independent of object key order", () => {
  assert.equal(fingerprint({ b: 2, a: 1 }), fingerprint({ a: 1, b: 2 }));
  assert.notEqual(defaultCatalogFingerprint, fingerprint(globalConfigSchema));
});

test("config diagnostics project into M01 typed error without secret values", () => {
  const diagnostics = validateGlobalConfig({ schemaVersion: "1.0", configVersion: "1.0", extensions: { token: "do-not-echo" } });
  const error = configDiagnosticsToGefError(diagnostics, "run-1", "gef.config.load");
  assert.equal(error.category, "INPUT");
  assert.equal(error.runId, "run-1");
  assert.equal(JSON.stringify(error).includes("do-not-echo"), false);
});

test("compatibility classification covers native, read-only future, too-new and too-old", () => {
  const graph = new MigrationGraph();
  graph.add({ id: "migrate-0-1", fromVersion: "0.9", toVersion: "1.0", affectedPaths: ["schemaVersion"], risk: "STANDARD", transform: (doc) => ({ ...doc, configVersion: "1.0" }) });
  const policy = { currentVersion: "1.0", currentMajor: 1, previousMajor: 0, readOnlySameMajorFutureMinor: true };
  assert.equal(classifyCompatibility("1.0", policy, graph), "NATIVE");
  assert.equal(classifyCompatibility("1.2", policy, graph), "READ_ONLY_COMPATIBLE");
  assert.equal(classifyCompatibility("2.0", policy, graph), "TOO_NEW");
  assert.equal(classifyCompatibility("0.9", policy, graph), "MIGRATABLE");
  assert.equal(classifyCompatibility("invalid", policy, graph), "INVALID_OR_AMBIGUOUS");
});

test("migration graph rejects cycles and ambiguous edges without retaining invalid edges", () => {
  const graph = new MigrationGraph();
  graph.add({ id: "a", fromVersion: "1.0", toVersion: "1.1", affectedPaths: [], risk: "STANDARD", transform: (doc) => doc });
  assert.throws(() => graph.add({ id: "b", fromVersion: "1.0", toVersion: "1.1", affectedPaths: [], risk: "STANDARD", transform: (doc) => doc }), /ambiguous_edge/);
  assert.throws(() => graph.add({ id: "c", fromVersion: "1.1", toVersion: "1.0", affectedPaths: [], risk: "STANDARD", transform: (doc) => doc }), /migration_cycle/);
  assert.deepEqual(graph.list().map((step) => step.id), ["a"]);
});

test("migration preview is mutation free and bound to exact source fingerprint", () => {
  const graph = new MigrationGraph();
  graph.add({ id: "1.0-to-1.1", fromVersion: "1.0", toVersion: "1.1", affectedPaths: ["configVersion"], risk: "STANDARD", transform: (doc) => ({ ...doc, configVersion: "1.1" }) });
  const source = { schemaVersion: "1.0", configVersion: "1.0" };
  const before = JSON.stringify(source);
  const preview = previewMigration(source, "1.0", "1.1", graph);
  assert.equal(preview.mutationFree, true);
  assert.equal(preview.sourceFingerprint, fingerprint(source));
  assert.equal(JSON.stringify(source), before);
});

test("migration apply requires explicit action and rejects stale source", async () => {
  const graph = new MigrationGraph();
  graph.add({ id: "1.0-to-1.1", fromVersion: "1.0", toVersion: "1.1", affectedPaths: ["configVersion"], risk: "STANDARD", transform: (doc) => ({ ...doc, configVersion: "1.1" }) });
  const source = { schemaVersion: "1.0", configVersion: "1.0" };
  const preview = previewMigration(source, "1.0", "1.1", graph);
  await assert.rejects(() => applyMigration({ document: source, preview, graph, explicitApply: false, acknowledged: false, validateTarget: () => [] }), /explicit_apply_required/);
  await assert.rejects(() => applyMigration({ document: { ...source, changed: true }, preview, graph, explicitApply: true, acknowledged: false, validateTarget: () => [] }), /source_stale/);
});

test("high assurance migration requires acknowledgement", async () => {
  const graph = new MigrationGraph();
  graph.add({ id: "1.0-to-1.1", fromVersion: "1.0", toVersion: "1.1", affectedPaths: ["configVersion"], risk: "HIGH_ASSURANCE", transform: (doc) => ({ ...doc, configVersion: "1.1" }) });
  const source = { schemaVersion: "1.0", configVersion: "1.0" };
  const preview = previewMigration(source, "1.0", "1.1", graph);
  assert.equal(preview.acknowledgementRequired, true);
  await assert.rejects(() => applyMigration({ document: source, preview, graph, explicitApply: true, acknowledged: false, validateTarget: () => [] }), /acknowledgement_required/);
});

test("migration validates target before delegated write and emits receipt", async () => {
  const graph = new MigrationGraph();
  graph.add({ id: "1.0-to-1.1", fromVersion: "1.0", toVersion: "1.1", affectedPaths: ["configVersion"], risk: "STANDARD", transform: (doc) => ({ ...doc, configVersion: "1.1" }) });
  const source = { schemaVersion: "1.0", configVersion: "1.0" };
  const preview = previewMigration(source, "1.0", "1.1", graph);
  let writes = 0;
  const result = await applyMigration({
    document: source,
    preview,
    graph,
    explicitApply: true,
    acknowledged: false,
    validateTarget: (value) => value.configVersion === "1.1" ? [] : [{ code: "bad", path: "$", summary: "bad", severity: "ERROR" }],
    write: async () => { writes += 1; },
  });
  assert.equal(writes, 1);
  assert.equal(result.value.configVersion, "1.1");
  assert.equal(result.receipt.status, "APPLIED");
  assert.equal(result.receipt.stepIds[0], "1.0-to-1.1");
});

test("already-target migration is idempotent noop", async () => {
  const graph = new MigrationGraph();
  const source = { schemaVersion: "1.0", configVersion: "1.0" };
  const preview = previewMigration(source, "1.0", "1.0", graph);
  const result = await applyMigration({ document: source, preview, graph, explicitApply: true, acknowledged: false, validateTarget: () => [] });
  assert.equal(result.receipt.status, "NOOP");
  assert.equal(result.receipt.preFingerprint, result.receipt.postFingerprint);
});

test("brownfield unrelated config files are never discovered by M02 loaders", async () => {
  const paths = [];
  const projectPath = resolveProjectConfigPaths("/legacy").configPath;
  const loaded = await loadProjectConfig({ async readText(path) { paths.push(path); return null; } }, projectPath);
  assert.equal(loaded.value, null);
  assert.deepEqual(paths, ["/legacy/.gef/project.json"]);
});
