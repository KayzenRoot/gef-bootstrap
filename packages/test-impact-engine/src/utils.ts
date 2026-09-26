import type{Diagnostic,OperationOptions,Result,ValidationLevel}from'./types.js';
export const ok=<T>(value:T):Result<T>=>({ok:true,value});
export function fail<T=never>(code:string,message:string,subject?:string):Result<T>{const d:Diagnostic=subject===undefined?{code,message}:{code,message,subject};return{ok:false,diagnostics:[d]};}
export const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const unique=(v:readonly string[])=>[...new Set(v)].sort(cmp);
export const validId=(v:string)=>/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
export const isSha=(v:string)=>/^sha256:[0-9a-f]{64}$/.test(v);
export function stable(value:unknown):string{if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean')return JSON.stringify(value);if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;if(typeof value==='object'){const r=value as Record<string,unknown>;return`{${Object.keys(r).sort(cmp).map(k=>`${JSON.stringify(k)}:${stable(r[k])}`).join(',')}}`;}throw new Error('UNSUPPORTED_CANONICAL_VALUE');}
export function digest(options:OperationOptions,kind:string,value:unknown):Result<string>{if(options.digest.algorithm!=='sha256')return fail('DIGEST_ALGORITHM_INVALID','M28 requires injected SHA-256.',kind);try{const raw=options.digest.digest(`GEF:M28:${kind}\n${stable(value)}`);if(!/^[0-9a-f]{64}$/i.test(raw))return fail('DIGEST_OUTPUT_INVALID','Injected digest did not return SHA-256 hex.',kind);return ok(`sha256:${raw.toLowerCase()}`);}catch{return fail('DIGEST_CAPABILITY_FAILED','Injected digest capability failed.',kind);}}
export class Guard{private used=0;private readonly max:number;constructor(private readonly o:OperationOptions){this.max=Math.max(1,Math.min(o.maxUnits??16384,262144));}step(subject:string):Result<true>{if(this.o.cancellation?.isCancelled())return fail('OPERATION_CANCELLED','M28 operation cancelled.',subject);if(++this.used>this.max)return fail('OPERATION_BUDGET_EXCEEDED','M28 operation budget exceeded.',subject);return ok(true);}}
export const LEVELS:readonly ValidationLevel[]=['L0','L1','L2','L3','L4','L5'];
export const rank=(v:ValidationLevel)=>LEVELS.indexOf(v);
export const maxLevel=(...v:ValidationLevel[])=>v.reduce((a,b)=>rank(a)>=rank(b)?a:b,'L0' as ValidationLevel);
