import test from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{createCanonicalClaimIdentity,createProofObligationDeclaration,createProofNamespaceSeal,createProofIdentityManifest,createProofDependencyGraph,evaluateProofGraph}from'../packages/proof-graph/dist/public.js';
const digest={algorithm:'sha256',digest:s=>createHash('sha256').update(s).digest('hex')},opts={digest},H=s=>`sha256:${createHash('sha256').update(s).digest('hex')}`;
const base={projectId:'gef-bootstrap',lineageId:'lineage-25',proofPolicyDigest:H('policy')};
const obligation=id=>createProofObligationDeclaration({obligationId:id,claimId:'REQ:1',ownerId:'M12',sourceIdentityDigest:H(id),...base,mode:'ALL',threshold:null,dependencies:[{kind:'EVIDENCE',id:'ev-1'}],applicable:true,required:true,validityDependencyDigests:[]},opts).value;
function identity(){const claim=createCanonicalClaimIdentity({claimId:'REQ:1',ownerId:'M12',sourceIdentityDigest:H('claim'),...base},opts).value,o1=obligation('o1'),ns=createProofNamespaceSeal(base.projectId,base.lineageId,base.proofPolicyDigest,opts).value;return{claim,o1,ns};}
test('divergent obligations for one claim have no implicit winner',()=>{const{claim,o1,ns}=identity(),o2=obligation('o2'),manifest=createProofIdentityManifest(ns,[claim],[o1,o2],opts).value,r=evaluateProofGraph({graph:{},manifest,claims:[claim],m24:{}},{},opts);assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'M25_OBLIGATION_AMBIGUOUS');});
test('proof graph derived fields cannot be tampered while retaining manifest identity',()=>{const{claim,o1,ns}=identity(),manifest=createProofIdentityManifest(ns,[claim],[o1],opts).value,graph=createProofDependencyGraph(manifest,['REQ:1'],opts).value,r=evaluateProofGraph({graph:{...graph,graphDigest:H('forged')},manifest,claims:[claim],m24:{}},{},opts);assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'M25_GRAPH_TAMPERED');});
