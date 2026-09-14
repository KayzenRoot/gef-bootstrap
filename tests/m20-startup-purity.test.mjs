import test from'node:test';
import assert from'node:assert/strict';
import{spawnSync}from'node:child_process';
import{fileURLToPath,pathToFileURL}from'node:url';
import{resolve,dirname}from'node:path';
const here=dirname(fileURLToPath(import.meta.url));const mod=pathToFileURL(resolve(here,'../packages/response-contract/dist/public.js')).href;
test('response-contract import is startup-pure',()=>{const script=`const before={cwd:process.cwd(),env:Object.keys(process.env).sort().join('\\n')};await import(${JSON.stringify(mod)});const after={cwd:process.cwd(),env:Object.keys(process.env).sort().join('\\n')};if(JSON.stringify(before)!==JSON.stringify(after))process.exit(7);`;const r=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);});
test('ordinary response semantic API import needs no filesystem network or process execution',async()=>{const m=await import(mod);assert.equal(typeof m.createResponseContractCapsule,'function');assert.equal(typeof m.buildMachineResponseEnvelope,'function');assert.equal(typeof m.detectStaleResponse,'function');});
