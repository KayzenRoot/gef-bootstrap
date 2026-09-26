import test from'node:test';
import assert from'node:assert/strict';

test('assurance-pipeline import is startup-pure',async()=>{
 const originalNow=Date.now,originalFetch=globalThis.fetch;let touched=false;
 Date.now=()=>{touched=true;throw new Error('clock');};
 globalThis.fetch=async()=>{touched=true;throw new Error('network');};
 try{
  const mod=await import('../packages/assurance-pipeline/dist/public.js');
  assert.equal(Array.isArray(mod.M27_MECHANISMS),true);
  assert.equal(mod.M27_MECHANISMS.length,40);
  assert.equal(new Set(mod.M27_MECHANISMS).size,40);
  assert.equal(touched,false);
 }finally{Date.now=originalNow;globalThis.fetch=originalFetch;}
});
