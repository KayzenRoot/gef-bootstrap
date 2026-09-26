import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const read = path => existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const validation = read("validation.log").toString("utf8");
const audit = read("dependency-audit.log").toString("utf8");
const install = read("install.log").toString("utf8");
const summary = {};
for (const [key, pattern] of Object.entries({
  tests: /(?:#|ℹ) tests\s+(\d+)/i,
  passed: /(?:#|ℹ) pass\s+(\d+)/i,
  failed: /(?:#|ℹ) fail\s+(\d+)/i,
  skipped: /(?:#|ℹ) skipped\s+(\d+)/i,
})) {
  const match = validation.match(pattern);
  summary[key] = match ? Number(match[1]) : null;
}
const vulnerabilities = audit.match(/found\s+(\d+)\s+vulnerabilities?/i);
const receipt = {
  schemaVersion: 1,
  candidateSha: process.env.GEF_CANDIDATE_SHA ?? process.env.GITHUB_SHA ?? null,
  headRef: process.env.GEF_HEAD_REF ?? null,
  workflowRunId: process.env.GITHUB_RUN_ID ?? null,
  workflowRunAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  platform: process.env.RUNNER_OS ?? process.platform,
  node: process.version,
  outcomes: {
    dependencyInstall: process.env.GEF_INSTALL_OUTCOME ?? "UNKNOWN",
    fullValidation: process.env.GEF_VALIDATE_OUTCOME ?? "UNKNOWN",
    dependencyAudit: process.env.GEF_AUDIT_OUTCOME ?? "UNKNOWN",
  },
  regressionSummary: summary,
  npmAuditVulnerabilities: vulnerabilities ? Number(vulnerabilities[1]) : null,
  logs: {
    install: { sha256: digest(read("install.log")), bytes: install.length },
    validation: { sha256: digest(read("validation.log")), bytes: validation.length },
    dependencyAudit: { sha256: digest(read("dependency-audit.log")), bytes: audit.length },
  },
  frozenSuites: ["UNIT", "INT", "CLI-E2E", "DIST-SMOKE", "UPG-MIG", "COMPAT", "CTX-DET", "INC-VAL", "PROOF-INV", "TELEM", "SEC-INT", "REG"],
  numberedCases: {
    "CLI-E2E": "01..07",
    "DIST-SMOKE": "01..04",
    "UPG-MIG": "01..07",
    "COMPAT": "01..06",
    "CTX-DET": "01..08",
    "INC-VAL": "01..05",
    "PROOF-INV": "01..05",
    "TELEM": "01..06",
    "SEC-INT": "01..07",
    "REG": "01..07",
    "CONT-RESUME": "01..04",
  },
};
writeFileSync("assurance-receipt.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
