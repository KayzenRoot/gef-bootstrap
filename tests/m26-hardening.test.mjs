import test from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{
 createHedsIntent,sealReviewSourceProjection,createSourceCoverageManifest,createDeltaChangeInventory,createSemanticStateIdentity,
 createSemanticFinding,evaluateReviewGates,createHedsVerdictCapsule,verifyHedsVerdictCapsule,createHedsReplayGuard
}from'../packages/heds-delta-review/dist/public.js';
const raw=s=>createHash('sha256').update(s).digest('hex');
const sha=s=>`sha256:${raw(s)}`;
const digest={algorithm:'sha256',digest:raw};
const options={digest,maxUnits:100,maxHistory:100};
const unwrap=r=>{assert.equal(r.ok,true,r.ok?'':JSON.stringify(r.diagnostics));return r.value;};
const source=(subject,semantic)=>unwrap(sealReviewSourceProjection({subjectId:subject,sourceId:'SOURCE',ownerId:'OWNER',projectId:'PROJECT',lineageId:'LINEAGE',semanticDigest:sha(semantic),validityBindingDigest:sha(`valid-${subject}`),dependencyDigests:[]},options));
function identities(before,after){return[
 unwrap(createSemanticStateIdentity('BASE','PROJECT','LINEAGE',sha('coverage-base'),before.map(x=>x.projectionDigest),options)),
 unwrap(createSemanticStateIdentity('CANDIDATE','PROJECT','LINEAGE',sha('coverage-candidate'),after.map(x=>x.projectionDigest),options))
];}
function cleanGates(){return unwrap(evaluateReviewGates({baselineContinuity:true,sourceCoverageSufficient:true,allInvalidatedProofItemsReviewed:true,findingClosureValid:true,authorityConflict:false,truncated:false,indeterminate:false,findings:[]},options));}

test('HIC26 ignores undeclared JavaScript fields when sealing intent',()=>{
 const base={intentId:'I',projectId:'PROJECT',lineageId:'LINEAGE',baselineId:'BASE',candidateId:'CANDIDATE',reviewPolicyDigest:sha('policy'),requestedSubjectIds:['A'],purpose:'review'};
 const a=unwrap(createHedsIntent(base,options));
 const b=unwrap(createHedsIntent({...base,attackerControlled:'noise'},options));
 assert.equal(a.intentDigest,b.intentDigest);
 assert.equal('attackerControlled'in b,false);
});

test('RSP26 ignores undeclared JavaScript fields when sealing source projection',()=>{
 const base={subjectId:'A',sourceId:'SOURCE',ownerId:'OWNER',projectId:'PROJECT',lineageId:'LINEAGE',semanticDigest:sha('semantic'),validityBindingDigest:sha('valid'),dependencyDigests:[]};
 const a=unwrap(sealReviewSourceProjection(base,options));
 const b=unwrap(sealReviewSourceProjection({...base,transportNoise:{provider:'x'}},options));
 assert.equal(a.projectionDigest,b.projectionDigest);
 assert.equal('transportNoise'in b,false);
});

test('SFC26 ignores undeclared fields and keeps finding digest canonical',()=>{
 const base={findingId:'F1',subjectId:'A',severity:'LOW',state:'OPEN',ruleId:'RULE',beforeSemanticDigest:sha('before'),afterSemanticDigest:sha('after'),evidenceDigests:[],proofDigests:[],supersedesFindingDigest:null};
 const a=unwrap(createSemanticFinding(base,options));
 const b=unwrap(createSemanticFinding({...base,uiLabel:'forged'},options));
 assert.equal(a.findingDigest,b.findingDigest);
 assert.equal('uiLabel'in b,false);
});

test('source traversal enforces one-over-budget fail closed',()=>{
 const sources=[source('A','a'),source('B','b')];
 const r=createSourceCoverageManifest('PROJECT','LINEAGE',sources,sources,'COMPLETE','COMPLETE',true,{digest,maxUnits:3});
 assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'OPERATION_BUDGET_EXCEEDED');
});

test('source traversal honors cancellation before completing material review',()=>{
 const a=source('A','a');
 const r=createSourceCoverageManifest('PROJECT','LINEAGE',[a],[a],'COMPLETE','COMPLETE',true,{digest,maxUnits:100,cancellation:{isCancelled:()=>true}});
 assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'OPERATION_CANCELLED');
});

test('delta inventory traversal enforces budget',()=>{
 const a=source('A','a'),b=source('B','b');const[before,after]=identities([a,b],[a,b]);
 const r=createDeltaChangeInventory(before,after,[a,b],[a,b],true,{digest,maxUnits:2});
 assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'OPERATION_BUDGET_EXCEEDED');
});

test('verdict integrity rejects label tamper even if attacker reuses original digest',()=>{
 const gates=cleanGates();
 const capsule=unwrap(createHedsVerdictCapsule('VERDICT','PROJECT','LINEAGE',sha('base'),sha('candidate'),sha('policy'),sha('inventory'),sha('frontier'),gates,[],options));
 const forged={...capsule,verdict:'BLOCKED'};
 const receipt=unwrap(verifyHedsVerdictCapsule(forged,gates,[],options));
 assert.equal(receipt.valid,false);
 assert.equal(receipt.expectedVerdict,'APPROVED');
});

test('replay history exposes explicit bounded truncation',()=>{
 const gates=cleanGates();
 const a=unwrap(createHedsVerdictCapsule('V1','PROJECT','LINEAGE',sha('b1'),sha('c1'),sha('p'),sha('i1'),sha('f1'),gates,[],options));
 const b=unwrap(createHedsVerdictCapsule('V2','PROJECT','LINEAGE',sha('b2'),sha('c2'),sha('p'),sha('i2'),sha('f2'),gates,[],options));
 const g=unwrap(createHedsReplayGuard([a,b],{digest,maxUnits:100,maxHistory:1}));
 assert.equal(g.state,'TRUNCATED');assert.equal(g.historyTruncated,true);assert.equal(g.processedCount,1);assert.equal(g.totalCount,2);
});
