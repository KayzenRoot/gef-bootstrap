import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('adoption-engine import is startup-pure',async()=>{
  const cwd=process.cwd();const key='GEF_M13_PURITY_SENTINEL';const before=process.env[key];process.env[key]='stable';
  const mod=await import('../packages/adoption-engine/dist/public.js');
  assert.equal(typeof mod.createAdoptionIntentCapsule,'function');assert.equal(process.cwd(),cwd);assert.equal(process.env[key],'stable');
  if(before===undefined)delete process.env[key];else process.env[key]=before;
});

test('ordinary adoption API use requires no filesystem network or process execution',async()=>{
  const {createAdoptionIntentCapsule}=await import('../packages/adoption-engine/dist/public.js');
  const digest={algorithm:'sha256',digest(input){return createHash('sha256').update(input).digest('hex')}};
  const result=createAdoptionIntentCapsule({projectId:'p',mode:'OBSERVE_ONLY',sourcePackIdentity:'sha256:s',profileIdentity:'generic',profileDigest:'sha256:p',policyVersion:'1',requestedDomains:['SCOPE'],riskClass:'STANDARD'},{digest});
  assert.equal(result.ok,true);assert.match(result.value.semanticIdentity,/^sha256:/);
});
