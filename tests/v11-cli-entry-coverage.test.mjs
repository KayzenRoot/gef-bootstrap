import test from "node:test";
import assert from "node:assert/strict";
import { launchCli } from "../packages/cli/bin/gef.mjs";

test("CLI shim: successful entry calls the actual returned main without error effects", async () => {
  const calls = [];
  await launchCli({
    loadEntry: async () => ({ main: async () => { calls.push("main"); } }),
    writeError: () => assert.fail("successful CLI must not write a failure message"),
    setExitCode: () => assert.fail("successful CLI must not set a failure code"),
  });
  assert.deepEqual(calls, ["main"]);
});

test("CLI shim: missing built entry reports the exact module error and fail-closed code", async () => {
  const lines = [];
  const exits = [];
  await launchCli({
    loadEntry: async () => {
      const error = new Error("fixture module is absent");
      error.code = "ERR_MODULE_NOT_FOUND";
      throw error;
    },
    writeError: line => lines.push(line),
    setExitCode: code => exits.push(code),
  });
  assert.deepEqual(lines, ["gef: CLI entry is unavailable (ERR_MODULE_NOT_FOUND). Build the workspace or reinstall the package.\n"]);
  assert.deepEqual(exits, [40]);
});

test("CLI shim: a failing main reports its error name and cannot report success", async () => {
  const lines = [];
  const exits = [];
  await launchCli({
    loadEntry: async () => ({ main: async () => { throw new TypeError("fixture error"); } }),
    writeError: line => lines.push(line),
    setExitCode: code => exits.push(code),
  });
  assert.deepEqual(lines, ["gef: CLI entry is unavailable (TypeError). Build the workspace or reinstall the package.\n"]);
  assert.deepEqual(exits, [40]);
});

test("CLI shim: an untyped failure uses UNKNOWN instead of leaking a stack trace", async () => {
  const lines = [];
  const exits = [];
  await launchCli({
    loadEntry: async () => { throw null; },
    writeError: line => lines.push(line),
    setExitCode: code => exits.push(code),
  });
  assert.deepEqual(lines, ["gef: CLI entry is unavailable (UNKNOWN). Build the workspace or reinstall the package.\n"]);
  assert.deepEqual(exits, [40]);
});
