import test from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{createCompatibilityWitness,verifyTrustedCompatibilityWitness}from'../packages/evidence-engine/dist/s03-binding.js';
const d={algorithm:'sha256',digest:s=>createHash('sha256').update(s).digest('hex')},H=s=>`sha256:${createHash('sha256').update(s).digest('hex')}`;
test('CBB trusted translation boundary',()=>{const a=H('auth'),w=createCompatibilityWitness({witnessId:'w',owner:'EXTERNAL_CANONICAL',projectId:'p',lineageId:'l',fromBindingDigest:H('a'),toBindingDigest:H('b'),claimIds:['R:1'],authorizationDigest:a},{digest:d});assert.equal(w.ok,true);assert.equal(verifyTrustedCompatibilityWitness(w.value,{digest:d,trustedAuthorityRootDigests:[H('root')]}).ok,false);const r=verifyTrustedCompatibilityWitness(w.value,{digest:d,trustedAuthorityRootDigests:[H('root')],trustedCompatibilityAuthorizationDigests:[a]});assert.equal(r.ok,true);assert.equal(r.value,true)});
