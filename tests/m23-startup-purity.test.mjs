import test from'node:test';
import assert from'node:assert/strict';
test('project-status-engine import is startup-pure',async()=>{const originalNow=Date.now,originalFetch=globalThis.fetch;let touched=false;Date.now=()=>{touched=true;throw new Error('clock');};globalThis.fetch=async()=>{touched=true;throw new Error('network');};try{const mod=await import('../packages/project-status-engine/dist/public.js');assert.equal(Array.isArray(mod.M23_MECHANISMS),true);assert.equal(mod.M23_MECHANISMS.length,30);assert.equal(touched,false);}finally{Date.now=originalNow;globalThis.fetch=originalFetch;}});
