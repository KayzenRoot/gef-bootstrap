import test from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{createDenominatorIntegrityManifest,createEvidenceAcceptanceBinding,verifyEvidenceAcceptanceBinding,createWeightedCreditUnit,evaluateCreditEligibility}from'../packages/progress-engine/dist/public.js';
const digest={algorithm:'sha256',digest:s=>createHash('sha256').update(s).digest('hex')},opts={digest},H=s=>`sha256:${createHash('sha256').update(s).digest('hex')}`;
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v,seal=v=>H(JSON.stringify(canon(v)));
function manifest(){return createDenominatorIntegrityManifest({projectId:'p',lineageDigest:H('l'),epochId:'e',scopeDigest:H('s'),dodDigest:H('d'),policyDigest:H('policy'),units:[{unitId:'u',moduleId:'M',areaId:'A',phaseId:'P',maxWeight:5}]},opts).value;}

test('unknown evidence authority cannot mint accepted credit',()=>{const r=createEvidenceAcceptanceBinding({unitId:'u',owner:'FAKE_AUTHORITY',state:'ACCEPTED',sourceIdentityDigest:H('src'),validityBindingDigest:H('valid')},opts);assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'EVIDENCE_OWNER_INVALID');});

test('resealed binding from unknown authority is rejected by verify, credit creation and eligibility',()=>{const m=manifest(),body={unitId:'u',owner:'FAKE_AUTHORITY',state:'ACCEPTED',sourceIdentityDigest:H('src'),validityBindingDigest:H('valid')},forged={...body,bindingDigest:seal(body)};assert.equal(verifyEvidenceAcceptanceBinding(forged,opts).value,false);const credit=createWeightedCreditUnit(m.units[0],forged,opts);assert.equal(credit.ok,false);assert.equal(credit.diagnostics[0].code,'EVIDENCE_OWNER_INVALID');const eligibility=evaluateCreditEligibility(m,[forged],opts);assert.equal(eligibility.ok,false);assert.equal(eligibility.diagnostics[0].code,'EVIDENCE_OWNER_INVALID');});

test('frozen evidence and proof owners remain accepted while M21 self-authority stays forbidden',()=>{for(const owner of['M24_EVIDENCE','M25_PROOF','M27_ASSURANCE','EXTERNAL_CANONICAL'])assert.equal(createEvidenceAcceptanceBinding({unitId:'u',owner,state:'ACCEPTED',sourceIdentityDigest:H(`src:${owner}`),validityBindingDigest:H(`valid:${owner}`)},opts).ok,true);const self=createEvidenceAcceptanceBinding({unitId:'u',owner:'M21_PROGRESS',state:'ACCEPTED',sourceIdentityDigest:H('src:self'),validityBindingDigest:H('valid:self')},opts);assert.equal(self.ok,false);assert.equal(self.diagnostics[0].code,'SELF_AUTHORITY_FORBIDDEN');});
