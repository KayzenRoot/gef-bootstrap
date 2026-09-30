// GBS-V11-WO-003 corrective dependency — Windows replacement-rights oracle.
//
// The ACL cases mutate only disposable fixtures. The production policy is queried after each
// fixture is proven live with an independent rename and executable sentinel.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { tmpdir } from "node:os";

import {
  createCliToolObservationPort,
  gitToolDescriptor,
  inspectAdmittedExecutable,
  probeWindowsRight,
  windowsRightsOracleAvailable,
} from "../packages/cli/dist/index.js";
import { windowsReplacementAuthorityWithProbe } from "../packages/cli/dist/registry.js";

const windowsOnly = process.platform === "win32" ? false : "requires Windows ACLs and Win32 access checks";
const EVERYONE = "*S-1-1-0";

function runIcacls(path, args) {
  const result = spawnSync("icacls", [path, ...args], { encoding: "utf8", timeout: 30_000, windowsHide: true });
  assert.equal(result.error, undefined, `icacls could not run: ${result.error?.message ?? "unknown error"}`);
  assert.equal(result.status, 0, `icacls ${args.join(" ")} failed: ${(result.stderr ?? result.stdout ?? "").trim()}`);
}

function describeAcl(path) {
  const result = spawnSync("icacls", [path], { encoding: "utf8", timeout: 30_000, windowsHide: true });
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function createFixture(t, name) {
  const root = mkdtempSync(join(tmpdir(), `gef-${name}-`));
  const commandDirectory = join(root, "cmd");
  mkdirSync(commandDirectory);
  const candidate = join(commandDirectory, "git.exe");
  const systemRoot = process.env["SystemRoot"] ?? "C:\\Windows";
  copyFileSync(join(systemRoot, "System32", "cmd.exe"), candidate);
  const sentinelRoot = mkdtempSync(join(tmpdir(), `gef-${name}-sentinel-`));
  const sentinel = join(sentinelRoot, "executed.txt");

  t.after(() => {
    // Restore inherited fixture ACLs before removal; these changes never touch a path outside root.
    runIcacls(root, ["/reset", "/T", "/C", "/Q"]);
    rmSync(root, { recursive: true, force: true });
    rmSync(sentinelRoot, { recursive: true, force: true });
  });

  const policy = Object.freeze({
    policyRef: "gef.cli.git.windows-rights-fixture.v1",
    roots: Object.freeze([{ root, rationale: "disposable Windows rights fixture" }]),
    candidates: Object.freeze([candidate]),
    aliasBehaviour: "PHYSICAL_TARGET_MUST_PASS_ROOT_AND_PERMISSION_POLICY",
    writeAuthority: "MACHINE_NON_REPLACEABLE",
  });
  return { root, commandDirectory, candidate, policy, sentinel };
}

function proveRunnableAndThenRefused(candidate, policy, sentinel) {
  const command = `echo GEF_RIGHTS_FIXTURE > ${sentinel}`;
  const live = spawnSync(candidate, ["/d", "/c", command], { encoding: "utf8", timeout: 10_000, windowsHide: true });
  assert.equal(live.error, undefined, `fixture executable failed to start: ${live.error?.message ?? "unknown error"}`);
  assert.equal(live.status, 0, `fixture executable failed its liveness probe: ${live.stderr ?? ""}`);
  assert.equal(existsSync(sentinel), true, "the independent liveness probe must create its sentinel");
  rmSync(sentinel, { force: true });

  const port = createCliToolObservationPort(policy);
  const resolution = port.resolve(gitToolDescriptor(candidate, policy));
  const result = port.probe({
    executable: candidate,
    argv: ["/d", "/c", command],
    timeoutMs: 10_000,
    maxOutputBytes: 4_096,
  });
  assert.equal(resolution.status, "UNAVAILABLE", "the high-assurance policy must refuse the fixture");
  assert.equal(result.status, "FAILED", "a refused executable must not be launched");
  assert.equal(existsSync(sentinel), false, "a refused fake executable must leave its sentinel unexecuted");
}

test("H14-Windows fixture: every right in the physical chain must be denied; UNKNOWN fails closed", { skip: windowsOnly }, () => {
  const physical = join(tmpdir(), "gef-rights-policy", "bin", "git.exe");
  const volumeRoot = parse(physical).root;
  const calls = [];
  const denied = windowsReplacementAuthorityWithProbe(physical, (path, right, isDirectory) => {
    calls.push({ path, right, isDirectory });
    return "DENIED";
  });

  assert.equal(denied, null, "a fully proven all-denied chain is eligible when other trust checks pass");
  assert.ok(calls.some((call) => call.path.toLowerCase() === volumeRoot.toLowerCase() && call.right === "FILE_DELETE_CHILD"));
  assert.equal(calls.some((call) => call.path.toLowerCase() === volumeRoot.toLowerCase() && call.right === "DELETE"), false, "the volume root is the termination anchor");
  assert.equal(calls[0].path.toLowerCase(), physical.toLowerCase());
  assert.equal(calls[0].right, "DELETE");
  assert.equal(calls[0].isDirectory, false, "the executable itself is queried first as a file");
  assert.equal(calls[1].path.toLowerCase(), dirname(physical).toLowerCase());
  assert.equal(calls[1].right, "FILE_DELETE_CHILD");
  assert.equal(calls[1].isDirectory, true);
  assert.ok(calls.slice(2).every((call) => call.isDirectory), "every remaining right query targets a directory");

  const unknown = windowsReplacementAuthorityWithProbe(physical, (_path, _right, _isDirectory) => "UNKNOWN");
  assert.equal(unknown, "replacement_rights_proof_unavailable", "UNKNOWN is never treated as DENIED");
});

test("H14-Windows fixture: non-access-denied Win32 failure is UNKNOWN", { skip: windowsOnly }, () => {
  assert.equal(windowsRightsOracleAvailable(), true, "the packaged Windows adapter must load");
  const absent = join(tmpdir(), `gef-rights-absent-${process.pid}`, "git.exe");
  assert.equal(existsSync(absent), false);
  assert.equal(probeWindowsRight(absent, "DELETE", false), "UNKNOWN", "file-not-found is not proof of denial");
  assert.equal(
    windowsReplacementAuthorityWithProbe(absent, (_path, _right, _isDirectory) => probeWindowsRight(absent, "DELETE", false)),
    "replacement_rights_proof_unavailable",
    "the policy fails closed when the oracle cannot prove a right",
  );
});

test("H14-Windows fixture A: target DELETE permits replacement while parent FILE_DELETE_CHILD is denied", { skip: windowsOnly }, (t) => {
  const { commandDirectory, candidate, policy, sentinel } = createFixture(t, "rights-target-delete");
  runIcacls(commandDirectory, ["/deny", `${EVERYONE}:(DC)`]);
  runIcacls(candidate, ["/inheritance:r"]);
  runIcacls(candidate, ["/grant", `${EVERYONE}:(RX,D)`]);

  assert.equal(probeWindowsRight(candidate, "DELETE", false), "ALLOWED", `the target grants DELETE: ${describeAcl(candidate)}`);
  assert.equal(probeWindowsRight(commandDirectory, "FILE_DELETE_CHILD", true), "DENIED", `the parent denies delete-child: ${describeAcl(commandDirectory)}`);
  const replacement = join(commandDirectory, "replaced.exe");
  try {
    renameSync(candidate, replacement);
    renameSync(replacement, candidate);
  } catch (cause) {
    assert.fail(`parent FILE_DELETE_CHILD did not prove a live rename: ${String(cause)}\n${describeAcl(commandDirectory)}\n${describeAcl(candidate)}`);
  }

  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.status, "UNAVAILABLE");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_delete_allowed");
  proveRunnableAndThenRefused(candidate, policy, sentinel);
});

test("H14-Windows fixture B: target DELETE is denied while parent FILE_DELETE_CHILD permits replacement", { skip: windowsOnly }, (t) => {
  const { commandDirectory, candidate, policy, sentinel } = createFixture(t, "rights-parent-delete-child");
  runIcacls(commandDirectory, ["/deny", `${EVERYONE}:(DC)`]);
  runIcacls(candidate, ["/inheritance:r"]);
  runIcacls(candidate, ["/grant", `${EVERYONE}:(RX)`]);

  // First prove that the target itself has no DELETE route while its parent denies FILE_DELETE_CHILD.
  assert.equal(probeWindowsRight(candidate, "DELETE", false), "DENIED", `the target denies DELETE: ${describeAcl(candidate)}`);
  assert.equal(probeWindowsRight(commandDirectory, "FILE_DELETE_CHILD", true), "DENIED", "the parent initially denies delete-child");

  // Now enable only the parent route. Windows may report the effective DELETE open on the file as
  // allowed through this parent right, so the independent parent probe and live rename are the proof.
  runIcacls(commandDirectory, ["/remove:d", EVERYONE]);
  runIcacls(commandDirectory, ["/grant", `${EVERYONE}:(DC)`]);
  assert.equal(probeWindowsRight(commandDirectory, "FILE_DELETE_CHILD", true), "ALLOWED", "the parent grants delete-child");
  assert.equal(probeWindowsRight(dirname(candidate), "FILE_DELETE_CHILD", true), "ALLOWED");
  const replacement = join(commandDirectory, "replaced.exe");
  try {
    renameSync(candidate, replacement);
    renameSync(replacement, candidate);
  } catch (cause) {
    assert.fail(`parent FILE_DELETE_CHILD did not prove a live rename: ${String(cause)}\n${describeAcl(commandDirectory)}\n${describeAcl(candidate)}`);
  }

  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.status, "UNAVAILABLE");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_delete_allowed");
  proveRunnableAndThenRefused(candidate, policy, sentinel);
});
