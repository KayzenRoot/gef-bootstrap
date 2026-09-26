import type { Diagnostic, OperationOptions, Result } from './types.js';

export function compareCodePoint(a:string,b:string){return a<b?-1:a>b?1:0;}
export function sortedUnique(values:readonly string[]){return [...new Set(values)].sort(compareCodePoint);}
export function deepFreeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value as Record<string,unknown>)){if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);}}return value;}
export function validId(value:string){return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);}
export function fail<T=never>(code:string,message:string,subject?:string):Result<T>{const d:Diagnostic={code,message,...(subject===undefined?{}:{subject})};return{ok:false,diagnostics:[d]};}
export function cancelled<T=never>(options:OperationOptions):Result<T>|null{return options.cancellation?.isCancelled()?fail('RESUME_CANCELLED','Resume operation was cancelled'):null;}
function canonical(v:unknown):unknown{if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object'){const out:Record<string,unknown>={};for(const k of Object.keys(v as Record<string,unknown>).sort(compareCodePoint))out[k]=canonical((v as Record<string,unknown>)[k]);return out;}return v;}
export function sha(options:OperationOptions,value:unknown):Result<string>{try{const raw=options.digest.digest(JSON.stringify(canonical(value)));if(!/^[0-9a-f]{64}$/i.test(raw))return fail('DIGEST_INVALID','Injected digest capability did not return a SHA-256 hex digest');return{ok:true,value:`sha256:${raw.toLowerCase()}`};}catch{return fail('DIGEST_FAILED','Injected digest capability failed');}}
export function isSha256(v:string){return /^sha256:[0-9a-f]{64}$/.test(v);}
export function readBudget(options:OperationOptions){return Math.max(1,Math.min(options.maxReads??128,2048));}
export function nodeBudget(options:OperationOptions){return Math.max(1,Math.min(options.maxNodes??2048,10000));}
