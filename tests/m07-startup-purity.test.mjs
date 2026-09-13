import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

test("fresh template-engine import does not mutate cwd env or sentinel filesystem tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "gef-m07-purity-"));
  try {
    await writeFile(join(root, "sentinel.txt"), "unchanged");
    const beforeFiles = await readdir(root);
    const beforeCwd = process.cwd();
    const beforeEnv = { ...process.env };
    const url = pathToFileURL(join(process.cwd(), "packages", "template-engine", "dist", "index.js"));
    url.searchParams.set("purity", `${Date.now()}-${Math.random()}`);
    await import(url.href);
    assert.equal(process.cwd(), beforeCwd);
    assert.deepEqual(await readdir(root), beforeFiles);
    assert.deepEqual(process.env, beforeEnv);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
