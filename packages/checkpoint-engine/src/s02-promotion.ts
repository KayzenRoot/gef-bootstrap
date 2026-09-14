import type { CanonicalContinuationCapsule, CheckpointMutationReceipt, CheckpointPromotionProposal, OperationOptions, PromotionFenceToken, Result, SemanticCasResult, SplitBrainFinding } from './types.js';
import { evaluateContinuationInvariants, verifyCanonicalContinuationCapsule } from './s01-state.js';
import { cancelled, compareCodePoint, deepFreeze, fail, sha, sortedUnique, validId } from './utils.js';

export function semanticCompareAndSwap(expectedBaseDigest:string,currentBaseDigest:string):SemanticCasResult{
  return deepFreeze({status:expectedBaseDigest===currentBaseDigest?'MATCH':'STALE_BASE',expectedBaseDigest,currentBaseDigest});
}

export function createPromotionFenceToken(lineageId:string,baseCheckpointDigest:string,nonce:string,options:OperationOptions):Result<PromotionFenceToken>{
  const c=cancelled(options);if(c)return c;
  if(!validId(lineageId)||!/^sha256:[0-9a-f]{64}$/.test(baseCheckpointDigest)||!validId(nonce))return fail('PROMOTION_FENCE_INVALID','Fence token requires lineage, base digest and stable nonce');
  const semantic={lineageId,baseCheckpointDigest,nonce};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({tokenId:`pft:${d.value.slice(7,39)}`,...semantic,tokenDigest:d.value})};
}

export function verifyPromotionFenceToken(token:PromotionFenceToken,options:OperationOptions):Result<true>{
  const d=sha(options,{lineageId:token.lineageId,baseCheckpointDigest:token.baseCheckpointDigest,nonce:token.nonce});if(!d.ok)return d as Result<true>;
  const expectedId=`pft:${d.value.slice(7,39)}`;
  if(token.tokenDigest!==d.value||token.tokenId!==expectedId)return fail('PROMOTION_FENCE_TAMPERED','Promotion fence semantic identity does not match its payload',token.tokenId);
  return{ok:true,value:true};
}

export function createCheckpointPromotionProposal(expectedBaseDigest:string,candidate:CanonicalContinuationCapsule,fenceToken:PromotionFenceToken,authorizationRef:string,options:OperationOptions):Result<CheckpointPromotionProposal>{
  const c=cancelled(options);if(c)return c;
  if(!/^sha256:[0-9a-f]{64}$/.test(expectedBaseDigest)||!authorizationRef.trim())return fail('CHECKPOINT_PROPOSAL_INVALID','Expected base and authorization are required');
  const checkpoint=verifyCanonicalContinuationCapsule(candidate,options);if(!checkpoint.ok)return checkpoint as Result<CheckpointPromotionProposal>;
  const fence=verifyPromotionFenceToken(fenceToken,options);if(!fence.ok)return fence as Result<CheckpointPromotionProposal>;
  if(fenceToken.baseCheckpointDigest!==expectedBaseDigest||fenceToken.lineageId!==candidate.lineageId)return fail('PROMOTION_FENCE_MISMATCH','Fence token is not bound to candidate lineage/base');
  if(candidate.predecessorCheckpointDigest!==expectedBaseDigest)return fail('CHECKPOINT_PREDECESSOR_MISMATCH','Candidate predecessor must equal expected base');
  const semantic={expectedBaseDigest,candidateDigest:candidate.checkpointDigest,fenceTokenDigest:fenceToken.tokenDigest,authorizationRef};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({expectedBaseDigest,candidate,fenceToken,authorizationRef,proposalDigest:d.value})};
}

export function verifyCheckpointPromotionProposal(proposal:CheckpointPromotionProposal,options:OperationOptions):Result<true>{
  const checkpoint=verifyCanonicalContinuationCapsule(proposal.candidate,options);if(!checkpoint.ok)return checkpoint;
  const fence=verifyPromotionFenceToken(proposal.fenceToken,options);if(!fence.ok)return fence;
  const d=sha(options,{expectedBaseDigest:proposal.expectedBaseDigest,candidateDigest:proposal.candidate.checkpointDigest,fenceTokenDigest:proposal.fenceToken.tokenDigest,authorizationRef:proposal.authorizationRef});if(!d.ok)return d as Result<true>;
  if(d.value!==proposal.proposalDigest)return fail('CHECKPOINT_PROPOSAL_TAMPERED','Promotion proposal semantic identity does not match its payload');
  return{ok:true,value:true};
}

export function detectSplitBrainContinuation(baseCheckpointDigest:string,successors:readonly CanonicalContinuationCapsule[]):SplitBrainFinding{
  const successorDigests=sortedUnique(successors.filter(s=>s.predecessorCheckpointDigest===baseCheckpointDigest).map(s=>s.checkpointDigest));
  return deepFreeze({baseCheckpointDigest,successorDigests,divergent:successorDigests.length>1});
}

export function commitCheckpointPromotion(current:CanonicalContinuationCapsule,proposal:CheckpointPromotionProposal,knownSuccessors:readonly CanonicalContinuationCapsule[],options:OperationOptions):Result<CheckpointMutationReceipt>{
  const c=cancelled(options);if(c)return c;
  const currentProof=verifyCanonicalContinuationCapsule(current,options);if(!currentProof.ok)return currentProof as Result<CheckpointMutationReceipt>;
  const proposalProof=verifyCheckpointPromotionProposal(proposal,options);if(!proposalProof.ok)return proposalProof as Result<CheckpointMutationReceipt>;
  for(const successor of knownSuccessors){const proof=verifyCanonicalContinuationCapsule(successor,options);if(!proof.ok)return proof as Result<CheckpointMutationReceipt>;}
  const cas=semanticCompareAndSwap(proposal.expectedBaseDigest,current.checkpointDigest);if(cas.status!=='MATCH')return fail('STALE_BASE','Current checkpoint changed after proposal creation',current.checkpointDigest);
  if(proposal.candidate.lineageId!==current.lineageId)return fail('CHECKPOINT_LINEAGE_MISMATCH','Candidate lineage differs from current checkpoint');
  if(proposal.fenceToken.baseCheckpointDigest!==current.checkpointDigest||proposal.fenceToken.lineageId!==current.lineageId)return fail('PROMOTION_FENCE_STALE','Promotion fence no longer matches current checkpoint');
  const split=detectSplitBrainContinuation(current.checkpointDigest,[...knownSuccessors,proposal.candidate]);if(split.divergent)return fail('DIVERGENT_SUCCESSOR','More than one semantic successor exists for the same checkpoint base');
  const inv=evaluateContinuationInvariants(proposal.candidate,proposal.candidate.authorityIndex,options);if(!inv.ok)return inv;if(!inv.value.admissible)return fail('CHECKPOINT_INVARIANT_FAILED','Candidate invariants failed before commit');
  const semantic={status:'COMMITTED' as const,beforeCheckpointDigest:current.checkpointDigest,afterCheckpointDigest:proposal.candidate.checkpointDigest,lineageId:current.lineageId,fenceTokenDigest:proposal.fenceToken.tokenDigest,authorizationRef:proposal.authorizationRef,invariantDigest:inv.value.invariantDigest,evidenceRefs:sortedUnique(proposal.candidate.evidenceRefs)};
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,receiptDigest:d.value})};
}

export function orderPromotionCandidates(candidates:readonly CanonicalContinuationCapsule[]){return deepFreeze([...candidates].sort((a,b)=>compareCodePoint(a.checkpointDigest,b.checkpointDigest)));}
