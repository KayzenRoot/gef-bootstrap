import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = new URL("../", import.meta.url);
const forbidden = Object.freeze(["U" + "ADS", "A" + "UDS", "H" + "ive"]);
const tokenPattern = (token) => new RegExp("(^|[^A-Za-z0-9])" + token + "([^A-Za-z0-9]|$)", "i");
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

test("V1.1 current tree contains no legacy ecosystem-specific bindings", () => {
  const rootPath = ROOT.pathname.startsWith("/") && process.platform === "win32"
    ? decodeURIComponent(ROOT.pathname.slice(1))
    : decodeURIComponent(ROOT.pathname);
  const violations = [];
  for (const absolute of walk(rootPath)) {
    const rel = relative(rootPath, absolute).replaceAll("\\", "/");
    const lowerPath = rel.toLowerCase();
    for (const token of forbidden) {
      if (tokenPattern(token).test(rel)) violations.push(`path:${rel}`);
    }
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
