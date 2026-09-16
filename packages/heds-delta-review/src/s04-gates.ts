import type{GateEvaluationInput,GateReceipt,GateState,OperationOptions,Result,ReviewGateSet,SemanticFinding}from'./types.js';
import{deepFreeze,digestValue,ok,sortedUnique}from'./utils.js';

function receipt(gateId:string,state:GateState,reasons:readonly string[],options:OperationOptions):Result<GateReceipt>{const body={gateId,state,reasonCodes:sortedUnique(reasons)};const d=digestValue(options,gateId,body);return d.ok?ok(deepFreeze({...body,receiptDigest:d.value})):d;}
function blockingFindings(findings:readonly SemanticFinding[]){return findings.filter(f=>(f.severity==='CRITICAL'||f.severity==='HIGH')&&(f.state==='OPEN'||f.state==='INDETERMINATE'));}
function overallState(states:readonly GateState[]):GateState{if(states.includes('TRUNCATED'))return'TRUNCATED';if(states.includes('BLOCKED'))return'BLOCKED';if(states.includes('INDETERMINATE'))return'INDETERMINATE';if(states.includes('FAIL'))return'FAIL';return'PASS';}

export function evaluateReviewGates(input:GateEvaluationInput,options:OperationOptions):Result<ReviewGateSet>{
 const b=receipt('BCG26',input.baselineContinuity?'PASS':'BLOCKED',input.baselineContinuity?[]:['BASELINE_CONTINUITY_INVALID'],options);if(!b.ok)return b;
 const s=receipt('SCG26',input.sourceCoverageSufficient?'PASS':'INDETERMINATE',input.sourceCoverageSufficient?[]:['SOURCE_COVERAGE_INSUFFICIENT'],options);if(!s.ok)return s;
 const p=receipt('PIG26',input.allInvalidatedProofItemsReviewed?'PASS':'FAIL',input.allInvalidatedProofItemsReviewed?[]:['INVALIDATED_PROOF_ITEM_UNREVIEWED'],options);if(!p.ok)return p;
 const f=receipt('FCG26',input.findingClosureValid?'PASS':'FAIL',input.findingClosureValid?[]:['FINDING_CLOSURE_INVALID'],options);if(!f.ok)return f;
 const high=blockingFindings(input.findings);const z=receipt('ZHG26',high.length===0?'PASS':'FAIL',high.map(x=>`${x.severity}:${x.findingId}`),options);if(!z.ok)return z;
 const a=receipt('AAG26',input.authorityConflict?'BLOCKED':'PASS',input.authorityConflict?['AUTHORITY_OR_AMBIGUITY_CONFLICT']:[],options);if(!a.ok)return a;
 const budgetState:GateState=input.truncated?'TRUNCATED':input.indeterminate?'INDETERMINATE':'PASS';const m=receipt('BMG26',budgetState,budgetState==='TRUNCATED'?['REVIEW_TRUNCATED']:budgetState==='INDETERMINATE'?['MANDATORY_REVIEW_TRUTH_INDETERMINATE']:[],options);if(!m.ok)return m;
 const prereq=[b.value.state,s.value.state,p.value.state,f.value.state,z.value.state,a.value.state,m.value.state];const vState=overallState(prereq);const v=receipt('VAG26',vState,vState==='PASS'?[]:[`PRECONDITION_${vState}`],options);if(!v.ok)return v;
 const body={baselineContinuity:b.value,sourceCompleteness:s.value,proofInvalidation:p.value,findingClosure:f.value,zeroHighCritical:z.value,authorityAmbiguity:a.value,budgetMaterialization:m.value,verdictAdmission:v.value};const d=digestValue(options,'M26_GATE_SET',body);return d.ok?ok(deepFreeze({...body,gateSetDigest:d.value})):d;
}
