#!/usr/bin/env node
/**
 * Windows rights-oracle diagnostics.
 *
 * Prints, for every candidate the trust policy declares, the verdict the operating system gives for
 * the two rights that govern replacement, plus whether the caller can write the file's contents.
 *
 * This is evidence, never a trust decision: it exists so an assurance run records *why* the policy
 * admitted or refused a candidate instead of leaving the outcome unexplained. No absolute trusted
 * path is emitted beyond the policy's own declared candidates, and nothing is written or renamed.
 */

import { existsSync, openSync, closeSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_GIT_TRUST_POLICY, probeWindowsRight, windowsRightsOracleAvailable } from "../dist/index.js";

if (process.platform !== "win32") {
  console.log(`rights oracle: not applicable on ${process.platform} (the POSIX effective-write chain is the proof)`);
  process.exit(0);
}

console.log("rights oracle available:", windowsRightsOracleAvailable());
console.log("caller:", process.env["USERNAME"] ?? "unknown");

for (const candidate of DEFAULT_GIT_TRUST_POLICY.candidates) {
  if (!existsSync(candidate)) {
    console.log(`${candidate}: ABSENT`);
    continue;
  }
  let contentWritable = false;
  try {
    closeSync(openSync(candidate, "r+"));
    contentWritable = true;
  } catch {
    contentWritable = false;
  }
  const targetDelete = probeWindowsRight(candidate, "DELETE", false);
  const parentDeleteChild = probeWindowsRight(dirname(candidate), "FILE_DELETE_CHILD", true);
  console.log(
    `${candidate}: DELETE=${targetDelete} FILE_DELETE_CHILD=${parentDeleteChild} content-writable=${String(contentWritable)}`,
  );
}
