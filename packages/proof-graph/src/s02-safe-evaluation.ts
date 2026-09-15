import type{OperationOptions,ProofComputationInput,ProofEvaluation,Result}from'./types.js';
import type{TrustedOperationOptions}from'@gef-bootstrap/evidence-engine';
import{fail}from'./utils.js';
import{evaluateProofGraph as evaluateCore}from'./s02-graph.js';
export function evaluateProofGraph(input:ProofComputationInput,m24Options:TrustedOperationOptions,options:OperationOptions):Result<ProofEvaluation>{const seen=new Map<string,string>();for(const o of input.manifest.obligations){const prior=seen.get(o.claimId);if(prior!==undefined&&prior!==o.obligationDigest)return fail('M25_OBLIGATION_AMBIGUOUS','A claim has divergent proof obligations; no implicit winner is allowed.',o.claimId);if(prior!==undefined)return fail('M25_OBLIGATION_REPLAY_AMBIGUOUS','Repeated obligation identity must be canonicalized before proof evaluation.',o.claimId);seen.set(o.claimId,o.obligationDigest);}return evaluateCore(input,m24Options,options);}
