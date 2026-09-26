import type{Diagnostic,DigestPort,ExactRational,OperationOptions,Result}from'./types.js';

const HEX64=/^[0-9a-f]{64}$/i;

export function ok<T>(value:T):Result<T>{return{ok:true,value};}
export function fail<T>(code:string,message:string,subject?:string):Result<T>{
 const diagnostic:Diagnostic=subject===undefined?{code,message}:{code,message,subject};
 return{ok:false,diagnostics:[diagnostic]};
}
export function isSafeNonNegativeInteger(value:number):boolean{return Number.isSafeInteger(value)&&value>=0;}
export function isSafePositiveInteger(value:number):boolean{return Number.isSafeInteger(value)&&value>0;}
export function stableStringify(value:unknown):string{
 if(value===null||typeof value==='number'||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(Array.isArray(value))return`[${value.map(stableStringify).join(',')}]`;
 if(typeof value==='object'){
  const record=value as Record<string,unknown>;
  return`{${Object.keys(record).sort().map((key)=>`${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
 }
 throw new Error('UNSUPPORTED_CANONICAL_VALUE');
}
export function digestValue(port:DigestPort,kind:string,payload:unknown):Result<string>{
 if(port.algorithm!=='sha256')return fail('DIGEST_ALGORITHM_INVALID','Only injected SHA-256 is accepted.',kind);
 try{
  const digest=port.digest(`${kind}\n${stableStringify(payload)}`);
  if(!HEX64.test(digest))return fail('DIGEST_OUTPUT_INVALID','Injected digest capability returned a non SHA-256 hex digest.',kind);
  return ok(`sha256:${digest.toLowerCase()}`);
 }catch(error){
  return fail('DIGEST_CAPABILITY_FAILED',error instanceof Error?error.message:'Injected digest capability failed.',kind);
 }
}
export class Guard{
 private used=0;
 private readonly max:number;
 constructor(private readonly options:OperationOptions){this.max=options.maxUnits??4096;}
 step(subject:string):Result<true>{
  if(this.options.cancellation?.isCancelled()===true)return fail('OPERATION_CANCELLED','Operation cancelled.',subject);
  this.used+=1;
  if(!Number.isSafeInteger(this.max)||this.max<=0||this.used>this.max)return fail('OPERATION_BUDGET_EXCEEDED','Operation unit budget exceeded.',subject);
  return ok(true);
 }
}
function gcd(a:bigint,b:bigint):bigint{let x=a<0n?-a:a;let y=b<0n?-b:b;while(y!==0n){const t=x%y;x=y;y=t;}return x===0n?1n:x;}
export function rationalParts(numerator:bigint,denominator:bigint):{numerator:bigint;denominator:bigint}{
 if(denominator<=0n)throw new Error('RATIONAL_DENOMINATOR_INVALID');
 const sign=numerator<0n?-1n:1n;
 const g=gcd(numerator,denominator);
 return{numerator:sign*(numerator<0n?-numerator:numerator)/g,denominator:denominator/g};
}
export function createRational(numerator:bigint,denominator:bigint,options:OperationOptions,kind='ExactRational'):Result<ExactRational>{
 let parts:{numerator:bigint;denominator:bigint};
 try{parts=rationalParts(numerator,denominator);}catch{return fail('RATIONAL_DENOMINATOR_INVALID','Rational denominator must be positive.',kind);}
 const payload={numerator:parts.numerator.toString(),denominator:parts.denominator.toString()};
 const digest=digestValue(options.digest,kind,payload);if(!digest.ok)return digest;
 return ok({...payload,rationalDigest:digest.value});
}
export function parseRational(value:ExactRational):{numerator:bigint;denominator:bigint}{return{numerator:BigInt(value.numerator),denominator:BigInt(value.denominator)};}
export function compareRational(a:ExactRational,b:ExactRational):number{
 const aa=parseRational(a),bb=parseRational(b);const left=aa.numerator*bb.denominator,right=bb.numerator*aa.denominator;return left<right?-1:left>right?1:0;
}
export function subtractFractions(an:number,ad:number,bn:number,bd:number,options:OperationOptions,kind:string):Result<ExactRational>{
 if(!isSafeNonNegativeInteger(an)||!isSafePositiveInteger(ad)||!isSafeNonNegativeInteger(bn)||!isSafePositiveInteger(bd))return fail('PROGRESS_FRACTION_INVALID','Progress fractions must use safe non-negative numerators and positive denominators.',kind);
 return createRational(BigInt(an)*BigInt(bd)-BigInt(bn)*BigInt(ad),BigInt(ad)*BigInt(bd),options,kind);
}
export function addRational(a:ExactRational,b:ExactRational,options:OperationOptions,kind:string):Result<ExactRational>{const aa=parseRational(a),bb=parseRational(b);return createRational(aa.numerator*bb.denominator+bb.numerator*aa.denominator,aa.denominator*bb.denominator,options,kind);}
export function ceilDivPositive(numerator:bigint,denominator:bigint):bigint{if(numerator<0n||denominator<=0n)throw new Error('CEIL_DIV_DOMAIN');return numerator===0n?0n:(numerator+denominator-1n)/denominator;}
export function exactDurationMs(work:ExactRational,throughput:ExactRational):Result<number>{
 try{
  const w=parseRational(work),t=parseRational(throughput);
  if(w.numerator<0n||t.numerator<=0n)return fail('DURATION_DOMAIN_INVALID','Work must be non-negative and throughput positive.');
  const duration=ceilDivPositive(w.numerator*t.denominator,w.denominator*t.numerator);
  if(duration>BigInt(Number.MAX_SAFE_INTEGER))return fail('DURATION_OVERFLOW','Projected duration exceeds safe integer milliseconds.');
  return ok(Number(duration));
 }catch{return fail('DURATION_COMPUTATION_FAILED','Could not compute exact duration.');}
}
export function addSafeIntegers(a:number,b:number,code='INTEGER_OVERFLOW'):Result<number>{if(!isSafeNonNegativeInteger(a)||!isSafeNonNegativeInteger(b))return fail('INTEGER_INVALID','Expected safe non-negative integers.');const sum=a+b;if(!Number.isSafeInteger(sum))return fail(code,'Safe integer overflow.');return ok(sum);}
export function uniqueSorted(values:readonly string[]):string[]{return[...new Set(values)].sort();}
