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
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_GIT_TRUST_POLICY, probeWindowsRight, windowsRightsOracleAvailable } from "../dist/index.js";

/**
 * Report observed operating-system rights without participating in a trust decision.
 * Explicit dependencies allow native coverage of Windows-only diagnostics on POSIX.
 */
export function reportWindowsRights({
  platform = process.platform,
  candidates = DEFAULT_GIT_TRUST_POLICY.candidates,
  pathExists = existsSync,
  openFile = openSync,
  closeFile = closeSync,
  right = probeWindowsRight,
  available = windowsRightsOracleAvailable,
  log = console.log,
} = {}) {
  if (platform !== "win32") {
    log(`rights oracle: not applicable on ${platform} (the POSIX effective-write chain is the proof)`);
    return;
  }
  log("rights oracle available:", available());
  for (const candidate of candidates) {
    if (!pathExists(candidate)) {
      log(`${candidate}: ABSENT`);
      continue;
    }
    let contentWritable = false;
    try {
      closeFile(openFile(candidate, "r+"));
      contentWritable = true;
    } catch {
      contentWritable = false;
    }
    const targetDelete = right(candidate, "DELETE", false);
    const parentDeleteChild = right(dirname(candidate), "FILE_DELETE_CHILD", true);
    log(`${candidate}: DELETE=${targetDelete} FILE_DELETE_CHILD=${parentDeleteChild} content-writable=${String(contentWritable)}`);
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  reportWindowsRights();
}
