import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createSubjectStateBinding, createAuthorityRoot, createAuthorityRootSet,
  createProducerAuthorityEntry, createSourceAuthorityIndex, createMachineEvidenceItem,
  createMachineEvidenceManifest, createEvidenceIntentCapsule,
  createDownstreamProofContextHandoff, evaluateEvidence,
} from '../packages/evidence-engine/dist/public.js';
import {
  createCanonicalClaimIdentity, createProofObligationDeclaration,
  createProofNamespaceSeal, createProofIdentityManifest,
  createProofDependencyGraph, evaluateProofGraph, createProofSnapshotCapsule,
  verifyProofSnapshotCapsule, createDownstreamProofHandoff,
} from '../packages/proof-graph/dist/public.js';
import {
  createAssuranceIntentCapsule, createAssuranceRiskProfile,
  evaluateAssurance, createAssuranceVerdictCapsule, verifyAssuranceVerdictCapsule,
} from '../packages/assurance-pipeline/dist/public.js';
import {
  createFileBackedDeltaLedgerStore, initializeDurableDeltaLedger,
  recordVerifiedDeltaAttempt, evaluateDeltaFinalClosure,
} from '../packages/heds-delta-review/dist/public.js';
import { buildTestMap, compileGateClosure } from '../packages/test-impact-engine/dist/public.js';

import {
  sha, H, digest, opts, WO, HEAD, tests, graph, unwrap, reject, attempt,
  persistAuthority, fixture, actualM28, evidence, inputs, verifier, repair,
} from './v12-wo-003-fixtures.test.mjs';

function makeNativeM24M25(observation = 'PASS') {
const digest={algorithm:'sha256',digest:s=>createHash('sha256').update(s).digest('hex')},opts={digest},H=s=>`sha256:${createHash('sha256').update(s).digest('hex')}`;
const PROJECT='gef-bootstrap',LINEAGE='lineage-25',POLICY=H('proof-policy');
function m24({observation='PASS',evidenceId='ev-1',claimId='REQ:1',stale=false,sourceSuffix='a'}={}){const subject=createSubjectStateBinding({projectId:PROJECT,lineageId:LINEAGE,subjectKind:'WORK_ORDER',subjectId:'GBS-WO-M25-001',moduleId:'M25',workOrderId:'GBS-WO-M25-001',checkpointDigest:H('checkpoint'),baseRevision:{domain:'GIT_COMMIT',algorithm:null,value:'base'},headRevision:{domain:'GIT_COMMIT',algorithm:null,value:'head'},treeRevision:{domain:'GIT_TREE',algorithm:null,value:'tree'},runtimeIdentity:{domain:'RUNTIME',algorithm:null,value:'node24'},platformIdentity:{domain:'PLATFORM',algorithm:null,value:'linux'},policyDigest:H('policy'),dependencyDigests:[H('dep')]},opts).value;const root=createAuthorityRoot({rootId:'root-25',rootClass:'MODULE_GOVERNANCE',owner:'MODULE_GOVERNANCE',projectId:PROJECT,lineageId:LINEAGE,semanticIdentity:H('root'),validityBindingDigest:H('root-valid'),sourceRef:'root:m25',allowedProducerIds:['TEST_RUNNER'],allowedEvidenceKinds:['TEST'],allowedClaimPrefixes:['REQ']},opts).value,roots=createAuthorityRootSet(PROJECT,LINEAGE,[root],opts).value,trusted={...opts,trustedAuthorityRootDigests:[root.rootDigest]},entry=createProducerAuthorityEntry({authorityId:'auth-test',producerId:'TEST_RUNNER',rootId:root.rootId,evidenceKinds:['TEST'],claimPrefixes:['REQ'],sourceIdentityDigest:H('auth-source')},roots,opts).value,index=createSourceAuthorityIndex(roots,[entry],opts).value,item=createMachineEvidenceItem({evidenceId,kind:'TEST',producerId:'TEST_RUNNER',subject,observation,sourceIdentityDigest:H(`source:${sourceSuffix}`),validityBindingDigest:H(`valid:${sourceSuffix}`),claimIds:[claimId],refs:[{refId:`artifact:${evidenceId}`,kind:'ARTIFACT_ID',contentDigest:H(`artifact:${sourceSuffix}`)}]},trusted).value,manifest=createMachineEvidenceManifest(roots,index,[item],trusted).value,intent=createEvidenceIntentCapsule({intentId:`intent:${evidenceId}`,projectId:PROJECT,lineageId:LINEAGE,subjectKind:subject.subjectKind,subjectId:subject.subjectId,claimIds:[claimId],requestedKinds:['TEST']},trusted).value,freshness={rootSetDigest:roots.rootSetDigest,authorityIndexDigest:index.indexDigest,subjectBindingDigest:subject.bindingDigest,sourceIdentityDigest:stale?H('changed'):item.sourceIdentityDigest,validityBindingDigest:item.validityBindingDigest,conflictSubjects:[]},evaluation={intent,rootSet:roots,authorityIndex:index,manifest,evidenceId,currentSubject:subject,currentFreshness:freshness,compatibilityWitness:null},handoff=createDownstreamProofContextHandoff([evaluation],'M25_PROOF',trusted).value;return{evaluation,handoff,trusted,item};}
function proof(m=m24(),{mode='ALL',threshold=null,applicable=true}={}){const claim=createCanonicalClaimIdentity({claimId:'REQ:1',ownerId:'M12_DOD',sourceIdentityDigest:H('claim'),projectId:PROJECT,lineageId:LINEAGE,proofPolicyDigest:POLICY},opts).value,obligation=createProofObligationDeclaration({obligationId:'obl-1',claimId:'REQ:1',ownerId:'M12_DOD',sourceIdentityDigest:H('obl'),projectId:PROJECT,lineageId:LINEAGE,proofPolicyDigest:POLICY,mode,threshold,dependencies:[{kind:'EVIDENCE',id:'ev-1'}],applicable,required:true,validityDependencyDigests:[H('obl-valid')]},opts).value,ns=createProofNamespaceSeal(PROJECT,LINEAGE,POLICY,opts).value,manifest=createProofIdentityManifest(ns,[claim],[obligation],opts).value,graph=createProofDependencyGraph(manifest,['REQ:1'],opts).value,computation={graph,manifest,claims:[claim],m24:{evaluations:[m.evaluation],handoff:m.handoff,options:m.trusted}};return{m,claim,obligation,ns,manifest,graph,computation};}
const evaluate=f=>evaluateProofGraph(f.computation,f.m.trusted,opts);

  const f = proof(m24({ observation }));
  const observed = unwrap(evaluateProofGraph(f.computation, f.m.trusted, opts));
  const snapshot = unwrap(createProofSnapshotCapsule({
    snapshotId: 'wo003-real-m25-snapshot', computation: f.computation,
    fingerprintDigests: [], predecessorSemanticDigest: null,
  }, f.m.trusted, opts));
  const m25Handoff = unwrap(createDownstreamProofHandoff(
    snapshot, f.computation, 'M27_ASSURANCE', f.m.trusted, opts));
  const m24Handoff = unwrap(createDownstreamProofContextHandoff(
    [f.m.evaluation], 'M27_ASSURANCE', f.m.trusted));
  return { f, observed, snapshot, m24Handoff, m25Handoff, options: opts };
}

function makeNativeM27(native) {
const digest={algorithm:'sha256',digest(input){return createHash('sha256').update(input).digest('hex')}};
const baseOptions={digest,maxUnits:10000,maxHistory:100};
const cp=(a,b)=>a<b?-1:a>b?1:0;
function stable(v){if(v===null||typeof v==='number'||typeof v==='boolean'||typeof v==='string')return JSON.stringify(v);if(Array.isArray(v))return`[${v.map(stable).join(',')}]`;const r=v;return`{${Object.keys(r).sort(cp).map(k=>`${JSON.stringify(k)}:${stable(r[k])}`).join(',')}}`;}
const seal=(kind,payload)=>`sha256:${createHash('sha256').update(`${kind}\n${stable(payload)}`).digest('hex')}`;
const sha=x=>`sha256:${createHash('sha256').update(x).digest('hex')}`;
const su=a=>[...new Set(a)].sort(cp);
const allCategories=['SOURCE_CONTEXT','EVIDENCE','PROOF','SEMANTIC_REVIEW','STATIC','UNIT_COMPONENT','INTEGRATION','E2E','PLATFORM_RUNTIME','SECURITY','RECOVERY_INTEGRITY','EXACT_CANDIDATE_SWEEP','INDEPENDENT_REVIEW','STARTUP_PURITY','BOUNDED_CANCELLABLE'];

function intent(requestedClass='MAX_ASSURANCE',candidateSemanticDigest=sha('candidate')){const r=createAssuranceIntentCapsule({intentId:'INTENT-27',projectId:'gef-bootstrap',lineageId:'lineage-25',workOrderId:'GBS-V12-WO-003',candidateId:'CANDIDATE',candidateSemanticDigest,configDigest:sha('config'),runtimeDigest:sha('runtime'),toolchainDigest:sha('toolchain'),requestedClass,purpose:'assure candidate',policyDigest:sha('policy')},baseOptions);assert.equal(r.ok,true);return r.value;}
function signal(signalId,kind,level='LOW',truthState='KNOWN'){return{signalId,kind,ownerId:'RISK_OWNER',truthState,level,semanticDigest:sha(`${signalId}:${kind}:${level}:${truthState}`)}}
function risk(i=intent(),signals=[signal('R1','CRITICAL_DATA_INTEGRITY','CRITICAL')],complete=true){const r=createAssuranceRiskProfile(i.projectId,i.lineageId,i.candidateSemanticDigest,i.policyDigest,signals,complete,baseOptions);assert.equal(r.ok,true);return r.value;}
function riskOptions(r){return{...baseOptions,trustedRiskProfileDigests:[r.profileDigest],trustedUpstreamContextBindingDigests:[],trustedValidationBindingDigests:[]};}
function evidenceHandoff(label=''){const body={owner:'M24_EVIDENCE',consumer:'M27_ASSURANCE',manifestDigest:sha(`m24-manifest${label}`),acceptedEvidenceDigests:[sha(`ev-pass${label}`)],rejectedEvidenceDigests:[],staleEvidenceDigests:[],conflictEvidenceDigests:[],unknownEvidenceDigests:[],claimMappingDigest:sha(`claims${label}`),receiptSetDigest:sha(`receipts${label}`),unresolvedClaimIds:[],mayComputeProof:false,mayDecideAssurance:false};return{...body,handoffDigest:seal('DPC24',body)}}
function proofHandoff(label=''){const body={owner:'M25_PROOF',consumer:'M27_ASSURANCE',snapshotDigest:sha(`m25-snapshot${label}`),proofStates:[{claimId:'CLAIM-1',state:'PROVEN'}],selectedSupportIds:['SUPPORT-1'],proofFingerprintDigests:[sha(`proof-fp${label}`)],invalidationVectorDigest:null,unresolvedClaimIds:[],mayPerformDeltaReview:false,mayDecideAssurance:false,mayMutateDod:false,mayCalculateProgress:false,mayPromoteCheckpoint:false};return{...body,handoffDigest:seal('DPH25',body)}}
function hedsHandoff(verdict='APPROVED',blockingFindingDigests=[],label=''){const body={owner:'M26_HEDS',consumer:'M27_ASSURANCE',verdictDigest:sha(`heds-verdict-${verdict}${label}`),semanticDigest:sha(`heds-sem-${verdict}${label}`),verdict,sourceManifestDigest:sha(`source-manifest${label}`),inventoryDigest:sha(`inventory${label}`),frontierDigest:sha(`frontier${label}`),gateSetDigest:sha(`heds-gates${label}`),impactedSubjectIds:['SUBJECT-1'],blockingFindingDigests:su(blockingFindingDigests),reviewPolicyDigest:sha(`review-policy${label}`),mayDecideAssurance:false,maySelectTests:false,mayOperateGit:false,mayPromoteCheckpoint:false};return{...body,handoffDigest:seal('DHH26',body)}}
function validationBinding(i,e,findings=[],over={}){const categoryEvidence=su(allCategories).filter(c=>!(over.omitCategories??[]).includes(c)).map(category=>({category,evidenceDigests:su(over.evidenceByCategory?.[category]??e.acceptedEvidenceDigests)}));const body={owner:'EXTERNAL_CANONICAL',projectId:over.projectId??i.projectId,lineageId:over.lineageId??i.lineageId,candidateSemanticDigest:over.candidateSemanticDigest??i.candidateSemanticDigest,configDigest:over.configDigest??i.configDigest,runtimeDigest:over.runtimeDigest??i.runtimeDigest,toolchainDigest:over.toolchainDigest??i.toolchainDigest,policyDigest:over.policyDigest??i.policyDigest,categoryEvidence,platformIds:su(over.platformIds??['ubuntu','windows','macos']),reachedLadderLevel:over.reachedLadderLevel??5,materializationState:over.materializationState??'COMPLETE',truncated:over.truncated??false,indeterminate:over.indeterminate??false,findingSetDigest:seal('ASSURANCE_FINDING_SET27',{findingDigests:su(findings.map(f=>f.findingDigest))})};return{...body,bindingDigest:seal('M27_VALIDATION_BINDING_V1',body)}}
function upstreamBinding(i,r,e,p,h,v,over={}){const body={owner:'EXTERNAL_CANONICAL',projectId:over.projectId??i.projectId,lineageId:over.lineageId??i.lineageId,candidateSemanticDigest:over.candidateSemanticDigest??i.candidateSemanticDigest,configDigest:over.configDigest??i.configDigest,runtimeDigest:over.runtimeDigest??i.runtimeDigest,toolchainDigest:over.toolchainDigest??i.toolchainDigest,policyDigest:over.policyDigest??i.policyDigest,riskProfileDigest:over.riskProfileDigest??r.profileDigest,dodDigest:over.dodDigest??sha('dod'),dodCriterionIds:su(over.dodCriterionIds??['DOD-1']),evidenceHandoffDigest:over.evidenceHandoffDigest??e.handoffDigest,proofHandoffDigest:over.proofHandoffDigest??p.handoffDigest,hedsHandoffDigest:over.hedsHandoffDigest??h.handoffDigest,validationBindingDigest:over.validationBindingDigest??v.bindingDigest};return{...body,bindingDigest:seal('M27_UPSTREAM_CONTEXT_BINDING_V1',body)}}
function trustedOptions(r,u,v){return{...baseOptions,trustedRiskProfileDigests:[r.profileDigest],trustedUpstreamContextBindingDigests:[u.bindingDigest],trustedValidationBindingDigests:[v.bindingDigest]};}
function context(over={}){const i=over.intent??intent(over.requestedClass??'MAX_ASSURANCE',over.candidateSemanticDigest??sha('candidate'));const r=over.riskProfile??risk(i,over.signals??[signal('R1','CRITICAL_DATA_INTEGRITY','CRITICAL')],over.riskComplete??true);const e=over.evidenceHandoff??evidenceHandoff(over.evidenceLabel??'');const p=over.proofHandoff??proofHandoff(over.proofLabel??'');const h=over.hedsHandoff??hedsHandoff(over.hedsVerdict??'APPROVED',over.hedsBlocking??[],over.hedsLabel??'');const findings=over.findings??[];const v=validationBinding(i,e,findings,over.validation??{});const u=upstreamBinding(i,r,e,p,h,v,over.upstream??{});const options=trustedOptions(r,u,v);const input={intent:i,riskProfile:r,currentPolicyDigest:over.currentPolicyDigest??i.policyDigest,budget:over.budget??{tokenBudget:1,searchBudget:1,fileBudget:1,testBudget:1,latencyBudgetMs:1},dodDigest:over.dodDigest??sha('dod'),dodCriterionIds:over.dodCriterionIds??['DOD-1'],evidenceHandoff:e,currentEvidenceManifestDigest:over.currentEvidenceManifestDigest??e.manifestDigest,proofHandoff:p,currentProofSnapshotDigest:over.currentProofSnapshotDigest??p.snapshotDigest,hedsHandoff:h,currentHedsVerdictDigest:over.currentHedsVerdictDigest??h.verdictDigest,findings,validationBinding:v,upstreamContextBinding:u,validation:{reachedLadderLevel:v.reachedLadderLevel,completedCategories:allCategories,acceptedEvidenceDigests:e.acceptedEvidenceDigests,exactCandidateSemanticDigest:i.candidateSemanticDigest,configDigest:i.configDigest,runtimeDigest:i.runtimeDigest,toolchainDigest:i.toolchainDigest,platformIds:v.platformIds,securitySatisfied:true,independentReviewSatisfied:true,truncated:v.truncated,indeterminate:v.indeterminate},materializationState:v.materializationState};return{input,options,intent:i,risk:r,evidence:e,proof:p,heds:h,validation:v,upstream:u};}


  const c = context({
    evidenceHandoff: native.m24Handoff,
    proofHandoff: native.m25Handoff,
  });
  const evaluation = unwrap(evaluateAssurance(c.input, c.options));
  const verdict = unwrap(createAssuranceVerdictCapsule(
    'WO003-M27-VERDICT', c.input, null, c.options));
  return { c, evaluation, verdict };
}


/** These are REAL module computations against TEST-ONLY authority fixtures.
 * They establish integration compatibility, not production identity or independence.
 */
function nativeArtifacts(native, a) {
  const base = evidence();
  return base.map(item => {
    if (item.module === 'M28') return item;
    const payload = item.module === 'M24'
      ? { evaluation: native.f.m.evaluation, trusted: native.f.m.trusted, handoff: native.m24Handoff }
      : item.module === 'M25'
      ? { computation: native.f.computation, trusted: native.f.m.trusted,
          snapshot: native.snapshot, handoff: native.m25Handoff }
      : { input: a.c.input, options: a.c.options, verdict: a.verdict };
    return { module: item.module, payload, artifactDigest: H(JSON.stringify(payload)) };
  });
}
function nativePorts(overrides = {}) {
  const fallback = verifier();
  return verifier({
    async verifyModule(artifact) {
      const p = artifact.payload;
      if (artifact.artifactDigest !== H(JSON.stringify(p))) return null;
      if (artifact.module === 'M24') {
        const evaluated = evaluateEvidence(p.evaluation, p.trusted);
        const actual = createDownstreamProofContextHandoff(
          [p.evaluation], 'M27_ASSURANCE', p.trusted);
        if (!evaluated.ok || evaluated.value.acceptanceState !== 'ACCEPTED' ||
            !actual.ok || actual.value.handoffDigest !== p.handoff.handoffDigest)
          return null;
      }
      if (artifact.module === 'M25') {
        const snapshot = verifyProofSnapshotCapsule(
          p.snapshot, p.computation, p.trusted, { digest: { algorithm: 'sha256', digest } });
        const actual = createDownstreamProofHandoff(
          p.snapshot, p.computation, 'M27_ASSURANCE', p.trusted,
          { digest: { algorithm: 'sha256', digest } });
        if (!snapshot.ok || snapshot.value !== true ||
            !actual.ok || actual.value.handoffDigest !== p.handoff.handoffDigest ||
            actual.value.proofStates.some(s => s.state !== 'PROVEN')) return null;
      }
      if (artifact.module === 'M27') {
        const result = verifyAssuranceVerdictCapsule(
          p.verdict, p.input, p.options);
        if (!result.ok || result.value.valid !== true ||
            p.verdict.verdict !== 'ASSURED') return null;
      }
      return fallback.verifyModule(artifact);
    },
    ...overrides,
  });
}

test('REAL M24 evidence flows into REAL M25 proof and REAL M27 assurance before Delta closure', async t => {
  const native = makeNativeM24M25();
  assert.equal(native.observed.results[0].state, 'PROVEN');
  assert.equal(native.m24Handoff.unresolvedClaimIds.length, 0);
  assert.equal(native.m25Handoff.proofStates[0].state, 'PROVEN');
  const assured = makeNativeM27(native);
  assert.equal(assured.evaluation.gates.verdictAdmission.state, 'PASS');
  assert.equal(assured.verdict.verdict, 'ASSURED');

  const store = await fixture(t);
  const result = unwrap(await evaluateDeltaFinalClosure(
    store, inputs({ modules: nativeArtifacts(native, assured) }), nativePorts(), digest));
  assert.equal(result.state, 'READY_FOR_INDEPENDENT_REVIEW');
  assert.equal(result.moduleProofDigests.length, 4);
  assert.equal(result.mayMerge, false);
  assert.equal(result.mayPromoteCheckpoint, false);
});

test('REAL module-verifier functions reject M24, M25 and M27 forged handoffs', async t => {
  const native = makeNativeM24M25();
  const assured = makeNativeM27(native);
  const store = await fixture(t);
  const original = nativeArtifacts(native, assured);
  for (const target of ['M24', 'M25', 'M27']) {
    const broken = original.map(item => {
      if (item.module !== target) return item;
      const payload = target === 'M24'
        ? { ...item.payload, handoff: {
            ...item.payload.handoff, handoffDigest: H('old-m24') } }
        : target === 'M25'
        ? { ...item.payload, handoff: {
            ...item.payload.handoff, handoffDigest: H('old-m25') } }
        : { ...item.payload, verdict: {
            ...item.payload.verdict, verdictDigest: H('old-m27') } };
      return { ...item, payload, artifactDigest: H(JSON.stringify(payload)) };
    });
    reject(await evaluateDeltaFinalClosure(
      store, inputs({ modules: broken }), nativePorts(), digest),
      'DELTA_FINAL_MODULE_PROOF_NOT_VERIFIED');
  }
});

test('REAL M24 FAIL observation cannot be promoted to an assured downstream chain', () => {
  const failed = makeNativeM24M25('FAIL');
  assert.equal(failed.observed.results[0].state, 'UNPROVEN');
  assert.notEqual(failed.m25Handoff.proofStates[0].state, 'PROVEN');
});
