import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('resume-engine import is startup-pure',async()=>{const cwd=process.cwd();const before={...process.env};await import('../packages/resume-engine/dist/public.js');assert.equal(process.cwd(),cwd);for(const [k,v] of Object.entries(before))assert.equal(process.env[k],v);});

test('ordinary resume API use needs no filesystem network or process execution',async()=>{const m=await import('../packages/resume-engine/dist/public.js');const digest={algorithm:'sha256',digest:v=>createHash('sha256').update(v).digest('hex')};const r=m.createResumeIntentCapsule({resumeId:'resume-1',projectId:'project-1',expectedLineageId:'lineage-1',expectedCheckpointDigest:`sha256:${'1'.repeat(64)}`,requestedNextAction:null},{digest});assert.equal(r.ok,true);assert.equal(r.value.projectId,'project-1');});
