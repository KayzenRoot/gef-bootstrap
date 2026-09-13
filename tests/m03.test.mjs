import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  MigrationGraph,
  applyMigration,
  previewMigration,
  validateProjectConfig,
} from "../packages/config/dist/index.js";
import {
  applyIdentityTransitionPlan,
  assessIdentityCollision,
  assessProjectIdentity,
  bindingStrengthSatisfies,
  canonicalIdentityStringify,
  createFingerprintManifest,
  createFormalAdoptionIdentity,
  createIdentityTransitionPlan,
  createProjectFingerprint,
  createProjectOnlyBinding,
  generateProjectId,
  isCanonicalProjectId,
  normalizeRemoteLocator,
  parsePersistedRepositoryBinding,
  repositoryIdentityEqual,
  repositoryResolutionSatisfiesBound,
  resolveRepositoryIdentity,
} from "../packages/project-identity/dist/index.js";

const P1 = "550e8400-e29b-41d4-a716-446655440000";
const P2 = "123e4567-e89b-42d3-a456-426614174000";
const P3 = "123e4567-e89b-42d3-b456-426614174001";
const digest = { algorithm: "sha256-test", digest: (text) => createHash("sha256").update(text).digest("hex") };
const recoveryEvidence = { sourceRef: "backup.snapshot.20260912", authorityRef: "recovery.approval.1", collisionCheck: "NO_AUTHORITATIVE_CONFLICT" };
const remote = (path = "Owner/Repo", stable = "repo-1") => ({
  schemaVersion: 1,
  state: "RESOLVED_REMOTE_BOUND",
  bindingKind: "REMOTE",
  normalizedLocator: { transportIndependentHost: "github.com", normalizedRepositoryPath: path },
  stableProviderId: stable,
  normalizationVersion: 1,
});

test("project ids are canonical lowercase UUIDv4 and production generation has a secure default", () => {
  assert.equal(isCanonicalProjectId(P1), true);
  assert.equal(isCanonicalProjectId(P1.toUpperCase()), false);
  assert.equal(generateProjectId(() => P2), P2);
  assert.throws(() => generateProjectId(() => "bad"), /generated_project_id_invalid/);
  assert.equal(isCanonicalProjectId(generateProjectId()), true);
});

test("formal adoption always carries a generated project id", () => {
  assert.deepEqual(createFormalAdoptionIdentity(() => P2), { adopted: true, projectId: P2 });
});

test("identity lifecycle distinguishes unadopted, brownfield bootstrap, invalid, conflict and valid adopted state", () => {
  assert.equal(assessProjectIdentity(null).state, "UNADOPTED");
  assert.equal(assessProjectIdentity({ adopted: true }).state, "IDENTITY_BOOTSTRAP_REQUIRED");
  assert.equal(assessProjectIdentity({ adopted: true }, { identityPreviouslyEstablished: true }).state, "IDENTITY_CONFLICT");
  assert.equal(assessProjectIdentity({ adopted: true, projectId: "bad" }).state, "INVALID_PROJECT_ID");
  assert.equal(assessProjectIdentity({ adopted: true, projectId: P1 }, { expectedProjectId: P2 }).state, "IDENTITY_CONFLICT");
  assert.deepEqual(assessProjectIdentity({ adopted: true, projectId: P1 }), { state: "ADOPTED_VALID", projectId: P1 });
});

test("M02 project config admits optional identity fields without silently requiring them for brownfield projects", () => {
  assert.deepEqual(validateProjectConfig({ schemaVersion: "1.0", configVersion: "1.0", adopted: true }), []);
  assert.deepEqual(validateProjectConfig({ schemaVersion: "1.0", configVersion: "1.0", adopted: true, projectId: P1, repositoryBinding: { bindingKind: "LOCAL", localBindingId: "local-1" } }), []);
  assert.equal(validateProjectConfig({ schemaVersion: "1.0", configVersion: "1.0", adopted: true, projectId: "BAD" }).some((item) => item.code === "gef.config.project_id_invalid"), true);
  assert.equal(validateProjectConfig({ schemaVersion: "1.0", configVersion: "1.0", adopted: true, repositoryBinding: "bad" }).some((item) => item.code === "gef.config.repository_binding_invalid"), true);
});

test("M03 strictly parses repositoryBinding materialized through M02 config", () => {
  assert.equal(parsePersistedRepositoryBinding({ bindingKind: "LOCAL", localBindingId: "local-1" }).ok, true);
  assert.equal(parsePersistedRepositoryBinding({ bindingKind: "REMOTE", normalizedLocator: { transportIndependentHost: "github.com", normalizedRepositoryPath: "Owner/Repo" }, stableProviderId: "repo-42" }).ok, true);
  assert.equal(parsePersistedRepositoryBinding({ bindingKind: "LOCAL", localBindingId: "../unsafe" }).ok, false);
  assert.equal(parsePersistedRepositoryBinding({ bindingKind: "REMOTE", normalizedLocator: { transportIndependentHost: "GitHub.com", normalizedRepositoryPath: "Owner/Repo" } }).ok, false);
  assert.equal(parsePersistedRepositoryBinding({ bindingKind: "LOCAL", localBindingId: "local-1", extra: true }).ok, false);
});

test("ordinary M02 migration cannot add, remove or rewrite project identity fields", async () => {
  const graph = new MigrationGraph();
  graph.add({ id: "identity-smuggle", fromVersion: "1.0", toVersion: "1.1", affectedPaths: ["projectId"], risk: "STANDARD", transform: (doc) => ({ ...doc, configVersion: "1.1", projectId: P2 }) });
  const document = { schemaVersion: "1.0", configVersion: "1.0", adopted: true, projectId: P1 };
  const preview = previewMigration(document, "1.0", "1.1", graph);
  await assert.rejects(() => applyMigration({ document, preview, graph, explicitApply: true, acknowledged: false, validateTarget: validateProjectConfig }), /identity_field_mutation_forbidden/);

  const graph2 = new MigrationGraph();
  graph2.add({ id: "binding-smuggle", fromVersion: "1.0", toVersion: "1.1", affectedPaths: ["repositoryBinding"], risk: "STANDARD", transform: (doc) => ({ ...doc, configVersion: "1.1", repositoryBinding: { bindingKind: "LOCAL", localBindingId: "other" } }) });
  const bound = { ...document, repositoryBinding: { bindingKind: "LOCAL", localBindingId: "local-1" } };
  const preview2 = previewMigration(bound, "1.0", "1.1", graph2);
  await assert.rejects(() => applyMigration({ document: bound, preview: preview2, graph: graph2, explicitApply: true, acknowledged: false, validateTarget: validateProjectConfig }), /identity_field_mutation_forbidden/);
});

test("canonical identity serialization is deterministic", () => {
  assert.equal(canonicalIdentityStringify({ b: 2, a: 1 }), canonicalIdentityStringify({ a: 1, b: 2 }));
});

test("PROJECT_ONLY binding validates the project id", () => {
  assert.equal(createProjectOnlyBinding(P1).projectId, P1);
  assert.throws(() => createProjectOnlyBinding("bad"), /project_id_invalid/);
});

test("SSH and HTTPS forms normalize equally while credentials, query and fragment are excluded", () => {
  const ssh = normalizeRemoteLocator({ alias: "origin", url: "git@github.com:Owner/Repo.git" });
  const https = normalizeRemoteLocator({ alias: "whatever", url: "https://user:token@github.com/Owner/Repo.git?token=abc#frag" });
  assert.deepEqual(ssh, https);
  assert.deepEqual(ssh, { transportIndependentHost: "github.com", normalizedRepositoryPath: "Owner/Repo" });
});

test("unsupported schemes fail closed and generic repository path case stays opaque", () => {
  assert.equal(normalizeRemoteLocator({ alias: "x", url: "file:///tmp/repo" }), null);
  assert.notDeepEqual(normalizeRemoteLocator({ alias: "x", url: "https://github.com/Owner/Repo" }), normalizeRemoteLocator({ alias: "x", url: "https://github.com/owner/repo" }));
});

test("local-only repository requires an explicit persisted binding before repository-bound use", () => {
  const unbound = resolveRepositoryIdentity({ repositoryPresent: true });
  assert.equal(unbound.projection.state, "RESOLVED_LOCAL_ONLY");
  assert.equal(repositoryResolutionSatisfiesBound(unbound), false);
  const bound = resolveRepositoryIdentity({ repositoryPresent: true, persistedBinding: { bindingKind: "LOCAL", localBindingId: "local-123" } });
  assert.equal(repositoryResolutionSatisfiesBound(bound), true);
});

test("a single safe remote is only a proposal until its canonical binding is persisted", () => {
  const result = resolveRepositoryIdentity({ repositoryPresent: true, remotes: [{ alias: "origin", url: "git@github.com:Owner/Repo.git" }] });
  assert.equal(result.projection.state, "RESOLVED_REMOTE_BOUND");
  assert.equal(result.canonicalBindingPersisted, false);
  assert.equal(repositoryResolutionSatisfiesBound(result), false);
});

test("trusted stable provider identity preserves continuity across locator rename", () => {
  const persisted = { bindingKind: "REMOTE", normalizedLocator: { transportIndependentHost: "github.com", normalizedRepositoryPath: "Old/Repo" }, stableProviderId: "42" };
  const result = resolveRepositoryIdentity({ repositoryPresent: true, persistedBinding: persisted, remotes: [{ alias: "upstream", url: "https://github.com/New/Repo.git", trustedStableProviderId: "42" }] });
  assert.equal(result.canonicalBindingPersisted, true);
  assert.equal(result.projection.normalizedLocator.normalizedRepositoryPath, "New/Repo");
  assert.equal(repositoryIdentityEqual(remote("Old/Repo", "42"), remote("New/Repo", "42")), true);
});

test("multiple distinct remotes conflict without explicit persisted selection", () => {
  const result = resolveRepositoryIdentity({ repositoryPresent: true, remotes: [{ alias: "a", url: "https://github.com/A/One.git" }, { alias: "b", url: "https://github.com/B/Two.git" }] });
  assert.equal(result.projection.state, "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES");
});

test("fingerprints enforce binding strength and classify targeted deltas", () => {
  const unresolved = { schemaVersion: 1, state: "UNRESOLVED_NO_REPOSITORY", normalizationVersion: 1 };
  const manifest = createFingerprintManifest(P1, unresolved, "1");
  const baseline = createProjectFingerprint(manifest, "IDENTITY_STATE", digest);
  assert.deepEqual(baseline.deltaClasses, ["BASELINE_CREATED"]);
  assert.throws(() => createProjectFingerprint(manifest, "REPOSITORY_BOUND", digest, undefined, false), /requirement_unsatisfied/);
  const changed = createProjectFingerprint(createFingerprintManifest(P1, remote(), "2"), "IDENTITY_STATE", digest, baseline);
  assert.deepEqual(new Set(changed.deltaClasses), new Set(["REPOSITORY_BINDING_CHANGED", "IDENTITY_POLICY_VERSION_CHANGED"]));
});

test("provider hint is descriptive and excluded from fingerprint identity", () => {
  const a = createFingerprintManifest(P1, { ...remote(), normalizedLocator: { ...remote().normalizedLocator, providerHint: "github" } }, "1");
  const b = createFingerprintManifest(P1, { ...remote(), normalizedLocator: { ...remote().normalizedLocator, providerHint: "other" } }, "1");
  assert.equal(canonicalIdentityStringify(a), canonicalIdentityStringify(b));
});

test("binding strength cannot satisfy a stronger consumer with weaker evidence", () => {
  assert.equal(bindingStrengthSatisfies("REPOSITORY_BOUND", "PROJECT_ONLY"), true);
  assert.equal(bindingStrengthSatisfies("PROJECT_ONLY", "IDENTITY_STATE"), false);
});

test("same-lineage clones do not false-positive as collisions", () => {
  const assessment = assessIdentityCollision({ currentProjectId: P1, candidateProjectId: P1, currentRepository: remote(), candidateRepository: remote() });
  assert.equal(assessment.collision, null);
  assert.equal(assessment.blocksGovernedMutation, false);
  assert.equal(assessment.restriction, "NONE");
});

test("authoritative repository mismatch blocks while registry-only evidence remains local-safe suspicion", () => {
  const mismatch = assessIdentityCollision({ currentProjectId: P1, candidateProjectId: P1, currentRepository: remote("A/X", "1"), candidateRepository: remote("B/Y", "2") });
  assert.equal(mismatch.collision, "PROJECT_ID_REPOSITORY_MISMATCH");
  assert.equal(mismatch.blocksGovernedMutation, true);
  const suspected = assessIdentityCollision({ currentProjectId: P1, candidateProjectId: P1, currentRepository: remote("A/X", "1"), candidateRepository: remote("B/Y", "2"), registryEvidenceOnly: true });
  assert.equal(suspected.collision, "REGISTRY_DUPLICATE_SUSPECTED");
  assert.equal(suspected.blocksGovernedMutation, false);
  assert.equal(suspected.restriction, "LOCAL_SAFE_ONLY");
});

test("stable provider id conflict is distinct from a legitimate locator rename", () => {
  assert.equal(assessIdentityCollision({ currentProjectId: P1, candidateProjectId: P1, currentRepository: remote("A/X", "1"), candidateRepository: remote("A/X", "2") }).collision, "PROVIDER_BINDING_CONFLICT");
  assert.equal(assessIdentityCollision({ currentProjectId: P1, candidateProjectId: P1, currentRepository: remote("A/X", "1"), candidateRepository: remote("A/Y", "1") }).collision, null);
});

test("normal rekey generates its target in preview, binds it and rejects caller-supplied ids", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", repositoryProjection: remote(), repositoryProjectionFingerprint: "r1", identityFingerprint: "i1" };
  const plan = createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD" }, digest, () => P2);
  assert.equal(plan.newProjectId, P2);
  assert.equal(plan.acknowledgementRequired, true);
  assert.throws(() => createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD", importRecoveryProjectId: P3 }, digest, () => P2), /caller_supplied/);
  assert.throws(() => applyIdentityTransitionPlan(plan, { current }, digest), /acknowledgement_required/);
  const applied = applyIdentityTransitionPlan(plan, { current, acknowledged: true }, digest);
  assert.equal(applied.receipt.newProjectId, P2);
  assert.deepEqual(applied.receipt.invalidationClasses, ["PROJECT_BOUND", "REPOSITORY_BOUND"]);
});

test("minimum rekey invalidation cannot be weakened by caller input", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  const plan = createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD", invalidationClasses: ["REPOSITORY_BOUND"] }, digest, () => P2);
  assert.deepEqual(plan.invalidationClasses, ["PROJECT_BOUND", "REPOSITORY_BOUND"]);
});

test("controlled import recovery requires externally supplied id plus bounded source/authority evidence", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  assert.throws(() => createIdentityTransitionPlan({ operation: "IMPORT_RECOVERY", reason: "recovery.import", current, assurance: "ELEVATED", importRecoveryProjectId: P3 }, digest), /evidence_required/);
  const plan = createIdentityTransitionPlan({ operation: "IMPORT_RECOVERY", reason: "recovery.import", current, assurance: "ELEVATED", importRecoveryProjectId: P3, importRecoveryEvidence: recoveryEvidence }, digest);
  assert.equal(plan.newProjectId, P3);
  assert.throws(() => applyIdentityTransitionPlan(plan, { current }, digest), /acknowledgement/);
  const applied = applyIdentityTransitionPlan(plan, { current, acknowledged: true }, digest);
  assert.equal(applied.receipt.recoveryReference, recoveryEvidence.authorityRef);
});

test("recovery-only evidence is rejected outside controlled import recovery", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  assert.throws(() => createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD", importRecoveryEvidence: recoveryEvidence }, digest, () => P2), /evidence_forbidden/);
});

test("STANDARD rebind consumes Work Order authorization while elevated rebind adds acknowledgement", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", repositoryProjection: remote("A/X", "1"), repositoryProjectionFingerprint: "r1", identityFingerprint: "i1" };
  const standard = createIdentityTransitionPlan({ operation: "REBIND_REPOSITORY", reason: "repository.rebind", current, assurance: "STANDARD", newRepositoryProjection: remote("B/Y", "2") }, digest);
  assert.equal(standard.acknowledgementRequired, false);
  assert.throws(() => applyIdentityTransitionPlan(standard, { current }, digest), /work_order_authorization/);
  assert.deepEqual(applyIdentityTransitionPlan(standard, { current, workOrderAuthorized: true }, digest).receipt.invalidationClasses, ["REPOSITORY_BOUND"]);
  const elevated = createIdentityTransitionPlan({ operation: "REBIND_REPOSITORY", reason: "repository.rebind", current, assurance: "ELEVATED", newRepositoryProjection: remote("B/Y", "2") }, digest);
  assert.equal(elevated.acknowledgementRequired, true);
  assert.throws(() => applyIdentityTransitionPlan(elevated, { current, workOrderAuthorized: true }, digest), /acknowledgement/);
});

test("stale or tampered transition plans fail before semantic apply", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  const plan = createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD" }, digest, () => P2);
  assert.throws(() => applyIdentityTransitionPlan(plan, { current: { ...current, projectConfigFingerprint: "cfg2" }, acknowledged: true }, digest), /plan_stale/);
  assert.throws(() => applyIdentityTransitionPlan({ ...plan, reason: "lineage.other" }, { current, acknowledged: true }, digest), /plan_integrity_invalid/);
});

test("registry suspicion cannot directly create an identity transition plan", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  assert.throws(() => createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD", collisionClass: "REGISTRY_DUPLICATE_SUSPECTED" }, digest, () => P2), /registry_suspicion_transition_blocked/);
});

test("transition reason and external effect identifiers are receipt-safe opaque identifiers", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  assert.throws(() => createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "contains secret value", current, assurance: "STANDARD" }, digest, () => P2), /reason_invalid/);
  assert.throws(() => createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD", externalEffects: ["https://token@example.test"] }, digest, () => P2), /external_effect_id_invalid/);
});

test("transition receipts remain compact and exclude credentials, local paths and broad source snapshots", () => {
  const current = { projectId: P1, projectConfigFingerprint: "cfg1", identityFingerprint: "i1" };
  const plan = createIdentityTransitionPlan({ operation: "REKEY_PROJECT", reason: "lineage.split", current, assurance: "STANDARD" }, digest, () => P2);
  const serialized = JSON.stringify(applyIdentityTransitionPlan(plan, { current, acknowledged: true }, digest).receipt);
  assert.equal(serialized.includes("token"), false);
  assert.equal(serialized.includes("/Users/"), false);
  assert.equal(serialized.includes("C:\\"), false);
});
