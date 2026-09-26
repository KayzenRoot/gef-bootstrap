import { createHash } from 'node:crypto';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export const digest=(d,v)=>createHash('sha256').update(`${d}\0${JSON.stringify(stable(v))}`).digest('hex');

export function requirementAudit(requirements=[]){
 const gaps=requirements.filter(r=>r.required!==false && r.state!=='SATISFIED').map(r=>({id:r.id,state:r.state??'UNKNOWN'})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 return {verdict:gaps.length?'REJECTED':'PASS',total:requirements.length,gaps,digest:digest('RAG62',{requirements,gaps})};
}
export function securityAudit({critical=0,high=0,tests='UNKNOWN',dependencies='UNKNOWN'}={}){
 const known=[critical,high].every(Number.isInteger)&&['PASS','FAIL'].includes(tests)&&['PASS','FAIL'].includes(dependencies);
 const verdict=!known?'INDETERMINATE':critical||high||tests!=='PASS'||dependencies!=='PASS'?'REJECTED':'PASS';
 return {verdict,critical,high,tests,dependencies,digest:digest('SAG62',{critical,high,tests,dependencies})};
}
export function productionAcceptance(input={}){
 const gates=['requirements','security','e2e','documentation','assurance'];
 const states=gates.map(k=>[k,input[k]??'UNKNOWN']);
 const verdict=states.some(([,v])=>v==='REJECTED'||v==='FAIL')?'REJECTED':states.every(([,v])=>v==='PASS')?'ACCEPTED':'INDETERMINATE';
 const receipt={candidate:input.candidate??null,verdict,gates:Object.fromEntries(states),recovery:input.recovery??null};
 return {...receipt,digest:digest('PAR62',receipt)};
}
export function executorBudget({latencyMs,tokens,acceptedPoints,ioOps}={}){
 if(![latencyMs,tokens,acceptedPoints,ioOps].every(x=>Number.isFinite(x)&&x>=0)) return {state:'INSUFFICIENT_DATA'};
 const progressDensity=tokens===0?(acceptedPoints>0?Infinity:0):acceptedPoints/tokens;
 return {state:'MEASURED',latencyMs,tokens,acceptedPoints,ioOps,progressDensity};
}
export function navigationPlan(files=[]){
 const unique=[...new Set(files.filter(Boolean))].sort();
 return {files:unique,ioBudget:unique.length,digest:digest('ENM63',unique)};
}
export function executionWaves(tasks=[]){
 const byId=new Map(tasks.map(t=>[t.id,t]));
 if(byId.size!==tasks.length||tasks.some(t=>!t.id)) return {state:'INVALID',waves:[]};
 const ids=new Set(byId.keys());
 if(tasks.some(t=>!Array.isArray(t.deps??[])||(t.deps??[]).some(d=>!ids.has(d)))) return {state:'MISSING_DEPENDENCY',waves:[]};
 const remaining=new Set(ids),done=new Set(),waves=[];
 while(remaining.size){
  const wave=[...remaining].filter(id=>(byId.get(id).deps??[]).every(d=>done.has(d))).sort();
  if(!wave.length)return {state:'CYCLE',waves};
  waves.push(wave); for(const id of wave){remaining.delete(id);done.add(id);}
 }
 return {state:'READY',waves,criticalDepth:waves.length,digest:digest('EWF63',waves)};
}
export function performanceRegression(baseline,candidate,{latencyTolerance=.15,tokenTolerance=.15}={}){
 if(!baseline||!candidate||baseline.population!==candidate.population)return {verdict:'INCOMPARABLE'};
 if(!(baseline.latencyMs>0&&baseline.tokens>0&&candidate.latencyMs>=0&&candidate.tokens>=0))return {verdict:'INSUFFICIENT_DATA'};
 const latencyDelta=(candidate.latencyMs-baseline.latencyMs)/baseline.latencyMs, tokenDelta=(candidate.tokens-baseline.tokens)/baseline.tokens;
 return {verdict:latencyDelta>latencyTolerance||tokenDelta>tokenTolerance?'REGRESSION':'PASS',latencyDelta,tokenDelta};
}

export * from './v11-performance-telemetry.mjs';
