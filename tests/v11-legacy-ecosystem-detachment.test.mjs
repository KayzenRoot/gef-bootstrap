import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = new URL("../", import.meta.url);
const forbidden = Object.freeze(["U" + "ADS", "A" + "UDS", "H" + "ive"]);
const tokenPattern = (token) => new RegExp("(^|[^A-Za-z0-9])" + token + "([^A-Za-z0-9]|$)", "i");
const retirementName = forbidden[2].toUpperCase();
const acceptedGovernanceHistory = new Set([
  ".engineering/CHECKPOINT.json",
  ".engineering/CHECKPOINT.md",
  ".engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md",
  ".engineering/CONSTITUTION-LOCK.md",
  ".engineering/DECISIONS-LEDGER.md",
  ".engineering/DECISIONS-SUPERSESSION-MAP.md",
  ".engineering/PROJECT-OVERVIEW.md",
  ".engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013-GATE2.json",
  ".engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013.json",
  ".engineering/evidence/GBS-GOV-CODEX-ISSUES-001-EVIDENCE.md",
  ".engineering/evidence/GBS-V11-RELEASE-ONEPASS-013-GATE-MATRIX.json",
  ".engineering/evidence/GBS-V11-RELEASE-ONEPASS-013-GATE2-EVIDENCE.md",
  ".engineering/work-orders/GBS-V11-RELEASE-ONEPASS-013.md",
  // The active Work Order is governance text and names its consumer repo; it is not a product binding.
  ".engineering/work-orders/GBS-V11-WO-011.md",
  ".engineering/context-locks/GBS-V11-WO-012.json",
  ".engineering/execution-briefs/GBS-V11-WO-012-DIRECT.md",
  ".engineering/work-orders/GBS-V11-WO-012.md",
  ".engineering/evidence/GBS-V11-WO-012-EVIDENCE.md",
  ".engineering/evidence/GBS-V11-WO-012-RELEASE-MANIFEST.json",
  "AGENTS.md",
  ".engineering/decisions/ADR-0007-RETIRE-" + retirementName + "-INTEGRATION.md",
  ".engineering/context-locks/GBS-MAINT-" + retirementName + "-REMOVAL-001.md",
  ".engineering/evidence/GBS-MAINT-" + retirementName + "-REMOVAL-001-EVIDENCE.md",
  ".engineering/work-orders/GBS-MAINT-" + retirementName + "-REMOVAL-001.md",
]);
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage", "tmp", ".turbo"]);
const textExtensions = new Set([".md", ".json", ".ts", ".js", ".mjs", ".cjs", ".yml", ".yaml", ".txt", ".toml"]);
const explicitTextFiles = new Set(["LICENSE"]);

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

test("V1.1 active surfaces contain no retired bindings while approved governance history is preserved", () => {
  const rootPath = ROOT.pathname.startsWith("/") && process.platform === "win32"
    ? decodeURIComponent(ROOT.pathname.slice(1))
    : decodeURIComponent(ROOT.pathname);
  const violations = [];
  for (const absolute of walk(rootPath)) {
    const rel = relative(rootPath, absolute).replaceAll("\\", "/");
    const acceptedHistory = acceptedGovernanceHistory.has(rel);
    for (const token of forbidden) {
      if (!acceptedHistory && tokenPattern(token).test(rel)) violations.push(`path:${rel}`);
    }
    if (acceptedHistory) continue;
    const ext = extname(rel).toLowerCase();
    if (!textExtensions.has(ext) && !explicitTextFiles.has(rel)) continue;
    const size = statSync(absolute).size;
    if (size > 2 * 1024 * 1024) continue;
    const body = readFileSync(absolute, "utf8");
    for (const token of forbidden) {
      if (tokenPattern(token).test(body)) violations.push(`content:${rel}`);
    }
  }
  assert.deepEqual([...new Set(violations)].sort(), []);
});
