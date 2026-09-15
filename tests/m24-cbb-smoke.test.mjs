import test from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{createCompatibilityWitness,verifyTrustedCompatibilityWitness}from'../packages/evidence-engine/dist/public.js';
const d={algorithm:'sha256',digest:s=>createHash('sha256').update(s).digest('hex')},H=s=>`sha256:${createHash('sha256').update(s).digest('hex')}`;
test('compatibility authorization requires injected trust',()=>{const a=H('auth'),w=createCompatibilityWitness({witnessId:'w',owner:'EXTERNAL_CANONICAL',projectId:'p',lineageId:'l',fromBindingDigest:H('a'),toBindingDigest:H('b'),claimIds:['R:1'],authorizationDigest:a},{digest:d});assert.equal(w.ok,true);const denied=verifyTrustedCompatibilityWitness(w.value,{digest:d,trustedAuthorityRootDigests:[H('root')]});assert.equal(denied.ok,false);const allowed=verifyTrustedCompatibilityWitness(w.value,{digest:d,trustedAuthorityRootDigests:[H('root')],trustedCompatibilityAuthorizationDigests:[a]});assert.equal(allowed.ok,true);assert.equal(allowed.value,true)});
