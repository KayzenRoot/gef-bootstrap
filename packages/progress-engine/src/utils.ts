import type{Diagnostic,ExactFraction,OperationOptions,ProgressQuery,Result}from'./types.js';
export function compareCodePoint(a:string,b:string){return a<b?-1:a>b?1:0;}
export function sortedUnique(values:readonly string[]){return[...new Set(values)].sort(compareCodePoint);}
export function deepFreeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value as Record<string,unknown>)){if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);}}return value;}
export function fail<T=never>(code:string,message:string,subject?:string):Result<T>{const d:Diagnostic={code,message,...(subject===undefined?{}:{subject})};return{ok:false,diagnostics:[d]};}
export function cancelled<T=never>(options:OperationOptions):Result<T>|null{return options.cancellation?.isCancelled()?fail('PROGRESS_CANCELLED','Progress Engine operation was cancelled'):null;}
export function validId(value:string){return/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
export function isSha256(value:string){return/^sha256:[0-9a-f]{64}$/.test(value);}
function canonical(v:unknown):unknown{if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object'){const out:Record<string,unknown>={};for(const k of Object.keys(v as Record<string,unknown>).sort(compareCodePoint))out[k]=canonical((v as Record<string,unknown>)[k]);return out;}return v;}
export function stableJson(value:unknown){return JSON.stringify(canonical(value));}
export function sha(options:OperationOptions,value:unknown):Result<string>{try{if(options.digest.algorithm!=='sha256')return fail('DIGEST_ALGORITHM_INVALID','Progress Engine requires SHA-256');const raw=options.digest.digest(stableJson(value));if(!/^[0-9a-f]{64}$/i.test(raw))return fail('DIGEST_INVALID','Injected digest capability did not return SHA-256 hex');return{ok:true,value:`sha256:${raw.toLowerCase()}`};}catch{return fail('DIGEST_FAILED','Injected digest capability failed');}}
export function safeWeight(value:number){return Number.isSafeInteger(value)&&value>=0;}
export function positiveWeight(value:number){return Number.isSafeInteger(value)&&value>0;}
export function addSafe(values:readonly number[]):Result<number>{let total=0;for(const value of values){if(!safeWeight(value))return fail('WEIGHT_INVALID','Weights must be non-negative safe integers');total+=value;if(!Number.isSafeInteger(total))return fail('WEIGHT_OVERFLOW','Weight sum exceeded safe integer range');}return{ok:true,value:total};}
export function exactFraction(numerator:number,denominator:number,options:OperationOptions):Result<ExactFraction>{if(!safeWeight(numerator)||!positiveWeight(denominator)||numerator>denominator)return fail('FRACTION_INVALID','Exact progress fraction is invalid');const d=sha(options,{numerator,denominator});if(!d.ok)return d;return{ok:true,value:deepFreeze({numerator,denominator,fractionDigest:d.value})};}
export function verifyFraction(value:ExactFraction,options:OperationOptions):Result<boolean>{const built=exactFraction(value.numerator,value.denominator,options);return built.ok?{ok:true,value:built.value.fractionDigest===value.fractionDigest}:built;}
export function limits(options:OperationOptions){return{units:Math.max(1,Math.min(options.maxUnits??4096,65536)),nodes:Math.max(1,Math.min(options.maxNodes??16384,131072)),refs:Math.max(1,Math.min(options.maxRefs??32768,262144))};}
export function queryValid(query:ProgressQuery){return query.kind==='PROJECT'?query.refId===null:typeof query.refId==='string'&&validId(query.refId);}
export function allSha(values:readonly(string|null|undefined)[]){return values.every(v=>v==null||isSha256(v));}
export function own<T extends object>(value:T,key:PropertyKey){return Object.prototype.hasOwnProperty.call(value,key);}
