import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeFilesystemPath,
  composeFilesystemPhysicalSafety,
  evaluateFilesystemOverwrite,
  proveFilesystemTraversal,
} from "../packages/kernel/dist/index.js";

const allOps = ["READ", "CREATE", "UPDATE", "REMOVE", "MOVE_SOURCE", "MOVE_DESTINATION", "RESTORE", "STAGE"];
const posixRoot = Object.freeze({ rootRef: "project-root", rootKind: "PROJECT", physicalRoot: "/repo", pathFlavor: "POSIX", caseSemantics: "SENSITIVE", allowedOperations: allOps, policyRef: "policy:fs:v1", pathSemanticsRef: "path:posix:v1", bindingRef: "project:p1" });
const windowsRoot = Object.freeze({ ...posixRoot, physicalRoot: "C:\\repo", pathFlavor: "WINDOWS", caseSemantics: "INSENSITIVE", pathSemanticsRef: "path:windows:v1" });

function path(root = posixRoot, operation = "UPDATE", relativePath = "src/a.txt") {
  const result = authorizeFilesystemPath({ root, operation, relativePath });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function observation(overrides = {}) {
  return { relativePath: "src/a.txt", kind: "FILE", accessible: true, identityToken: "id:a:v1", fingerprint: "before", filesystemId: "fs:1", linkCount: 1, ...overrides };
}

function ancestors(overrides = {}) {
  return [
    { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1", filesystemId: "fs:1", ...(overrides.root ?? {}) },
    { relativePath: "src", kind: "DIRECTORY", accessible: true, identityToken: "src:v1", filesystemId: "fs:1", ...(overrides.src ?? {}) },
  ];
}

function overwrite(capsule, overrides = {}) {
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ relativePath: capsule.normalizedRelativePath }), expected: { expectedKind: "FILE", expectedFingerprint: "before", ownershipRef: "owner:m05" }, desiredFingerprint: "after", ...overrides });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function traversal(capsule, target = observation({ relativePath: capsule.normalizedRelativePath }), extra = {}) {
  const result = proveFilesystemTraversal({ path: capsule, ancestors: ancestors(), target, ...extra });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function primitive(operation = "UPDATE", overrides = {}) {
  return { capabilityRef: `cap:${operation}:v1`, operation, visibilityAtomic: true, raceResistant: true, noClobberCreate: operation === "CREATE" || operation === "STAGE", replaceExisting: operation === "UPDATE" || operation === "RESTORE", requiresSameFilesystem: operation !== "REMOVE", durability: "UNPROVEN", ...overrides };
}

test("POSIX path authorization is root-relative and component aware", () => {
  const result = authorizeFilesystemPath({ root: posixRoot, operation: "UPDATE", relativePath: "src/./a.txt" });
  assert.equal(result.ok, true);
  assert.equal(result.value.normalizedRelativePath, "src/a.txt");
  assert.equal(result.value.physicalTarget, "/repo/src/a.txt");
});

test("parent traversal and absolute targets never gain path authority", () => {
  for (const relativePath of ["../outside", "src/../../outside", "/tmp/file"]) assert.equal(authorizeFilesystemPath({ root: posixRoot, operation: "UPDATE", relativePath }).ok, false, relativePath);
});

test("root mutation is denied while root read may be admitted", () => {
  assert.equal(authorizeFilesystemPath({ root: posixRoot, operation: "REMOVE", relativePath: "." }).ok, false);
  assert.equal(authorizeFilesystemPath({ root: posixRoot, operation: "READ", relativePath: "." }).ok, true);
});

test("Windows normalization rejects drive-relative UNC and reserved aliases", () => {
  assert.equal(authorizeFilesystemPath({ root: windowsRoot, operation: "UPDATE", relativePath: "src/a.txt" }).ok, true);
  for (const relativePath of ["C:escape.txt", "C:\\escape.txt", "\\\\server\\share\\x", "src\\CON", "src\\name. "]) assert.equal(authorizeFilesystemPath({ root: windowsRoot, operation: "UPDATE", relativePath }).ok, false, relativePath);
});

test("root operation capability is exact and cannot be inferred", () => {
  const result = authorizeFilesystemPath({ root: { ...posixRoot, allowedOperations: ["READ"] }, operation: "UPDATE", relativePath: "a.txt" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /operation_not_admitted/);
});

test("overlapping physical roots do not collapse distinct authority bindings", () => {
  const project = path(posixRoot, "UPDATE", "private/a.txt");
  const privateRoot = { ...posixRoot, rootRef: "private-root", rootKind: "PRIVATE", physicalRoot: "/repo/private", bindingRef: "private:p1" };
  const privatePath = path(privateRoot, "UPDATE", "a.txt");
  assert.notEqual(project.rootRef, privatePath.rootRef);
  assert.notEqual(project.bindingRef, privatePath.bindingRef);
  assert.notEqual(project.physicalRoot, privatePath.physicalRoot);
});

test("project canonical and private roots remain distinct even when nested", () => {
  const canonical = path(posixRoot, "UPDATE", ".gef/project.json");
  const privateRoot = { ...posixRoot, rootRef: "private-root", rootKind: "PRIVATE", physicalRoot: "/repo/.gef-private", bindingRef: "private:p1" };
  const privateState = path(privateRoot, "UPDATE", "state.json");
  assert.equal(canonical.rootRef, "project-root");
  assert.equal(privateState.rootRef, "private-root");
});

test("CREATE is no-clobber and absent target is admitted", () => {
  const capsule = path(posixRoot, "CREATE");
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ kind: "ABSENT", identityToken: undefined, fingerprint: undefined, filesystemId: undefined, relativePath: capsule.normalizedRelativePath }) });
  assert.equal(result.ok, true);
  assert.equal(result.value.code, "CREATE_ALLOWED_ABSENT");
});

test("CREATE desired state may be noop without fabricating authorship", () => {
  const capsule = path(posixRoot, "CREATE");
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ fingerprint: "same", relativePath: capsule.normalizedRelativePath }), expected: { allowNoopIfDesired: true }, desiredFingerprint: "same" });
  assert.equal(result.ok, true);
  assert.equal(result.value.noop, true);
});

test("CREATE divergent existing target conflicts", () => {
  const capsule = path(posixRoot, "CREATE");
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ relativePath: capsule.normalizedRelativePath }) });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /unexpected_existing/);
});

test("UPDATE requires ownership plus exact current state", () => {
  const capsule = path();
  assert.equal(evaluateFilesystemOverwrite({ path: capsule, observation: observation() }).ok, false);
  const stale = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ fingerprint: "later" }), expected: { expectedKind: "FILE", expectedFingerprint: "before", ownershipRef: "owner:m05" } });
  assert.equal(stale.ok, false);
  assert.match(stale.error.reasonCode, /stale_state/);
});

test("REMOVE missing target is noop only when explicitly admitted", () => {
  const capsule = path(posixRoot, "REMOVE");
  const absent = observation({ kind: "ABSENT", identityToken: undefined, fingerprint: undefined, filesystemId: undefined, relativePath: capsule.normalizedRelativePath });
  assert.equal(evaluateFilesystemOverwrite({ path: capsule, observation: absent }).ok, false);
  assert.equal(evaluateFilesystemOverwrite({ path: capsule, observation: absent, expected: { allowAbsentNoop: true } }).ok, true);
});

test("MOVE source and destination policy are independent", () => {
  const source = path(posixRoot, "MOVE_SOURCE", "a.txt");
  const destination = path(posixRoot, "MOVE_DESTINATION", "b.txt");
  assert.equal(evaluateFilesystemOverwrite({ path: source, observation: observation({ relativePath: "a.txt" }), expected: { expectedKind: "FILE", expectedFingerprint: "before", ownershipRef: "owner:m05" } }).ok, true);
  assert.equal(evaluateFilesystemOverwrite({ path: destination, observation: observation({ relativePath: "b.txt", kind: "ABSENT", identityToken: undefined, fingerprint: undefined, filesystemId: undefined }) }).ok, true);
});

test("unexpected target symlink is not converted into ordinary overwrite", () => {
  const capsule = path();
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ kind: "SYMLINK" }), expected: { expectedKind: "SYMLINK", expectedIdentityToken: "id:a:v1", ownershipRef: "owner:m05" } });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /link_or_alias_requires_s03/);
});

test("safe traversal binds ordered directory and filesystem identities", () => {
  const result = proveFilesystemTraversal({ path: path(), ancestors: ancestors(), target: observation() });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  assert.deepEqual(result.value.dependencyTokens, ["root:v1", "src:v1", "id:a:v1"]);
});

test("symlink junction and classified reparse ancestors block traversal", () => {
  const capsule = path();
  for (const item of [{ kind: "SYMLINK" }, { kind: "JUNCTION" }, { kind: "REPARSE", reparseTag: "TEST_TAG" }]) {
    const result = proveFilesystemTraversal({ path: capsule, ancestors: ancestors({ src: { ...item, identityToken: `${item.kind}:v1` } }), target: observation() });
    assert.equal(result.ok, false, item.kind);
    assert.match(result.error.reasonCode, /link_ancestor_blocked/);
  }
});

test("unknown reparse tag is an explicit capability gap", () => {
  const result = proveFilesystemTraversal({ path: path(), ancestors: ancestors({ src: { kind: "REPARSE", identityToken: "r1", reparseTag: undefined } }), target: observation() });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /unknown_reparse_tag/);
});

test("target link object is not dereferenced by default", () => {
  const result = proveFilesystemTraversal({ path: path(), ancestors: ancestors(), target: observation({ kind: "SYMLINK" }) });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /target_link_requires_typed_operation/);
});

test("hard-link count becomes explicit alias risk", () => {
  assert.equal(traversal(path(), observation({ linkCount: 2 })).aliasRisk, "HARDLINK");
});

test("missing target uses nearest existing ancestors without fabricated identity", () => {
  const capsule = path(posixRoot, "CREATE", "src/new.txt");
  const result = proveFilesystemTraversal({ path: capsule, ancestors: ancestors(), target: { relativePath: "src/new.txt", kind: "ABSENT", accessible: true } });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  assert.deepEqual(result.value.dependencyTokens, ["root:v1", "src:v1"]);
});

test("unknown case semantics cannot manufacture traversal equality", () => {
  const result = proveFilesystemTraversal({ path: path({ ...posixRoot, caseSemantics: "UNKNOWN" }), ancestors: ancestors(), target: observation() });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /case_semantics_unknown/);
});

test("unobservable filesystem boundary fails closed", () => {
  const result = proveFilesystemTraversal({ path: path(), ancestors: ancestors({ src: { filesystemId: undefined } }), target: observation() });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /filesystem_boundary_unobservable/);
});

test("mount or volume boundary inside ancestry fails closed", () => {
  const result = proveFilesystemTraversal({ path: path(), ancestors: ancestors({ src: { filesystemId: "fs:2" } }), target: observation({ filesystemId: "fs:2" }) });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /mount_or_volume_boundary_gap/);
});

test("target filesystem drift from ancestry fails closed", () => {
  const result = proveFilesystemTraversal({ path: path(), ancestors: ancestors(), target: observation({ filesystemId: "fs:2" }) });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /mount_or_volume_boundary_gap/);
});

test("physical safety rejects noop rather than opening mutation effect", () => {
  const capsule = path();
  const overwriteResult = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ fingerprint: "same" }), expected: { expectedKind: "FILE", expectedFingerprint: "same", ownershipRef: "owner:m05", allowNoopIfDesired: true }, desiredFingerprint: "same" });
  assert.equal(overwriteResult.ok, true);
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwriteResult.value, traversal: traversal(capsule, observation({ fingerprint: "same" })), primitive: primitive(), requireCrashDurability: false, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /noop_has_no_effect/);
});

test("CREATE requires race-resistant no-clobber primitive", () => {
  const capsule = path(posixRoot, "CREATE", "src/new.txt");
  const target = { relativePath: "src/new.txt", kind: "ABSENT", accessible: true };
  const overwriteResult = evaluateFilesystemOverwrite({ path: capsule, observation: target });
  assert.equal(overwriteResult.ok, true);
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwriteResult.value, traversal: traversal(capsule, target), primitive: primitive("CREATE", { noClobberCreate: false }), requireCrashDurability: false, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /no_clobber_missing/);
});

test("same-filesystem requirement blocks cross-volume promotion", () => {
  const capsule = path();
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwrite(capsule), traversal: traversal(capsule), primitive: primitive(), requireCrashDurability: false, stagingFilesystemId: "fs:stage", destinationFilesystemId: "fs:target" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /cross_filesystem/);
});

test("crash durability is never inferred from atomic visibility", () => {
  const capsule = path();
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwrite(capsule), traversal: traversal(capsule), primitive: primitive("UPDATE", { durability: "UNPROVEN" }), requireCrashDurability: true, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /durability_gap/);
});

test("composed exact-operation capability is safe only after all layers pass", () => {
  const capsule = path();
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwrite(capsule), traversal: traversal(capsule), primitive: primitive("UPDATE", { durability: "CRASH_DURABLE" }), requireCrashDurability: true, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  assert.equal(result.value.outcome, "FILESYSTEM_MUTATION_SAFE");
});
