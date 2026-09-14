import type { AdoptionReceipt, AdoptionReceiptInput, AdoptionRegression, CapabilityRequirement, CapabilityUnlock, GovernanceDeltaReceipt, GovernanceMaturityVector, OperationOptions, ProofNode, ProofNodeInput, ReceiptCurrentBindings, ReceiptValidity, Result } from './types.js';
import { compareCodePoint, deepFreeze, fail, hasSecretLikeKey, sha } from './utils.js';
import { maturitySatisfies } from './policy.js';

export function evaluateCapabilityUnlock(requirement:CapabilityRequirement,vector:GovernanceMaturityVector,blockedDomains:readonly string[]=[]):CapabilityUnlock {
  const blocked=new Set(blockedDomains); const states=new Map(vector.domains.map(d=>[d.domain,d.maturity] as const)); const reasons:string[]=[];
  for(const need of requirement.domains){
    if(blocked.has(need.domain)){reasons.push(`${need.domain}:BLOCKED`);continue;}
    const actual=states.get(need.domain);
    if(!actual)reasons.push(`${need.domain}:MISSING`);
    else if(!maturitySatisfies(actual,need.minimum))reasons.push(`${need.domain}:${actual}<${need.minimum}`);
  }
  return deepFreeze({capability:requirement.capability,unlocked:reasons.length===0,reasons:reasons.sort(compareCodePoint)});
}

export function buildAdoptionProofSpine(nodes:readonly ProofNodeInput[],options:OperationOptions):Result<readonly ProofNode[]> {
  const byId=new Map<string,ProofNodeInput>();
  for(const node of nodes){if(byId.has(node.id))return fail('DUPLICATE_PROOF_NODE','Duplicate proof node',node.id);byId.set(node.id,node);}
  for(const node of nodes)for(const dep of node.dependencies??[])if(!byId.has(dep))return fail('PROOF_DEPENDENCY_MISSING','Proof dependency not found',dep);
  const visiting=new Set<string>(),done=new Set<string>(),built=new Map<string,ProofNode>();
  const walk=(id:string):Result<ProofNode>=>{
    if(options.cancellation?.isCancelled())return fail('CANCELLED','Operation cancelled');
    if(visiting.has(id))return fail('PROOF_SPINE_CYCLE','Proof spine cycle detected',id);
    const existing=built.get(id);if(existing)return {ok:true,value:existing};
    visiting.add(id);const node=byId.get(id)!;const depDigests:string[]=[];
    for(const dep of [...(node.dependencies??[])].sort(compareCodePoint)){const r=walk(dep);if(!r.ok)return r;depDigests.push(r.value.digest);}
    const digest=sha(options,{id,payloadDigest:node.payloadDigest,dependencies:depDigests});if(!digest.ok)return digest;
    const result=deepFreeze({id,digest:digest.value,dependencies:[...(node.dependencies??[])].sort(compareCodePoint)});visiting.delete(id);done.add(id);built.set(id,result);return {ok:true,value:result};
  };
  for(const id of [...byId.keys()].sort(compareCodePoint)){const r=walk(id);if(!r.ok)return r;}
  return {ok:true,value:deepFreeze([...built.values()].sort((a,b)=>compareCodePoint(a.id,b.id)))};
}

export function computeProofInvalidation(nodes:readonly ProofNode[],changedIds:readonly string[],unknownDependencyKnowledge=false):readonly string[] {
  if(unknownDependencyKnowledge)return deepFreeze(nodes.map(n=>n.id).sort(compareCodePoint));
  const affected=new Set(changedIds);let moved=true;
  while(moved){moved=false;for(const node of nodes)if(!affected.has(node.id)&&node.dependencies.some(d=>affected.has(d))){affected.add(node.id);moved=true;}}
  return deepFreeze([...affected].sort(compareCodePoint));
}

export function buildGovernanceDeltaReceipt(input:Omit<GovernanceDeltaReceipt,'semanticIdentity'>,options:OperationOptions):Result<GovernanceDeltaReceipt> {
  const normalized={...input,frontierMoved:[...input.frontierMoved].sort(compareCodePoint),bridgesAdded:[...input.bridgesAdded].sort(compareCodePoint),bridgesRetired:[...input.bridgesRetired].sort(compareCodePoint),driftChanges:[...input.driftChanges].sort(compareCodePoint),quarantineChanges:[...input.quarantineChanges].sort(compareCodePoint),capabilitiesUnlocked:[...input.capabilitiesUnlocked].sort(compareCodePoint),capabilitiesInvalidated:[...input.capabilitiesInvalidated].sort(compareCodePoint)};
  const identity=sha(options,normalized);if(!identity.ok)return identity;
  return {ok:true,value:deepFreeze({...normalized,semanticIdentity:identity.value})};
}

function deriveValidity(input:AdoptionReceiptInput):ReceiptValidity {
  if(input.blockers.length)return 'BLOCKED';
  return input.capabilityUnlocks.every(c=>c.unlocked)?'VALID':'PARTIAL';
}

export function buildAdoptionReceipt(input:AdoptionReceiptInput,proofInputs:readonly ProofNodeInput[],options:OperationOptions):Result<AdoptionReceipt> {
  if(hasSecretLikeKey(input))return fail('RECEIPT_SECRET_MATERIAL_FORBIDDEN','Secret-like material is forbidden in adoption receipts');
  if(!input.projectId||!input.sourcePackIdentity||!input.profileIdentity||!input.profileDigest||!input.intentCapsuleIdentity||!input.policyVersion)return fail('ADOPTION_RECEIPT_BINDING_MISSING','Receipt bindings are incomplete');
  const spine=buildAdoptionProofSpine(proofInputs,options);if(!spine.ok)return spine;
  const normalized={...input,normalizationFrontier:{...input.normalizationFrontier,domains:[...input.normalizationFrontier.domains].sort((a,b)=>compareCodePoint(a.domain,b.domain))},bridgeIds:[...input.bridgeIds].sort(compareCodePoint),membraneIds:[...input.membraneIds].sort(compareCodePoint),driftSummary:[...input.driftSummary].sort(compareCodePoint),quarantineIds:[...input.quarantineIds].sort(compareCodePoint),completedIncrementIds:[...input.completedIncrementIds].sort(compareCodePoint),blockers:[...input.blockers].sort(compareCodePoint),capabilityUnlocks:[...input.capabilityUnlocks].map(c=>({...c,reasons:[...c.reasons].sort(compareCodePoint)})).sort((a,b)=>compareCodePoint(a.capability,b.capability))};
  const validity=deriveValidity(normalized);const identity=sha(options,{...normalized,validity,proofSpine:spine.value});if(!identity.ok)return identity;
  return {ok:true,value:deepFreeze({...normalized,semanticIdentity:identity.value,validity,proofSpine:spine.value})};
}

export function evaluateReceiptValidity(receipt:AdoptionReceipt,current:ReceiptCurrentBindings):ReceiptValidity {
  if(receipt.projectId!==current.projectId)return 'PROJECT_MISMATCH';
  if(receipt.sourcePackIdentity!==current.sourcePackIdentity)return 'SOURCE_PACK_MISMATCH';
  if(receipt.policyVersion!==current.policyVersion)return 'POLICY_VERSION_UNSUPPORTED';
  return receipt.validity;
}

export function detectAdoptionRegression(previous:AdoptionReceipt,current:AdoptionReceipt):readonly AdoptionRegression[] {
  const regressions:AdoptionRegression[]=[];
  const prevFrontier=new Map(previous.normalizationFrontier.domains.map(d=>[d.domain,d.state] as const));
  const curFrontier=new Map(current.normalizationFrontier.domains.map(d=>[d.domain,d.state] as const));
  for(const [domain,state] of prevFrontier){const now=curFrontier.get(domain);if(state==='GEF_CANONICAL'&&now!==state)regressions.push({code:'CANONICAL_DOMAIN_REGRESSION',domain,message:`Canonical domain regressed to ${now??'MISSING'}`});}
  const prevCaps=new Map(previous.capabilityUnlocks.map(c=>[c.capability,c.unlocked] as const));
  for(const cap of current.capabilityUnlocks)if(prevCaps.get(cap.capability)===true&&!cap.unlocked)regressions.push({code:'CAPABILITY_REGRESSION',capability:cap.capability,message:'Previously unlocked capability is no longer unlocked'});
  if(previous.sourcePackIdentity!==current.sourcePackIdentity)regressions.push({code:'SOURCE_PACK_BINDING_CHANGED',message:'Source Pack identity changed'});
  if(previous.profileDigest!==current.profileDigest)regressions.push({code:'PROFILE_BINDING_CHANGED',message:'Profile digest changed'});
  return deepFreeze(regressions.sort((a,b)=>compareCodePoint(`${a.code}:${a.domain??''}:${a.capability??''}`,`${b.code}:${b.domain??''}:${b.capability??''}`)));
}
