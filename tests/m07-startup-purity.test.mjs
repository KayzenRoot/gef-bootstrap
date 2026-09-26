import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function envSnapshot() {
  return Object.fromEntries(Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b)));
}

test("fresh template-engine import does not mutate cwd env or sentinel filesystem tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "gef-m07-purity-"));
  try {
    const sentinelPath = join(root, "sentinel.txt");
    await writeFile(sentinelPath, "unchanged");
    const beforeFiles = [...await readdir(root)].sort();
    const beforeSentinel = await readFile(sentinelPath, "utf8");
    const beforeCwd = process.cwd();
    const beforeEnv = envSnapshot();

    const url = pathToFileURL(join(process.cwd(), "packages", "template-engine", "dist", "index.js"));
    url.searchParams.set("purity", "fresh-import");
    await import(url.href);

    assert.equal(process.cwd(), beforeCwd);
    assert.deepEqual([...await readdir(root)].sort(), beforeFiles);
    assert.equal(await readFile(sentinelPath, "utf8"), beforeSentinel);
    assert.deepEqual(envSnapshot(), beforeEnv);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
