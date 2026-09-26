import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { link, lstat, mkdir, mkdtemp, open, readFile, rename, rm, stat, symlink, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  authorizeFilesystemPath,
  composeFilesystemPhysicalSafety,
  evaluateFilesystemOverwrite,
  proveFilesystemTraversal,
} from "../packages/kernel/dist/index.js";

const allOps = ["READ", "CREATE", "UPDATE", "REMOVE", "MOVE_SOURCE", "MOVE_DESTINATION", "RESTORE", "STAGE"];
const sha = (value) => createHash("sha256").update(value).digest("hex");
const separator = () => process.platform === "win32" ? "\\" : "/";
const logical = (parts) => parts.join(separator());

async function tempRoot(t) {
  const root = await mkdtemp(join(tmpdir(), "gef-m06-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

async function detectCaseSemantics(root) {
  const probe = join(root, "GefCaseProbe");
  await writeFile(probe, "x");
  try {
    await lstat(join(root, "gefcaseprobe"));
    return "INSENSITIVE";
  } catch (cause) {
    if (cause?.code === "ENOENT") return "SENSITIVE";
    return "UNKNOWN";
  } finally {
    await rm(probe, { force: true });
  }
}

async function rootDescriptor(root) {
  return Object.freeze({
    rootRef: "real-temp-root",
    rootKind: "TEST_TEMP",
    physicalRoot: root,
    pathFlavor: process.platform === "win32" ? "WINDOWS" : "POSIX",
    caseSemantics: await detectCaseSemantics(root),
    allowedOperations: allOps,
    policyRef: "policy:m06:real-v1",
    pathSemanticsRef: `real:${process.platform}:v1`,
    bindingRef: "ci:temp-root",
  });
}

async function entry(relativePath, physicalPath) {
  try {
    const info = await lstat(physicalPath);
    const kind = info.isSymbolicLink() ? "SYMLINK" : info.isFile() ? "FILE" : info.isDirectory() ? "DIRECTORY" : "SPECIAL";
    const base = {
      relativePath,
      kind,
      accessible: true,
      identityToken: `${String(info.dev)}:${String(info.ino)}`,
      filesystemId: String(info.dev),
      linkCount: Number(info.nlink),
    };
    if (kind === "FILE") return { ...base, fingerprint: sha(await readFile(physicalPath)) };
    return base;
  } catch (cause) {
    if (cause?.code === "ENOENT") return { relativePath, kind: "ABSENT", accessible: true };
    if (cause?.code === "EACCES" || cause?.code === "EPERM") return { relativePath, kind: "UNKNOWN", accessible: false };
    throw cause;
  }
}

async function observe(capsule) {
  const sep = capsule.pathFlavor === "WINDOWS" ? "\\" : "/";
  const components = capsule.normalizedRelativePath.split(sep).filter(Boolean);
  const ancestors = [];
  ancestors.push(await entry("", capsule.physicalRoot));
  let current = capsule.physicalRoot;
  const prefix = [];
  for (const component of components.slice(0, -1)) {
    prefix.push(component);
    current = join(current, component);
    const observed = await entry(prefix.join(sep), current);
    if (observed.kind === "ABSENT") break;
    ancestors.push(observed);
  }
  return { ancestors, target: await entry(capsule.normalizedRelativePath, capsule.physicalTarget) };
}

async function durabilityClass(root) {
  const file = join(root, "durability-probe");
  await writeFile(file, "probe");
  const handle = await open(file, "r+");
  try { await handle.sync(); } finally { await handle.close(); }
  try {
    const directory = await open(root, "r");
    try { await directory.sync(); } finally { await directory.close(); }
    return "CRASH_DURABLE";
  } catch (cause) {
    if (["EISDIR", "EPERM", "EACCES", "EINVAL", "ENOTSUP"].includes(cause?.code)) return "UNPROVEN";
    throw cause;
  } finally {
    await rm(file, { force: true });
  }
}

function primitive(operation, durability, overrides = {}) {
  return {
    capabilityRef: `real:${process.platform}:${operation}:v1`,
    operation,
    visibilityAtomic: true,
    raceResistant: true,
    noClobberCreate: operation === "CREATE" || operation === "STAGE",
    replaceExisting: operation === "UPDATE" || operation === "RESTORE",
    requiresSameFilesystem: operation === "UPDATE" || operation.startsWith("MOVE") || operation === "RESTORE",
    durability,
    ...overrides,
  };
}

async function prepared(root, operation, relativePath, expected, desiredFingerprint, primitiveValue, requireCrashDurability = false) {
  const capsuleResult = authorizeFilesystemPath({ root, operation, relativePath });
  assert.equal(capsuleResult.ok, true, capsuleResult.ok ? "" : capsuleResult.error.summary);
  const capsule = capsuleResult.value;
  const observed = await observe(capsule);
  const overwriteResult = evaluateFilesystemOverwrite({
    path: capsule,
    observation: observed.target,
    ...(expected === undefined ? {} : { expected }),
    ...(desiredFingerprint === undefined ? {} : { desiredFingerprint }),
  });
  assert.equal(overwriteResult.ok, true, overwriteResult.ok ? "" : overwriteResult.error.summary);
  const traversalResult = proveFilesystemTraversal({ path: capsule, ancestors: observed.ancestors, target: observed.target });
  assert.equal(traversalResult.ok, true, traversalResult.ok ? "" : traversalResult.error.summary);
  const parentInfo = await stat(dirname(capsule.physicalTarget));
  const atomic = composeFilesystemPhysicalSafety({
    path: capsule,
    overwrite: overwriteResult.value,
    traversal: traversalResult.value,
    primitive: primitiveValue,
    requireCrashDurability,
    stagingFilesystemId: String(parentInfo.dev),
    destinationFilesystemId: String(parentInfo.dev),
  });
  return { capsule, observed, atomic };
}

test("real exclusive create is no-clobber on the hosted filesystem", async (t) => {
  const physicalRoot = await tempRoot(t);
  await mkdir(join(physicalRoot, "managed"));
  const root = await rootDescriptor(physicalRoot);
  const durability = await durabilityClass(physicalRoot);
  const relativePath = logical(["managed", "created.txt"]);
  const prep = await prepared(root, "CREATE", relativePath, undefined, sha("first"), primitive("CREATE", durability));
  assert.equal(prep.atomic.ok, true, prep.atomic.ok ? "" : prep.atomic.error.summary);

  const first = await open(prep.capsule.physicalTarget, "wx");
  try { await first.writeFile("first"); } finally { await first.close(); }
  await assert.rejects(open(prep.capsule.physicalTarget, "wx"), (cause) => cause?.code === "EEXIST");
  assert.equal(sha(await readFile(prep.capsule.physicalTarget)), sha("first"));
});

test("real staged replacement is either proven atomic or explicitly classified as a platform gap", async (t) => {
  const physicalRoot = await tempRoot(t);
  const managed = join(physicalRoot, "managed");
  const privateDir = join(physicalRoot, ".gef-private", "tx");
  await mkdir(managed, { recursive: true });
  await mkdir(privateDir, { recursive: true });
  const target = join(managed, "update.txt");
  const stage = join(privateDir, "update.stage");
  await writeFile(target, "old");
  await writeFile(stage, "new");
  const root = await rootDescriptor(physicalRoot);
  const durability = await durabilityClass(physicalRoot);
  const relativePath = logical(["managed", "update.txt"]);
  const capsule = authorizeFilesystemPath({ root, operation: "UPDATE", relativePath });
  assert.equal(capsule.ok, true);
  const observed = await observe(capsule.value);
  const overwrite = evaluateFilesystemOverwrite({ path: capsule.value, observation: observed.target, expected: { expectedKind: "FILE", expectedFingerprint: sha("old"), ownershipRef: "ci:owned" }, desiredFingerprint: sha("new") });
  assert.equal(overwrite.ok, true);
  const traversal = proveFilesystemTraversal({ path: capsule.value, ancestors: observed.ancestors, target: observed.target });
  assert.equal(traversal.ok, true);
  const stageStat = await stat(stage);
  const targetParent = await stat(managed);
  assert.equal(String(stageStat.dev), String(targetParent.dev));

  if (process.platform === "win32") {
    const blocked = composeFilesystemPhysicalSafety({ path: capsule.value, overwrite: overwrite.value, traversal: traversal.value, primitive: primitive("UPDATE", durability, { visibilityAtomic: false }), requireCrashDurability: false, stagingFilesystemId: String(stageStat.dev), destinationFilesystemId: String(targetParent.dev) });
    assert.equal(blocked.ok, false);
    assert.match(blocked.error.reasonCode, /visibility_atomicity_missing/);
    console.log("M06_PLATFORM_GAP windows replace-existing atomic visibility is not claimed by the core test adapter");
    return;
  }

  const allowed = composeFilesystemPhysicalSafety({ path: capsule.value, overwrite: overwrite.value, traversal: traversal.value, primitive: primitive("UPDATE", durability), requireCrashDurability: false, stagingFilesystemId: String(stageStat.dev), destinationFilesystemId: String(targetParent.dev) });
  assert.equal(allowed.ok, true, allowed.ok ? "" : allowed.error.summary);
  await rename(stage, target);
  assert.equal(await readFile(target, "utf8"), "new");
});

test("real reversible remove preserves recovery material before logical removal", async (t) => {
  const physicalRoot = await tempRoot(t);
  const managed = join(physicalRoot, "managed");
  const recovery = join(physicalRoot, ".gef-private", "recovery");
  await mkdir(managed, { recursive: true });
  await mkdir(recovery, { recursive: true });
  const target = join(managed, "remove.txt");
  const recoveryFile = join(recovery, "remove.preimage");
  await writeFile(target, "recover-me");
  const bytes = await readFile(target);
  await writeFile(recoveryFile, bytes);
  const recoveryHandle = await open(recoveryFile, "r");
  try {
    try {
      await recoveryHandle.sync();
    } catch (cause) {
      if (!["EPERM", "EACCES", "EINVAL", "ENOTSUP"].includes(cause?.code)) throw cause;
      console.log(`M06_PLATFORM_GAP ${process.platform} recovery-file fsync unavailable: ${cause.code}`);
    }
  } finally {
    await recoveryHandle.close();
  }
  assert.equal(await readFile(recoveryFile, "utf8"), "recover-me");
  await unlink(target);
  await assert.rejects(lstat(target), (cause) => cause?.code === "ENOENT");
  assert.equal(await readFile(recoveryFile, "utf8"), "recover-me");
  await rename(recoveryFile, target);
  assert.equal(await readFile(target, "utf8"), "recover-me");
});

test("real same-filesystem move is observed as source absent and destination present", async (t) => {
  const physicalRoot = await tempRoot(t);
  const managed = join(physicalRoot, "managed");
  await mkdir(managed, { recursive: true });
  const source = join(managed, "source.txt");
  const destination = join(managed, "destination.txt");
  await writeFile(source, "move-me");
  const sourceStat = await stat(source);
  const destinationParent = await stat(managed);
  assert.equal(String(sourceStat.dev), String(destinationParent.dev));
  await rename(source, destination);
  await assert.rejects(lstat(source), (cause) => cause?.code === "ENOENT");
  assert.equal(await readFile(destination, "utf8"), "move-me");
});

test("real symlink/reparse-like target is blocked or recorded as an explicit platform capability gap", async (t) => {
  const physicalRoot = await tempRoot(t);
  const managed = join(physicalRoot, "managed");
  await mkdir(managed, { recursive: true });
  const referent = join(managed, "referent.txt");
  const linkPath = join(managed, "alias.txt");
  await writeFile(referent, "target");
  try {
    await symlink(referent, linkPath, "file");
  } catch (cause) {
    assert.ok(["EPERM", "EACCES", "ENOTSUP"].includes(cause?.code));
    console.log(`M06_PLATFORM_GAP ${process.platform} symlink creation unavailable: ${cause.code}`);
    return;
  }
  const root = await rootDescriptor(physicalRoot);
  const relativePath = logical(["managed", "alias.txt"]);
  const capsule = authorizeFilesystemPath({ root, operation: "UPDATE", relativePath });
  assert.equal(capsule.ok, true);
  const observed = await observe(capsule.value);
  assert.equal(observed.target.kind, "SYMLINK");
  const traversal = proveFilesystemTraversal({ path: capsule.value, ancestors: observed.ancestors, target: observed.target });
  assert.equal(traversal.ok, false);
  assert.match(traversal.error.reasonCode, /target_link_requires_typed_operation/);
});

test("real hard-link alias is surfaced instead of silently permitting in-place mutation", async (t) => {
  const physicalRoot = await tempRoot(t);
  const managed = join(physicalRoot, "managed");
  await mkdir(managed, { recursive: true });
  const first = join(managed, "first.txt");
  const second = join(managed, "second.txt");
  await writeFile(first, "shared");
  try {
    await link(first, second);
  } catch (cause) {
    assert.ok(["EPERM", "EACCES", "ENOTSUP"].includes(cause?.code));
    console.log(`M06_PLATFORM_GAP ${process.platform} hard-link creation unavailable: ${cause.code}`);
    return;
  }
  const root = await rootDescriptor(physicalRoot);
  const relativePath = logical(["managed", "first.txt"]);
  const capsule = authorizeFilesystemPath({ root, operation: "UPDATE", relativePath });
  assert.equal(capsule.ok, true);
  const observed = await observe(capsule.value);
  assert.ok((observed.target.linkCount ?? 0) >= 2);
  const traversal = proveFilesystemTraversal({ path: capsule.value, ancestors: observed.ancestors, target: observed.target });
  assert.equal(traversal.ok, true);
  assert.equal(traversal.value.aliasRisk, "HARDLINK");
});

test("real crash-durability claim is mechanically proven or blocked, never inferred from rename", async (t) => {
  const physicalRoot = await tempRoot(t);
  await mkdir(join(physicalRoot, "managed"));
  const root = await rootDescriptor(physicalRoot);
  const target = join(physicalRoot, "managed", "durable.txt");
  await writeFile(target, "before");
  const durability = await durabilityClass(physicalRoot);
  const relativePath = logical(["managed", "durable.txt"]);
  const prep = await prepared(root, "UPDATE", relativePath, { expectedKind: "FILE", expectedFingerprint: sha("before"), ownershipRef: "ci:owned" }, sha("after"), primitive("UPDATE", durability), true);
  if (durability === "CRASH_DURABLE") {
    assert.equal(prep.atomic.ok, true, prep.atomic.ok ? "" : prep.atomic.error.summary);
  } else {
    assert.equal(prep.atomic.ok, false);
    assert.match(prep.atomic.error.reasonCode, /durability_gap/);
    console.log(`M06_PLATFORM_GAP ${process.platform} directory durability primitive unproven`);
  }
});
