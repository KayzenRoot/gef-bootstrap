import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  buildSourcePack,
  evaluateApplicability,
  evaluateRequirements,
  resolveAuthority,
  resolveExactTemplate,
  computeDriftShockwave,
  evaluateIntegrity
} from '../packages/source-pack/dist/public.js';

const digest = { algorithm: 'sha256', digest(input) { return createHash('sha256').update(input).digest('hex'); } };
const opts = { digest };

const baseEntries = [
  { id:'constitution', kind:'DOCUMENT', domain:'DECISION', locator:'.engineering/DECISIONS.md', fingerprint:'fp-c', semanticKey:'DECISIONS', canonicality:'CANONICAL', applicability:'ACTIVE' },
  { id:'scope', kind:'DOCUMENT', domain:'SCOPE', locator:'.engineering/SCOPE.md', fingerprint:'fp-s', semanticKey:'SCOPE', canonicality:'CANONICAL', applicability:'ACTIVE', dependencies:['constitution'] },
  { id:'template-a', kind:'TEMPLATE', domain:'PLANNING', locator:'templates/a', fingerprint:'fp-t', semanticKey:'TEMPLATE_A', canonicality:'CANONICAL', applicability:'ACTIVE', template:{templateId:'a',version:'1.0.0',digest:'sha256:abc'} }
];

test('build is deterministic and order invariant', () => {
  const a = buildSourcePack({projectId:'proj-1',entries:baseEntries,requirements:[{classId:'SCOPE',state:'REQUIRED'}],constitutionEntryIds:['constitution']}, opts);
  const b = buildSourcePack({projectId:'proj-1',entries:[...baseEntries].reverse(),requirements:[{classId:'SCOPE',state:'REQUIRED'}],constitutionEntryIds:['constitution']}, opts);
  assert.equal(a.ok,true); assert.equal(b.ok,true);
  assert.equal(a.value.semanticIdentity,b.value.semanticIdentity);
  assert.equal(a.value.integrityEpoch,b.value.integrityEpoch);
  assert.equal(a.value.constitutionFingerprint,b.value.constitutionFingerprint);
  assert.ok(Object.isFrozen(a.value));
});

test('duplicate ids and cycles fail closed', () => {
  const dup = buildSourcePack({projectId:'p',entries:[baseEntries[0],baseEntries[0]]},opts);
  assert.equal(dup.ok,false); assert.equal(dup.diagnostics[0].code,'DUPLICATE_ENTRY_ID');
  const cyc = buildSourcePack({projectId:'p',entries:[
    {id:'a',kind:'FACT',domain:'SCOPE',locator:'a',fingerprint:'1',dependencies:['b']},
    {id:'b',kind:'FACT',domain:'SCOPE',locator:'b',fingerprint:'2',dependencies:['a']}
  ]},opts);
  assert.equal(cyc.ok,false); assert.equal(cyc.diagnostics[0].code,'TOPOLOGY_CYCLE');
});

test('budgets and cancellation are enforced', () => {
  const limited = buildSourcePack({projectId:'p',entries:baseEntries},{digest,maxEntries:1});
  assert.equal(limited.ok,false); assert.equal(limited.diagnostics[0].code,'ENTRY_BUDGET_EXCEEDED');
  const cancelled = buildSourcePack({projectId:'p',entries:[]},{digest,cancellation:{isCancelled(){return true;}}});
  assert.equal(cancelled.ok,false); assert.equal(cancelled.diagnostics[0].code,'CANCELLED');
});

test('digest capability is mandatory and SHA-256 shaped', () => {
  const bad = buildSourcePack({projectId:'p',entries:[]},{digest:{algorithm:'sha256',digest(){return 'weak';}}});
  assert.equal(bad.ok,false); assert.equal(bad.diagnostics[0].code,'DIGEST_RESULT_INVALID');
});

test('applicability returns ACTIVE INACTIVE UNKNOWN and witness facts', () => {
  const p = {op:'ALL',items:[{op:'FACT_EQ',fact:'mode',value:'NEW'},{op:'FACT_EQ',fact:'secure',value:true}]};
  const active = evaluateApplicability(p,{mode:'NEW',secure:true});
  assert.equal(active.state,'ACTIVE'); assert.deepEqual(active.facts.map(x=>x.key),['mode','secure']);
  assert.equal(evaluateApplicability(p,{mode:'OLD',secure:true}).state,'INACTIVE');
  assert.equal(evaluateApplicability(p,{mode:'NEW'}).state,'UNKNOWN');
});

test('required classes fail explicit rather than filename guessing', () => {
  const r = evaluateRequirements([{classId:'ARCH',state:'REQUIRED'},{classId:'UI',state:'NOT_APPLICABLE',witness:'profile:none'}],baseEntries);
  assert.equal(r[0].state,'MISSING_REQUIRED');
  assert.equal(r[1].state,'RESOLVED_NOT_APPLICABLE');
  assert.equal(r[1].witness,'profile:none');
});

test('authority is domain specific and explicit supersession wins', () => {
  const entries = [
    {id:'old',kind:'FACT',domain:'ARCHITECTURE',locator:'old',fingerprint:'1',semanticKey:'x',canonicality:'CANONICAL',applicability:'ACTIVE'},
    {id:'new',kind:'FACT',domain:'ARCHITECTURE',locator:'new',fingerprint:'2',semanticKey:'x',canonicality:'CANONICAL',applicability:'ACTIVE',supersedes:['old']},
    {id:'repo',kind:'FACT',domain:'REPOSITORY_STATE',locator:'repo',fingerprint:'3',semanticKey:'x',canonicality:'DESCRIPTIVE',applicability:'ACTIVE'}
  ];
  const r = resolveAuthority(entries,'x','ARCHITECTURE');
  assert.equal(r.ok,true); assert.equal(r.value.selected,'new');
  assert.deepEqual(r.value.governingRules,['D-0021','D-0055']);
});

test('authority conflicts never use newest/path order', () => {
  const r = resolveAuthority([
    {id:'a',kind:'FACT',domain:'SCOPE',locator:'z',fingerprint:'1',semanticKey:'x',canonicality:'CANONICAL',applicability:'ACTIVE'},
    {id:'b',kind:'FACT',domain:'SCOPE',locator:'a',fingerprint:'2',semanticKey:'x',canonicality:'CANONICAL',applicability:'ACTIVE'}
  ],'x','SCOPE');
  assert.equal(r.ok,false); assert.equal(r.diagnostics[0].code,'AUTHORITY_CONFLICT');
});

test('exact template resolution refuses all fallback modes', () => {
  assert.equal(resolveExactTemplate(baseEntries,{templateId:'a',version:'1.0.0',digest:'sha256:abc'}).ok,true);
  assert.equal(resolveExactTemplate(baseEntries,{templateId:'missing',version:'1.0.0'}).diagnostics[0].code,'TEMPLATE_NOT_FOUND');
  assert.equal(resolveExactTemplate(baseEntries,{templateId:'a',version:'2.0.0'}).diagnostics[0].code,'TEMPLATE_VERSION_MISMATCH');
  assert.equal(resolveExactTemplate(baseEntries,{templateId:'a',version:'1.0.0',digest:'sha256:no'}).diagnostics[0].code,'TEMPLATE_DIGEST_MISMATCH');
});

test('drift shockwave invalidates only dependency closure', () => {
  const entries = [
    {id:'a',kind:'FACT',domain:'SCOPE',locator:'a',fingerprint:'1'},
    {id:'b',kind:'FACT',domain:'SCOPE',locator:'b',fingerprint:'2',dependencies:['a']},
    {id:'c',kind:'FACT',domain:'SCOPE',locator:'c',fingerprint:'3',dependencies:['b']},
    {id:'d',kind:'FACT',domain:'SCOPE',locator:'d',fingerprint:'4'}
  ];
  assert.deepEqual(computeDriftShockwave(entries,['a']),['a','b','c']);
});

test('integrity layers distinguish stale project mismatch and unresolved requirements', () => {
  const made = buildSourcePack({projectId:'p',entries:baseEntries,requirements:[{classId:'MISSING',state:'REQUIRED'}]},opts);
  assert.equal(made.ok,true);
  assert.equal(evaluateIntegrity(made.value,'p',{}).overall,'INCOMPLETE');
  assert.equal(evaluateIntegrity(made.value,'p',{scope:'changed'}).overall,'STALE');
  assert.equal(evaluateIntegrity(made.value,'other',{}).overall,'PROJECT_MISMATCH');
});
