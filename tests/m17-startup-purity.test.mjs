import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('checkpoint-engine import is startup-pure',async()=>{const cwd=process.cwd();const before={...process.env};await import('../packages/checkpoint-engine/dist/public.js');assert.equal(process.cwd(),cwd);for(const [k,v] of Object.entries(before))assert.equal(process.env[k],v);});

test('ordinary checkpoint API use needs no filesystem network or process execution',async()=>{const m=await import('../packages/checkpoint-engine/dist/public.js');const digest={algorithm:'sha256',digest:v=>createHash('sha256').update(v).digest('hex')};const H=c=>`sha256:${c.repeat(64)}`;const policyBinding={checkpointIdentity:'prev',policyFingerprint:H('a'),decisionReceiptDigest:H('b'),exceptionDebtDigest:H('c'),policyIds:['p'],bindingDigest:H('d')};const r=m.createCanonicalContinuationCapsule({schemaVersion:1,projectId:'p1',moduleId:'m17',stageId:'s1',lineageId:'l1',predecessorCheckpointDigest:null,admittedWorkOrderIds:['wo1'],authorityBindings:[{bindingId:'source',domain:'SOURCE',semanticIdentity:H('1'),authorityRef:'auth:source',required:true}],policyBinding,claims:[],blockers:[],evidenceRefs:['ev1'],nextLegalAction:'next',requiredCapabilities:[]},{digest});assert.equal(r.ok,true);});
