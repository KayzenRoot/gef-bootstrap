import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { reportWindowsRights } from "../packages/cli/scripts/rights-diagnostics.mjs";
import { pack } from "../packages/cli/scripts/prepare-package.mjs";

test("rights diagnostics: a non-Windows host does not probe replacement rights", () => {
  const lines = [];
  reportWindowsRights({
    platform: "linux",
    candidates: ["not-inspected"],
    available: () => assert.fail("Windows oracle must not run on POSIX"),
    pathExists: () => assert.fail("candidate must not be opened on POSIX"),
    log: (...values) => lines.push(values.join(" ")),
  });
  assert.deepEqual(lines, ["rights oracle: not applicable on linux (the POSIX effective-write chain is the proof)"]);
});

test("rights diagnostics: Windows reports absent and content-writable candidates", () => {
  const present = join("fixture", "bin", "git.exe");
  const missing = join("fixture", "bin", "absent.exe");
  const lines = [];
  const probes = [];
  let closed = 0;
  reportWindowsRights({
    platform: "win32",
    candidates: [missing, present],
    available: () => true,
    pathExists: path => path === present,
    openFile: (path, mode) => {
      assert.equal(path, present);
      assert.equal(mode, "r+");
      return 17;
    },
    closeFile: handle => {
      assert.equal(handle, 17);
      closed += 1;
    },
    right: (path, permission, isDirectory) => {
      probes.push({ path, permission, isDirectory });
      return permission === "DELETE" ? "DENIED" : "UNKNOWN";
    },
    log: (...values) => lines.push(values.join(" ")),
  });
  assert.equal(closed, 1);
  assert.deepEqual(probes, [
    { path: present, permission: "DELETE", isDirectory: false },
    { path: dirname(present), permission: "FILE_DELETE_CHILD", isDirectory: true },
  ]);
  assert.deepEqual(lines, [
    "rights oracle available: true",
    `${missing}: ABSENT`,
    `${present}: DELETE=DENIED FILE_DELETE_CHILD=UNKNOWN content-writable=true`,
  ]);
});

test("rights diagnostics: a denied content-open remains independent of the rights oracle", () => {
  const candidate = join("fixture", "locked", "git.exe");
  const lines = [];
  reportWindowsRights({
    platform: "win32",
    candidates: [candidate],
    available: () => false,
    pathExists: path => path === candidate,
    openFile: () => {
      const error = new Error("simulated access denied");
      error.code = "EACCES";
      throw error;
    },
    closeFile: () => assert.fail("failed open must never be closed"),
    right: (_path, permission) => permission === "DELETE" ? "UNKNOWN" : "DENIED",
    log: (...values) => lines.push(values.join(" ")),
  });
  assert.deepEqual(lines, [
    "rights oracle available: false",
    `${candidate}: DELETE=UNKNOWN FILE_DELETE_CHILD=DENIED content-writable=false`,
  ]);
});

test("package preparation: in-process pack produces a manifested CLI tarball", { timeout: 180_000 }, t => {
  const destination = mkdtempSync(join(tmpdir(), "gef-patch-coverage-pack-"));
  t.after(() => rmSync(destination, { recursive: true, force: true }));
  const tarball = pack(destination);
  assert.equal(existsSync(tarball), true);
  assert.equal(tarball.endsWith(".tgz"), true);
  assert.equal(dirname(tarball), destination);
  assert.ok(readFileSync(tarball).length > 1024, "a real package tarball must be produced");
});
