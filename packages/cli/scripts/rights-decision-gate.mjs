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

import { existsSync, openSync, closeSync, appendFileSync, realpathSync } from "node:fs";
import { dirname, parse, win32 } from "node:path";
import { DEFAULT_GIT_TRUST_POLICY, inspectAdmittedExecutable, probeWindowsRight } from "../dist/index.js";

if (process.platform !== "win32") {
  console.log(`decision gate: not applicable on ${process.platform}; the POSIX effective-write chain is the proof`);
  process.exit(0);
}

const problems = [];
let parity = false;

/** Independently enumerate the OS rights that govern replacing every entry in the physical chain. */
function observeReplacementRights(physical) {
  const volumeRoot = parse(physical).root;
  if (volumeRoot.length === 0) return null;
  const observations = [
    probeWindowsRight(physical, "DELETE", false),
    probeWindowsRight(dirname(physical), "FILE_DELETE_CHILD", true),
  ];
  let current = dirname(physical);
  while (win32.normalize(current).toLowerCase() !== win32.normalize(volumeRoot).toLowerCase()) {
    observations.push(probeWindowsRight(current, "DELETE", true));
    const parent = dirname(current);
    if (parent === current) return null;
    observations.push(probeWindowsRight(parent, "FILE_DELETE_CHILD", true));
    current = parent;
  }
  return observations;
}

const rightPolicyRefusals = new Set([
  "gef.cli.git.physical_path_delete_allowed",
  "gef.cli.git.physical_path_parent_delete_child_allowed",
  "gef.cli.git.physical_path_ancestor_replaceable",
  "gef.cli.git.replacement_rights_proof_unavailable",
]);

for (const [index, candidate] of DEFAULT_GIT_TRUST_POLICY.candidates.entries()) {
  const inspection = inspectAdmittedExecutable(candidate, DEFAULT_GIT_TRUST_POLICY);
  if (!existsSync(candidate)) {
    if (inspection.status !== "ABSENT") problems.push(`${candidate}: absent on disk but policy said ${inspection.status}`);
    continue;
  }
  // Other admission failures (for example a non-regular or out-of-root alias) are outside this
  // rights comparison. A rights refusal, however, must agree with the independent OS observations.
  if (inspection.status === "UNAVAILABLE" && !rightPolicyRefusals.has(inspection.reasonCode ?? "")) continue;

  let physical;
  try {
    physical = realpathSync.native(candidate);
  } catch {
    problems.push(`candidate-${index + 1}: policy admitted or rights-refused an unresolvable path`);
    continue;
  }
  let contentWritable = false;
  try {
    closeSync(openSync(physical, "r+"));
    contentWritable = true;
  } catch {
    contentWritable = false;
  }
  const rights = observeReplacementRights(physical);
  if (rights === null) {
    problems.push(`candidate-${index + 1}: physical path has no verifiable volume-root chain`);
    continue;
  }
  const replaceableAnywhere = contentWritable || rights.includes("ALLOWED");
  const unprovable = rights.includes("UNKNOWN");
  const admitted = inspection.status === "FOUND";
  const counts = { allowed: rights.filter((right) => right === "ALLOWED").length, denied: rights.filter((right) => right === "DENIED").length, unknown: rights.filter((right) => right === "UNKNOWN").length };

  console.log(`candidate-${index + 1}: rights=${JSON.stringify(counts)} content-writable=${String(contentWritable)} policy=${inspection.status}`);

  if (replaceableAnywhere && admitted) problems.push(`candidate-${index + 1}: admitted although this token can replace it`);
  if (unprovable && admitted) problems.push(`candidate-${index + 1}: admitted although a right query was UNKNOWN`);
  if (!replaceableAnywhere && !unprovable && inspection.status === "UNAVAILABLE" && rightPolicyRefusals.has(inspection.reasonCode ?? "")) {
    problems.push(`candidate-${index + 1}: refused although every right is denied (${inspection.reasonCode ?? "no reason"})`);
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
