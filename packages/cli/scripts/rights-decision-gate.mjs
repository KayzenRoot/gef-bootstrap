#!/usr/bin/env node
/**
 * Windows rights decision gate.
 *
 * Asserts the invariant that matters on any assurance token, privileged or not: the trust policy's
 * decision for every declared candidate must **agree with the operating system's own answer** for
 * the rights that govern replacement and for content write access.
 *
 * - a candidate is admitted only when every right is denied to this token;
 * - a candidate is refused whenever this token holds any right that permits replacing it;
 * - no candidate is admitted on an unprovable verdict.
 *
 * The gate also reports whether this token can replace the machine Git, because that determines
 * whether the parity suites (which assert Git-backed behaviour) are exercisable here: an elevated
 * token genuinely can replace it, and the policy then withholds it by design.
 *
 * Writes `parity=yes|no` to the GitHub step output when running in Actions.
 */

import { existsSync, openSync, closeSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_GIT_TRUST_POLICY, inspectAdmittedExecutable, probeWindowsRight } from "../dist/index.js";

if (process.platform !== "win32") {
  console.log(`decision gate: not applicable on ${process.platform}; the POSIX effective-write chain is the proof`);
  process.exit(0);
}

const problems = [];
let parity = false;

for (const candidate of DEFAULT_GIT_TRUST_POLICY.candidates) {
  const inspection = inspectAdmittedExecutable(candidate, DEFAULT_GIT_TRUST_POLICY);
  if (!existsSync(candidate)) {
    if (inspection.status !== "ABSENT") problems.push(`${candidate}: absent on disk but policy said ${inspection.status}`);
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
  const replaceableAnywhere = contentWritable || targetDelete === "ALLOWED" || parentDeleteChild === "ALLOWED";
  const unprovable = targetDelete === "UNKNOWN" || parentDeleteChild === "UNKNOWN";
  const admitted = inspection.status === "FOUND";

  console.log(
    `${candidate}: DELETE=${targetDelete} FILE_DELETE_CHILD=${parentDeleteChild} content-writable=${String(contentWritable)} policy=${inspection.status}`,
  );

  if (replaceableAnywhere && admitted) problems.push(`${candidate}: admitted although this token can replace it`);
  if (unprovable && admitted) problems.push(`${candidate}: admitted although a right query was UNKNOWN`);
  if (!replaceableAnywhere && !unprovable && inspection.status === "UNAVAILABLE") {
    problems.push(`${candidate}: refused although every right is denied (${inspection.reasonCode ?? "no reason"})`);
  }
  if (admitted) parity = true;
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`INCONSISTENT: ${problem}`);
  console.error("the policy decision does not agree with the operating system's answer");
  process.exit(1);
}

console.log(parity ? "parity=yes (this token cannot replace the machine Git, so it is admitted)" : "parity=no (this token can replace the machine Git, so the policy withholds it by design)");
const output = process.env.GITHUB_OUTPUT;
if (typeof output === "string" && output.length > 0) appendFileSync(output, `parity=${parity ? "yes" : "no"}\n`);
