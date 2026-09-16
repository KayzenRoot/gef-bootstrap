import {createHash} from 'node:crypto';
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
export const digest=(d,v)=>createHash('sha256').update(`${d}\0${stable(v)}`).digest('hex');
export function helpIndex(commands){return [...commands].sort((a,b)=>a.id.localeCompare(b)).map(x=>({id:x.id,summary:x.summary,schema:x.schema??null}));}
export function installPlan({platform,target,version,current=null,elevated=false}){if(!['win32','linux','darwin'].includes(platform))return {state:'UNSUPPORTED'};return {state:'READY',platform,target,version,current,elevated,phases:['PRECHECK','STAGE','VERIFY','COMMIT'],digest:digest('GEF/GIR49',{platform,target,version,current,elevated})};}
export function upgradePreview(current,candidate,migrations=[]){if(!current||!candidate)return {state:'INDETERMINATE'};if(current===candidate)return {state:'NOOP',migrations:[]};return {state:'READY',current,candidate,migrations:[...migrations],digest:digest('GEF/UPD50',{current,candidate,migrations})};}
export function compatibility(requirements,observed){const missing=[];for(const [k,v] of Object.entries(requirements))if(observed[k]!==v)missing.push(k);return {state:missing.length?'UNSUPPORTED':'SUPPORTED',missing};}
export function doctor(observations){return Object.entries(observations).map(([id,value])=>({id,state:value===undefined?'UNKNOWN':value?'HEALTHY':'FINDING'}));}
export function repairSuggestion(finding){return {finding,risk:'REVIEW_REQUIRED',automatic:false,previewRequired:true};}
export function invariantResult(name,actual,expected){return {name,pass:stable(actual)===stable(expected),actual,expected};}
export function tempRepoSpec(name,fixture={}){if(name.includes('..')||/[\\/]/.test(name))throw new Error('INVALID_SANDBOX_NAME');return {name,fixture,digest:digest('GEF/TRF54',{name,fixture}),isolated:true};}
