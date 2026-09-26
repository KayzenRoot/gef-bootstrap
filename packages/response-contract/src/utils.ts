import type{Diagnostic,OperationOptions,Result}from'./types.js';
export function compareCodePoint(a:string,b:string){return a<b?-1:a>b?1:0;}
export function sortedUnique(values:readonly string[]){return[...new Set(values)].sort(compareCodePoint);}
export function deepFreeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value as Record<string,unknown>)){if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);}}return value;}
export function fail<T=never>(code:string,message:string,subject?:string):Result<T>{const d:Diagnostic={code,message,...(subject===undefined?{}:{subject})};return{ok:false,diagnostics:[d]};}
export function cancelled<T=never>(options:OperationOptions):Result<T>|null{return options.cancellation?.isCancelled()?fail('RESPONSE_CANCELLED','Response Contract operation was cancelled'):null;}
export function validId(value:string){return/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
export function isSha256(value:string){return/^sha256:[0-9a-f]{64}$/.test(value);}
function canonical(v:unknown):unknown{if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object'){const out:Record<string,unknown>={};for(const k of Object.keys(v as Record<string,unknown>).sort(compareCodePoint))out[k]=canonical((v as Record<string,unknown>)[k]);return out;}return v;}
export function stableJson(value:unknown){return JSON.stringify(canonical(value));}
export function sha(options:OperationOptions,value:unknown):Result<string>{try{if(options.digest.algorithm!=='sha256')return fail('DIGEST_ALGORITHM_INVALID','Response Contract requires SHA-256');const raw=options.digest.digest(stableJson(value));if(!/^[0-9a-f]{64}$/i.test(raw))return fail('DIGEST_INVALID','Injected digest capability did not return a SHA-256 hex digest');return{ok:true,value:`sha256:${raw.toLowerCase()}`};}catch{return fail('DIGEST_FAILED','Injected digest capability failed');}}
export function limits(options:OperationOptions){return{fields:Math.max(1,Math.min(options.maxFields??256,4096)),refs:Math.max(1,Math.min(options.maxRefs??2048,32768)),bytes:Math.max(256,Math.min(options.maxBytes??131072,4_194_304))};}
export function secretLike(value:string){return/(?:password|passwd|secret|token|api[_-]?key|authorization|bearer|private[_-]?key)/i.test(value);}
export function privatePathLike(value:string){return/(?:[A-Za-z]:\\Users\\|\/home\/[^/]+\/|\/Users\/[^/]+\/|\\AppData\\|\.ssh[\\/])/i.test(value);}
export function allSha(values:readonly(string|null|undefined)[]){return values.every(v=>v==null||isSha256(v));}
export function assertIds(values:readonly string[]){return values.every(validId);}
