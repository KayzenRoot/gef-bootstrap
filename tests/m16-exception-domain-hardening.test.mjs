import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createPolicyAuthorityCapsule, createExceptionWarrant, evaluatePolicies } from '../packages/policy-guardrail-engine/dist/public.js';

const digest={algorithm:'sha256',digest:value=>createHash('sha256').update(value).digest('hex')};
const opts={digest};

test('exception cannot authorize a multi-domain mutation unless every mutation domain is covered',()=>{
  const policy=createPolicyAuthorityCapsule({
    policyId:'p-multi',version:'1',owner:'security',authorityRef:'auth:p-multi',precedenceDomain:'SECURITY',
    domains:['SOURCE','SECURITY'],appliesToOperations:['write'],appliesToNodeIds:['n1'],requiredFacts:[],denyOperations:[],
    obligations:[{obligationId:'ob-review',domain:'SOURCE',action:'review',effect:'REQUIRE',dependsOn:[]}],
    evidenceRefs:['security-policy'],reviewTrigger:'on-change',expiryRef:'checkpoint:next',status:'ACTIVE',
  },opts).value;
  const partial=createExceptionWarrant({
    warrantId:'w-partial',approvalRef:'approval:partial',policyDigestBindings:[policy.semanticDigest],policyIds:[policy.policyId],
    obligationIds:['ob-review'],domains:['SOURCE'],nodeIds:['n1'],operations:['write'],permittedEffects:['WAIVE_OBLIGATION'],
    compensatingControls:['manual-review'],reviewTrigger:'next-checkpoint',expiryRef:'checkpoint:next',status:'ACTIVE',
  },opts).value;
  const result=evaluatePolicies({
    policies:[policy],operation:{nodeId:'n1',operation:'write',domains:['SOURCE','SECURITY']},
    mandatoryDomains:['SOURCE','SECURITY'],facts:{},exceptionWarrants:[partial],
  },opts);
  assert.equal(result.ok,true);
  assert.equal(result.value.decision,'ALLOW_WITH_OBLIGATIONS');
  assert.deepEqual(result.value.exceptionWarrantIds,[]);
  assert.deepEqual(result.value.exceptionWarrantDigests,[]);
});
