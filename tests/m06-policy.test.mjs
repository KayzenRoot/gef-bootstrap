import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeFilesystemPath,
  composeFilesystemPhysicalSafety,
  evaluateFilesystemOverwrite,
  proveFilesystemTraversal,
} from "../packages/kernel/dist/index.js";

const allOps = ["READ", "CREATE", "UPDATE", "REMOVE", "MOVE_SOURCE", "MOVE_DESTINATION", "RESTORE", "STAGE"];
const posixRoot = {
  rootRef: "project-root",
  rootKind: "PROJECT",
  physicalRoot: "/repo",
  pathFlavor: "POSIX",
  caseSemantics: "SENSITIVE",
  allowedOperations: allOps,
  policyRef: "policy:fs:v1",
  pathSemanticsRef: "path:posix:v1",
  bindingRef: "project:p1",
};
const windowsRoot = {
  ...posixRoot,
  physicalRoot: "C:\\repo",
  pathFlavor: "WINDOWS",
  caseSemantics: "INSENSITIVE",
  pathSemanticsRef: "path:windows:v1",
};

function path(root = posixRoot, operation = "UPDATE", relativePath = "src/a.txt") {
  const result = authorizeFilesystemPath({ root, operation, relativePath });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function observation(overrides = {}) {
  return {
    relativePath: "src/a.txt",
    kind: "FILE",
    accessible: true,
    identityToken: "id:a:v1",
    fingerprint: "before",
    filesystemId: "fs:1",
    linkCount: 1,
    ...overrides,
  };
}

function overwrite(capsule, overrides = {}) {
  const result = evaluateFilesystemOverwrite({
    path: capsule,
    observation: observation({ relativePath: capsule.normalizedRelativePath }),
    expected: { expectedKind: "FILE", expectedFingerprint: "before", ownershipRef: "owner:m05" },
    desiredFingerprint: "after",
    ...overrides,
  });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function traversal(capsule, target = observation({ relativePath: capsule.normalizedRelativePath }), overrides = {}) {
  const result = proveFilesystemTraversal({
    path: capsule,
    ancestors: [
      { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1", filesystemId: "fs:1" },
      { relativePath: "src", kind: "DIRECTORY", accessible: true, identityToken: "src:v1", filesystemId: "fs:1" },
    ],
    target,
    ...overrides,
  });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function primitive(operation = "UPDATE", overrides = {}) {
  return {
    capabilityRef: `cap:${operation}:v1`,
    operation,
    visibilityAtomic: true,
    raceResistant: true,
    noClobberCreate: operation === "CREATE" || operation === "STAGE",
    replaceExisting: operation === "UPDATE" || operation === "RESTORE",
    requiresSameFilesystem: operation !== "REMOVE",
    durability: "UNPROVEN",
    ...overrides,
  };
}

test("POSIX path authorization is root-relative and component aware", () => {
  const result = authorizeFilesystemPath({ root: posixRoot, operation: "UPDATE", relativePath: "src/./a.txt" });
  assert.equal(result.ok, true);
  assert.equal(result.value.normalizedRelativePath, "src/a.txt");
  assert.equal(result.value.physicalTarget, "/repo/src/a.txt");
  assert.equal(result.value.outcome, "PATH_ALLOWED_LEXICALLY");
});

test("parent traversal and absolute targets never gain path authority", () => {
  for (const relativePath of ["../outside", "src/../../outside", "/tmp/file"]) {
    const result = authorizeFilesystemPath({ root: posixRoot, operation: "UPDATE", relativePath });
    assert.equal(result.ok, false, relativePath);
  }
});

test("root mutation is denied while root read may be admitted", () => {
  assert.equal(authorizeFilesystemPath({ root: posixRoot, operation: "REMOVE", relativePath: "." }).ok, false);
  assert.equal(authorizeFilesystemPath({ root: posixRoot, operation: "READ", relativePath: "." }).ok, true);
});

test("Windows normalization rejects drive-relative, UNC and reserved aliases", () => {
  const valid = authorizeFilesystemPath({ root: windowsRoot, operation: "UPDATE", relativePath: "src/a.txt" });
  assert.equal(valid.ok, true);
  assert.equal(valid.value.normalizedRelativePath, "src\\a.txt");
  for (const relativePath of ["C:escape.txt", "C:\\escape.txt", "\\\\server\\share\\x", "src\\CON", "src\\name. "]) {
    assert.equal(authorizeFilesystemPath({ root: windowsRoot, operation: "UPDATE", relativePath }).ok, false, relativePath);
  }
});

test("root operation capability is exact and cannot be inferred", () => {
  const root = { ...posixRoot, allowedOperations: ["READ"] };
  const result = authorizeFilesystemPath({ root, operation: "UPDATE", relativePath: "a.txt" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /operation_not_admitted/);
});

test("CREATE is no-clobber and absent target is admitted", () => {
  const capsule = path(posixRoot, "CREATE");
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ kind: "ABSENT", identityToken: undefined, fingerprint: undefined, relativePath: capsule.normalizedRelativePath }) });
  assert.equal(result.ok, true);
  assert.equal(result.value.code, "CREATE_ALLOWED_ABSENT");
});

test("CREATE can report desired-state noop without fabricating authorship", () => {
  const capsule = path(posixRoot, "CREATE");
  const result = evaluateFilesystemOverwrite({
    path: capsule,
    observation: observation({ fingerprint: "same", relativePath: capsule.normalizedRelativePath }),
    expected: { allowNoopIfDesired: true },
    desiredFingerprint: "same",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.noop, true);
  assert.equal(result.value.code, "NOOP_ALREADY_DESIRED");
});

test("CREATE divergent existing target conflicts", () => {
  const capsule = path(posixRoot, "CREATE");
  const result = evaluateFilesystemOverwrite({ path: capsule, observation: observation({ relativePath: capsule.normalizedRelativePath }) });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /unexpected_existing/);
});

test("UPDATE requires ownership plus exact current state", () => {
  const capsule = path();
  const noOwner = evaluateFilesystemOverwrite({ path: capsule, observation: observation() });
  assert.equal(noOwner.ok, false);
  assert.match(noOwner.error.reasonCode, /ownership_unproven/);

  const stale = evaluateFilesystemOverwrite({
    path: capsule,
    observation: observation({ fingerprint: "later" }),
    expected: { expectedKind: "FILE", expectedFingerprint: "before", ownershipRef: "owner:m05" },
  });
  assert.equal(stale.ok, false);
  assert.match(stale.error.reasonCode, /stale_state/);
});

test("REMOVE missing target is only a noop when explicitly admitted", () => {
  const capsule = path(posixRoot, "REMOVE");
  const absent = observation({ kind: "ABSENT", identityToken: undefined, fingerprint: undefined, relativePath: capsule.normalizedRelativePath });
  assert.equal(evaluateFilesystemOverwrite({ path: capsule, observation: absent }).ok, false);
  const admitted = evaluateFilesystemOverwrite({ path: capsule, observation: absent, expected: { allowAbsentNoop: true } });
  assert.equal(admitted.ok, true);
  assert.equal(admitted.value.noop, true);
});

test("MOVE source and destination policy are independent", () => {
  const source = path(posixRoot, "MOVE_SOURCE", "a.txt");
  const destination = path(posixRoot, "MOVE_DESTINATION", "b.txt");
  const sourceResult = evaluateFilesystemOverwrite({
    path: source,
    observation: observation({ relativePath: "a.txt" }),
    expected: { expectedKind: "FILE", expectedFingerprint: "before", ownershipRef: "owner:m05" },
  });
  const destinationResult = evaluateFilesystemOverwrite({
    path: destination,
    observation: observation({ relativePath: "b.txt", kind: "ABSENT", identityToken: undefined, fingerprint: undefined }),
  });
  assert.equal(sourceResult.ok, true);
  assert.equal(destinationResult.ok, true);
  assert.equal(sourceResult.value.code, "MOVE_SOURCE_ALLOWED");
  assert.equal(destinationResult.value.code, "MOVE_DESTINATION_ALLOWED_ABSENT");
});

test("unexpected target symlink is not converted into an ordinary overwrite", () => {
  const capsule = path();
  const result = evaluateFilesystemOverwrite({
    path: capsule,
    observation: observation({ kind: "SYMLINK" }),
    expected: { expectedKind: "SYMLINK", expectedIdentityToken: "id:a:v1", ownershipRef: "owner:m05" },
  });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /link_or_alias_requires_s03/);
});

test("safe traversal requires ordered directory identities", () => {
  const capsule = path();
  const result = proveFilesystemTraversal({
    path: capsule,
    ancestors: [
      { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1" },
      { relativePath: "src", kind: "DIRECTORY", accessible: true, identityToken: "src:v1" },
    ],
    target: observation(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.outcome, "TRAVERSAL_SAFE_PENDING_ATOMIC_COMMIT");
  assert.deepEqual(result.value.dependencyTokens, ["root:v1", "src:v1", "id:a:v1"]);
});

test("symlink junction or reparse ancestor blocks traversal", () => {
  const capsule = path();
  for (const kind of ["SYMLINK", "JUNCTION", "REPARSE"]) {
    const result = proveFilesystemTraversal({
      path: capsule,
      ancestors: [
        { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1" },
        { relativePath: "src", kind, accessible: true, identityToken: `${kind}:v1` },
      ],
      target: observation(),
    });
    assert.equal(result.ok, false, kind);
    assert.match(result.error.reasonCode, /link_ancestor_blocked/);
  }
});

test("target link object is not dereferenced by default", () => {
  const capsule = path();
  const result = proveFilesystemTraversal({
    path: capsule,
    ancestors: [{ relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1" }],
    target: observation({ kind: "SYMLINK" }),
  });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /target_link_requires_typed_operation/);
});

test("hard-link count becomes explicit alias risk", () => {
  const capsule = path();
  const proof = traversal(capsule, observation({ linkCount: 2 }));
  assert.equal(proof.aliasRisk, "HARDLINK");
});

test("missing target remains traversable from existing ancestors", () => {
  const capsule = path(posixRoot, "CREATE", "src/new.txt");
  const proof = proveFilesystemTraversal({
    path: capsule,
    ancestors: [
      { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1" },
      { relativePath: "src", kind: "DIRECTORY", accessible: true, identityToken: "src:v1" },
    ],
    target: { relativePath: "src/new.txt", kind: "ABSENT", accessible: true },
  });
  assert.equal(proof.ok, true);
  assert.deepEqual(proof.value.dependencyTokens, ["root:v1", "src:v1"]);
});

test("unknown case semantics cannot manufacture traversal equality", () => {
  const root = { ...posixRoot, caseSemantics: "UNKNOWN" };
  const capsule = path(root);
  const result = proveFilesystemTraversal({ path: capsule, ancestors: [], target: observation() });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /case_semantics_unknown/);
});

test("physical safety rejects a noop rather than opening a mutation effect", () => {
  const capsule = path(posixRoot, "UPDATE");
  const overwriteResult = evaluateFilesystemOverwrite({
    path: capsule,
    observation: observation({ fingerprint: "same" }),
    expected: { expectedKind: "FILE", expectedFingerprint: "same", ownershipRef: "owner:m05", allowNoopIfDesired: true },
    desiredFingerprint: "same",
  });
  assert.equal(overwriteResult.ok, true);
  const proof = traversal(capsule, observation({ fingerprint: "same" }));
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwriteResult.value, traversal: proof, primitive: primitive("UPDATE"), requireCrashDurability: false, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /noop_has_no_effect/);
});

test("CREATE requires race-resistant no-clobber primitive", () => {
  const capsule = path(posixRoot, "CREATE", "src/new.txt");
  const target = { relativePath: "src/new.txt", kind: "ABSENT", accessible: true };
  const overwriteResult = evaluateFilesystemOverwrite({ path: capsule, observation: target });
  assert.equal(overwriteResult.ok, true);
  const proof = traversal(capsule, target);
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwriteResult.value, traversal: proof, primitive: primitive("CREATE", { noClobberCreate: false }), requireCrashDurability: false, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /no_clobber_missing/);
});

test("same-filesystem requirement blocks cross-volume promotion", () => {
  const capsule = path();
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwrite(capsule), traversal: traversal(capsule), primitive: primitive("UPDATE"), requireCrashDurability: false, stagingFilesystemId: "fs:stage", destinationFilesystemId: "fs:target" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /cross_filesystem/);
});

test("crash durability is never inferred from atomic visibility", () => {
  const capsule = path();
  const result = composeFilesystemPhysicalSafety({ path: capsule, overwrite: overwrite(capsule), traversal: traversal(capsule), primitive: primitive("UPDATE", { durability: "UNPROVEN" }), requireCrashDurability: true, stagingFilesystemId: "fs:1", destinationFilesystemId: "fs:1" });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /durability_gap/);
});

test("composed exact-operation capability is mutation safe only after all layers pass", () => {
  const capsule = path();
  const result = composeFilesystemPhysicalSafety({
    path: capsule,
    overwrite: overwrite(capsule),
    traversal: traversal(capsule),
    primitive: primitive("UPDATE", { durability: "CRASH_DURABLE" }),
    requireCrashDurability: true,
    stagingFilesystemId: "fs:1",
    destinationFilesystemId: "fs:1",
  });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  assert.equal(result.value.outcome, "FILESYSTEM_MUTATION_SAFE");
  assert.equal(result.value.operation, "UPDATE");
  assert.equal(result.value.durability, "CRASH_DURABLE");
  assert.deepEqual(result.value.dependencyTokens.slice(0, 2), ["policy:policy:fs:v1", "path-semantics:path:posix:v1"]);
});
