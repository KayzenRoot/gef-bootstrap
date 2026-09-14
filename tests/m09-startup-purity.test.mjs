import test from 'node:test';
import assert from 'node:assert/strict';

test('source-pack import has no observable startup side effects', async () => {
  const beforeCwd = process.cwd();
  const key = 'GEF_M09_STARTUP_PURITY_SENTINEL';
  const before = process.env[key];
  process.env[key] = 'unchanged';
  const mod = await import('../packages/source-pack/dist/public.js');
  assert.equal(typeof mod.buildSourcePack,'function');
  assert.equal(process.cwd(),beforeCwd);
  assert.equal(process.env[key],'unchanged');
  if (before === undefined) delete process.env[key]; else process.env[key] = before;
});

test('ordinary API use does not require filesystem network or process execution', async () => {
  const { buildSourcePack } = await import('../packages/source-pack/dist/public.js');
  const digest = { algorithm:'sha256', digest() { return 'a'.repeat(64); } };
  const r = buildSourcePack({projectId:'pure',entries:[]},{digest});
  assert.equal(r.ok,true);
  assert.match(r.value.semanticIdentity,/^sha256:/);
});
