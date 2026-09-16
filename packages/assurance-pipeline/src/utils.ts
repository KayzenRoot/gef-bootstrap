import type{AssuranceClass,Diagnostic,OperationOptions,Result}from'./types.js';
export function ok<T>(value:T):Result<T>{return{ok:true,value};}
export function fail<T=never>(code:string,message:string,subject?:string):Result<T>{const d:Diagnostic=subject===undefined?{code,message}:{code,message,subject};return{ok:false,diagnostics:[d]};}
export function compareCodePoint(a:string,b:string){return a<b?-1:a>b?1:0;}
export function sortedUnique(values:readonly string[]){return[...new Set(values)].sort(compareCodePoint);}
export function validId(value:string){return/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
export function isSha256(value:string){return/^sha256:[0-9a-f]{64}$/.test(value);}
export function stableStringify(value:unknown):string{if(value===null||typeof value==='number'||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);if(Array.isArray(value))return`[${value.map(stableStringify).join(',')}]`;if(typeof value==='object'){const r=value as Record<string,unknown>;return`{${Object.keys(r).sort(compareCodePoint).map(k=>`${JSON.stringify(k)}:${stableStringify(r[k])}`).join(',')}}`;}throw new Error('UNSUPPORTED_CANONICAL_VALUE');}
export function digestValue(options:OperationOptions,kind:string,payload:unknown):Result<string>{if(options.digest.algorithm!=='sha256')return fail('DIGEST_ALGORITHM_INVALID','M27 requires injected SHA-256.',kind);try{const raw=options.digest.digest(`${kind}\n${stableStringify(payload)}`);if(!/^[0-9a-f]{64}$/i.test(raw))return fail('DIGEST_OUTPUT_INVALID','Injected digest did not return SHA-256 hex.',kind);return ok(`sha256:${raw.toLowerCase()}`);}catch{return fail('DIGEST_CAPABILITY_FAILED','Injected digest capability failed.',kind);}}
export function deepFreeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value as Record<string,unknown>)){if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);}}return value;}
export class Guard{private used=0;private readonly max:number;constructor(private readonly options:OperationOptions){this.max=Math.max(1,Math.min(options.maxUnits??16384,262144));}step(subject:string):Result<true>{if(this.options.cancellation?.isCancelled()===true)return fail('OPERATION_CANCELLED','M27 operation cancelled.',subject);this.used+=1;if(this.used>this.max)return fail('OPERATION_BUDGET_EXCEEDED','M27 operation budget exceeded.',subject);return ok(true);}}
export function allSha(values:readonly(string|null)[]){return values.every(v=>v===null||isSha256(v));}
export const ASSURANCE_CLASSES:readonly AssuranceClass[]=['STANDARD','STANDARD_PLUS','ELEVATED','HIGH_ASSURANCE','MAX_ASSURANCE'];
export function classRank(value:AssuranceClass){return ASSURANCE_CLASSES.indexOf(value);}
export function maxClass(a:AssuranceClass,b:AssuranceClass):AssuranceClass{return classRank(a)>=classRank(b)?a:b;}
