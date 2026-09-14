import test from 'node:test';
import assert from 'node:assert/strict';

test('source-pack import has no observable startup side effects', async () => {
  const beforeEnv = { ...process.env };
  const beforeCwd = process.cwd();
  const mod = await import('../packages/source-pack/dist/public.js');
  assert.equal(typeof mod.buildSourcePack,'function');
  assert.equal(process.cwd(),beforeCwd);
  assert.deepEqual(process.env,beforeEnv);
});

test('ordinary API use does not require filesystem network or process execution', async () => {
  const { buildSourcePack } = await import('../packages/source-pack/dist/public.js');
  const digest = { algorithm:'sha256', digest(input) { return 'a'.repeat(64); } };
  const r = buildSourcePack({projectId:'pure',entries:[]},{digest});
  assert.equal(r.ok,true);
  assert.match(r.value.semanticIdentity,/^sha256:/);
});
