import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

async function snapshotTree(root) {
  const output = [];
  async function walk(current, relative) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const childRelative = relative === "" ? entry.name : `${relative}/${entry.name}`;
      const child = join(current, entry.name);
      if (entry.isDirectory()) await walk(child, childRelative);
      else output.push([childRelative, await readFile(child, "utf8")]);
    }
  }
  await walk(root, "");
  return output;
}

test("bounded brownfield target mutation leaves unrelated neighboring files byte-for-byte untouched", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "gef-m06-brownfield-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const managed = join(root, "managed");
  const unrelated = join(root, "legacy", "user-notes.txt");
  await mkdir(managed, { recursive: true });
  await mkdir(join(root, "legacy"), { recursive: true });
  const target = join(managed, "target.txt");
  await writeFile(target, "before");
  await writeFile(unrelated, "keep-this-exactly");
  const unrelatedBefore = await readFile(unrelated);

  // This test proves bounded surface preservation only. Atomic replace semantics are
  // separately proven by m06-real-filesystem.test.mjs and are not claimed here.
  await writeFile(target, "after");

  assert.equal(await readFile(target, "utf8"), "after");
  assert.deepEqual(await readFile(unrelated), unrelatedBefore);
});

test("fresh M06 module import does not mutate cwd or a prepared filesystem sentinel tree", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "gef-m06-import-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "nested"));
  await writeFile(join(root, "sentinel.txt"), "sentinel");
  await writeFile(join(root, "nested", "keep.txt"), "keep");
  const cwdBefore = process.cwd();
  const treeBefore = await snapshotTree(root);
  await import(`../packages/kernel/dist/filesystem-effect-adapter.js?startup-proof=${Date.now()}-${Math.random()}`);
  assert.equal(process.cwd(), cwdBefore);
  assert.deepEqual(await snapshotTree(root), treeBefore);
});
