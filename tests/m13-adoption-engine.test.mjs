import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createAdoptionIntentCapsule, validateAdoptionTransition, buildGovernanceMaturityVector,
  validateAdoptionSafetyEnvelope, assessNewProject, buildBootstrapSeedGraph,
  evaluateMinimalGovernanceKernel, reconcileBrownfieldTruth, validateLegacyCompatibilityMembrane,
  validateCompatibilityBridge, validateDriftResolution, planAdoptionSlice, createLegacyDebtRecord,
  validateNormalizationTransition, buildNormalizationFrontier, probeSemanticEquivalence,
  enforceNormalizationBudget, classifyReversibility, evaluateCapabilityUnlock,
  buildAdoptionProofSpine, computeProofInvalidation, buildGovernanceDeltaReceipt,
  buildAdoptionReceipt, evaluateReceiptValidity, detectAdoptionRegression,
  projectBootstrapProvenance
} from '../packages/adoption-engine/dist/public.js';

const digest={algorithm:'sha256',digest(input){return createHash('sha256').update(input).digest('hex')}};
const opts={digest};
const baseIntent={projectId:'proj-1',mode:'BROWNFIELD_INCREMENTAL',sourcePackIdentity:'sha256:source',profileIdentity:'generic',profileDigest:'sha256:profile',policyVersion:'m13-v1',requestedDomains:['SCOPE','DECISION'],excludedDomains:['UI'],riskClass:'ELEVATED'};

test('intent capsule is deterministic and set-order invariant',()=>{
  const a=createAdoptionIntentCapsule(baseIntent,opts);
  const b=createAdoptionIntentCapsule({...baseIntent,requestedDomains:['DECISION','SCOPE']},opts);
  assert.equal(a.ok,true);assert.equal(b.ok,true);assert.equal(a.value.semanticIdentity,b.value.semanticIdentity);assert.ok(Object.isFrozen(a.value));
});

test('governed migration requires explicit decision and overlapping domains fail',()=>{
  const migration=createAdoptionIntentCapsule({...baseIntent,mode:'BROWNFIELD_GOVERNED_MIGRATION'},opts);
  assert.equal(migration.ok,false);assert.equal(migration.diagnostics[0].code,'REQUIRED_DECISION_MISSING');
  const overlap=createAdoptionIntentCapsule({...baseIntent,excludedDomains:['SCOPE']},opts);
  assert.equal(overlap.ok,false);assert.equal(overlap.diagnostics[0].code,'ADOPTION_DOMAIN_CONFLICT');
});

test('adoption transitions fail closed',()=>{
  assert.equal(validateAdoptionTransition('UNASSESSED','OBSERVED').ok,true);
  const invalid=validateAdoptionTransition('UNASSESSED','GOVERNED');assert.equal(invalid.ok,false);assert.equal(invalid.diagnostics[0].code,'UNSUPPORTED_GOVERNANCE_TRANSITION');
});

test('maturity vector is deterministic and rejects duplicate domains',()=>{
  const a=buildGovernanceMaturityVector('proj-1',[{domain:'SCOPE',maturity:'GOVERNED_CANONICAL'},{domain:'DECISION',maturity:'MAPPED'}],opts);
  const b=buildGovernanceMaturityVector('proj-1',[{domain:'DECISION',maturity:'MAPPED'},{domain:'SCOPE',maturity:'GOVERNED_CANONICAL'}],opts);
  assert.equal(a.ok,true);assert.equal(a.value.semanticIdentity,b.value.semanticIdentity);
  assert.equal(buildGovernanceMaturityVector('proj-1',[{domain:'SCOPE',maturity:'OBSERVED'},{domain:'SCOPE',maturity:'MAPPED'}],opts).ok,false);
});

test('safety envelope detects contradictory mutation surfaces',()=>{
  const bad=validateAdoptionSafetyEnvelope({allowedMutationSurfaces:['docs'],forbiddenSurfaces:['docs'],reversibleOperations:[],preconditions:[],requiredChecks:[],abortConditions:[],rollbackOwner:'M05',maxUnresolvedSeverity:'MEDIUM'});
  assert.equal(bad.ok,false);assert.equal(bad.diagnostics[0].code,'MUTATION_SURFACE_CONFLICT');
});

test('new project assessment never infers newness from sparsity alone',()=>{
  assert.equal(assessNewProject({explicitNewProjectIntent:true,conflictingCanonicalSystem:false,retainedHistory:false,existingReleaseEvidence:false,remoteProjectEvidence:false}),'TRUE_NEW');
  assert.equal(assessNewProject({explicitNewProjectIntent:false,conflictingCanonicalSystem:false,retainedHistory:false,existingReleaseEvidence:false,remoteProjectEvidence:false}),'NEWNESS_UNCERTAIN');
  assert.equal(assessNewProject({explicitNewProjectIntent:true,conflictingCanonicalSystem:false,retainedHistory:true,existingReleaseEvidence:false,remoteProjectEvidence:false}),'NEWNESS_UNCERTAIN');
});

test('bootstrap seed graph is deterministic cycle-safe bounded and cancellable',()=>{
  const nodes=[{id:'scope',semanticClass:'SCOPE',creationMode:'CREATE_FROM_EXPLICIT_INPUT',dependencies:['constitution']},{id:'constitution',semanticClass:'CONSTITUTION_GOVERNANCE',creationMode:'CREATE_FROM_EXPLICIT_INPUT'}];
  const a=buildBootstrapSeedGraph(nodes,opts);const b=buildBootstrapSeedGraph([...nodes].reverse(),opts);
  assert.equal(a.ok,true);assert.deepEqual(a.value.order,b.value.order);assert.deepEqual(a.value.order,['constitution','scope']);
  const cyc=buildBootstrapSeedGraph([{id:'a',semanticClass:'A',creationMode:'CREATE_FROM_EXPLICIT_INPUT',dependencies:['b']},{id:'b',semanticClass:'B',creationMode:'CREATE_FROM_EXPLICIT_INPUT',dependencies:['a']}],opts);assert.equal(cyc.ok,false);assert.equal(cyc.diagnostics[0].code,'SEED_GRAPH_CYCLE');
  assert.equal(buildBootstrapSeedGraph(nodes,{digest,maxNodes:1}).diagnostics[0].code,'NODE_BUDGET_EXCEEDED');
  assert.equal(buildBootstrapSeedGraph(nodes,{digest,cancellation:{isCancelled(){return true}}}).diagnostics[0].code,'CANCELLED');
});

test('minimal governance kernel exposes incompleteness instead of inventing decisions',()=>{
  const partial=evaluateMinimalGovernanceKernel(['PROJECT_IDENTITY','CONSTITUTION_GOVERNANCE']);assert.equal(partial.complete,false);assert.ok(partial.missing.includes('DECISIONS'));
  const full=evaluateMinimalGovernanceKernel(['PROJECT_IDENTITY','CONSTITUTION_GOVERNANCE','CURRENT_CHECKPOINT','DECISIONS','SCOPE','COMPLETION_DEFINITION','EXECUTION_GOVERNANCE']);assert.equal(full.complete,true);
});

test('brownfield reconciler preserves observed and normative truth without newest-wins',()=>{
  const pair=reconcileBrownfieldTruth({domain:'ARCHITECTURE',observed:{runtime:'legacy'},normative:{runtime:'target'},driftClass:'ARCHITECTURAL_DRIFT',evidenceRefs:['code','architecture']});
  assert.equal(pair.driftClass,'ARCHITECTURAL_DRIFT');assert.deepEqual(pair.observed,{runtime:'legacy'});assert.deepEqual(pair.normative,{runtime:'target'});
  assert.equal(reconcileBrownfieldTruth({domain:'SCOPE',observed:'x',evidenceRefs:[]}).driftClass,'INTENT_UNKNOWN');
});

test('lossy legacy mappings and bridges require explicit approval',()=>{
  const m={id:'m1',legacySourceIdentity:'legacy',semanticClass:'SCOPE',mappingType:'ALIAS',lossy:true,sourceFingerprint:'fp',owner:'M13'};
  assert.equal(validateLegacyCompatibilityMembrane(m).diagnostics[0].code,'LOSSY_MAPPING_UNAPPROVED');
  assert.equal(validateLegacyCompatibilityMembrane({...m,approvalRef:'D-1'}).ok,true);
  const bridge={id:'b1',sourceIdentity:'legacy',targetSemanticClass:'SCOPE',mappingVersion:'1',direction:'READ_ONLY',lossy:true,conflictBehavior:'FAIL',invalidationFingerprint:'fp',owner:'M13'};
  assert.equal(validateCompatibilityBridge(bridge).ok,false);assert.equal(validateCompatibilityBridge({...bridge,approvalRef:'D-1'}).ok,true);
});

test('intent-changing drift resolution requires decision authority',()=>{
  assert.equal(validateDriftResolution('DEFER_QUARANTINED').ok,true);
  const bad=validateDriftResolution('ACCEPT_OBSERVED_AS_NORMATIVE');assert.equal(bad.ok,false);assert.equal(bad.diagnostics[0].code,'DRIFT_RESOLUTION_DECISION_REQUIRED');
});

test('adoption slice computes only dependency closure and excludes optional cleanup',()=>{
  const r=planAdoptionSlice({targets:['EXECUTION'],dependencies:[{domain:'EXECUTION',dependsOn:['SCOPE','DECISION']},{domain:'SCOPE',dependsOn:['IDENTITY']}],governedDomains:['IDENTITY'],optionalCleanup:['rename-old-folder']},opts);
  assert.equal(r.ok,true);assert.deepEqual(r.value.requiredDomains,['DECISION','EXECUTION','SCOPE']);assert.deepEqual(r.value.optionalCleanup,['rename-old-folder']);
});

test('legacy debt remains explicit and promotion blocker is preserved',()=>{
  const r=createLegacyDebtRecord({id:'debt1',domain:'CI',sourceBinding:'legacy-ci',driftClass:'GOVERNANCE_DRIFT',severity:'HIGH',reason:'outside current slice',affectedCapabilities:['release'],promotionBlocker:true});
  assert.equal(r.ok,true);assert.equal(r.value.promotionBlocker,true);
});

test('normalization frontier and equivalence fail closed',()=>{
  assert.equal(validateNormalizationTransition('LEGACY_UNMAPPED','LEGACY_MAPPED').ok,true);
  assert.equal(validateNormalizationTransition('LEGACY_UNMAPPED','GEF_CANONICAL').ok,false);
  const frontier=buildNormalizationFrontier('proj-1',[{domain:'SCOPE',state:'DUAL_BOUND'},{domain:'DECISION',state:'GEF_CANONICAL'}]);assert.equal(frontier.ok,true);
  assert.equal(probeSemanticEquivalence({a:1},{a:1},['a']),'EQUIVALENT');
  assert.equal(probeSemanticEquivalence({a:1},{a:2},['a']),'NON_EQUIVALENT');
  assert.equal(probeSemanticEquivalence({a:1},{},['a']),'INDETERMINATE');
  assert.equal(probeSemanticEquivalence({a:1},{a:1},['a'],false),'UNSUPPORTED_MAPPING');
});

test('normalization budget and reversibility classification are explicit',()=>{
  assert.equal(enforceNormalizationBudget({domains:2,mappings:2,migrations:0,dependencyExpansion:1},{maxDomains:1,maxMappings:3,maxMigrations:1,maxDependencyExpansion:2}).diagnostics[0].code,'NORMALIZATION_BUDGET_EXCEEDED');
  assert.equal(classifyReversibility('UNKNOWN'),'IRREVERSIBILITY_UNKNOWN');
});

test('capability unlock is domain-scoped and partial governance stays partial',()=>{
  const vector=buildGovernanceMaturityVector('proj-1',[{domain:'SCOPE',maturity:'GOVERNED_CANONICAL'},{domain:'DECISION',maturity:'MAPPED'}],opts).value;
  const unlocked=evaluateCapabilityUnlock({capability:'context',domains:[{domain:'SCOPE',minimum:'MAPPED'}]},vector);assert.equal(unlocked.unlocked,true);
  const denied=evaluateCapabilityUnlock({capability:'execution',domains:[{domain:'DECISION',minimum:'GOVERNED_CANONICAL'}]},vector);assert.equal(denied.unlocked,false);
});

test('proof spine is deterministic and invalidation is selective with conservative widening',()=>{
  const nodes=[{id:'root',payloadDigest:'sha256:a'},{id:'child',payloadDigest:'sha256:b',dependencies:['root']},{id:'other',payloadDigest:'sha256:c'}];
  const spine=buildAdoptionProofSpine(nodes,opts);assert.equal(spine.ok,true);
  assert.deepEqual(computeProofInvalidation(spine.value,['root']),['child','root']);
  assert.deepEqual(computeProofInvalidation(spine.value,['root'],true),['child','other','root']);
});

test('governance delta receipt and provenance are deterministic',()=>{
  const input={projectId:'proj-1',beforeIdentity:'a',afterIdentity:'b',frontierMoved:['SCOPE'],bridgesAdded:['x'],bridgesRetired:[],driftChanges:[],quarantineChanges:[],capabilitiesUnlocked:['context'],capabilitiesInvalidated:[]};
  const a=buildGovernanceDeltaReceipt(input,opts);const b=buildGovernanceDeltaReceipt({...input,frontierMoved:[...input.frontierMoved].reverse()},opts);assert.equal(a.value.semanticIdentity,b.value.semanticIdentity);
  const p=projectBootstrapProvenance({artifactId:'scope',sourceRefs:['b','a'],semanticOwner:'M13',payloadIdentity:'sha256:x',validationState:'VALID'},opts);assert.equal(p.ok,true);assert.match(p.value.generatedDigest,/^sha256:/);
});

function receiptInput(capabilityUnlocks=[{capability:'context',unlocked:true,reasons:[]}]){return {projectId:'proj-1',policyVersion:'m13-v1',mode:'BROWNFIELD_INCREMENTAL',intentCapsuleIdentity:'sha256:intent',sourcePackIdentity:'sha256:source',profileIdentity:'generic',profileDigest:'sha256:profile',maturityVectorIdentity:'sha256:gmv',normalizationFrontier:{projectId:'proj-1',domains:[{domain:'SCOPE',state:'GEF_CANONICAL'}]},bridgeIds:[],membraneIds:[],driftSummary:[],quarantineIds:[],completedIncrementIds:['inc1'],blockers:[],safetyEnvelopeIdentity:'sha256:ase',capabilityUnlocks};}

test('adoption receipt is deterministic and partial is never full',()=>{
  const proof=[{id:'intent',payloadDigest:'sha256:intent'}];
  const valid=buildAdoptionReceipt(receiptInput(),proof,opts);assert.equal(valid.ok,true);assert.equal(valid.value.validity,'VALID');
  const partial=buildAdoptionReceipt(receiptInput([{capability:'context',unlocked:false,reasons:['SCOPE:MISSING']}]),proof,opts);assert.equal(partial.value.validity,'PARTIAL');
  assert.equal(evaluateReceiptValidity(valid.value,{projectId:'other',sourcePackIdentity:'sha256:source',policyVersion:'m13-v1'}),'PROJECT_MISMATCH');
  assert.equal(evaluateReceiptValidity(valid.value,{projectId:'proj-1',sourcePackIdentity:'changed',policyVersion:'m13-v1'}),'SOURCE_PACK_MISMATCH');
});

test('receipt rejects secret-like payload and regression sentinel detects capability/frontier regression',()=>{
  const proof=[{id:'intent',payloadDigest:'sha256:intent'}];
  const previous=buildAdoptionReceipt(receiptInput(),proof,opts).value;
  const current=buildAdoptionReceipt({...receiptInput([{capability:'context',unlocked:false,reasons:['blocked']}]),normalizationFrontier:{projectId:'proj-1',domains:[{domain:'SCOPE',state:'DUAL_BOUND'}]}},proof,opts).value;
  const regressions=detectAdoptionRegression(previous,current);assert.ok(regressions.some(r=>r.code==='CANONICAL_DOMAIN_REGRESSION'));assert.ok(regressions.some(r=>r.code==='CAPABILITY_REGRESSION'));
  const secret=buildAdoptionReceipt({...receiptInput(),capabilityUnlocks:[{capability:'x',unlocked:true,reasons:[]}],password:'hidden'},proof,opts);assert.equal(secret.ok,false);assert.equal(secret.diagnostics[0].code,'RECEIPT_SECRET_MATERIAL_FORBIDDEN');
});
