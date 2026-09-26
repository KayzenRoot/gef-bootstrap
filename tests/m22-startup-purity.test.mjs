import test from'node:test';
import assert from'node:assert/strict';
test('estimation-engine import is startup-pure',async()=>{const originalNow=Date.now,originalFetch=globalThis.fetch;let touched=false;Date.now=()=>{touched=true;throw new Error('clock');};globalThis.fetch=async()=>{touched=true;throw new Error('network');};try{const mod=await import('../packages/estimation-engine/dist/public.js');assert.equal(Array.isArray(mod.M22_MECHANISMS),true);assert.equal(touched,false);}finally{Date.now=originalNow;globalThis.fetch=originalFetch;}});
