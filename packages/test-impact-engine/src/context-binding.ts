import type{OperationOptions,Result}from'./types.js';import{digest,fail,ok}from'./utils.js';
export type ImpactContext={projectId:string;lineageId:string;candidateDigest:string;policyDigest:string;profileDigest:string;runtimeDigest:string;toolchainDigest:string;platform:string};
export function bindImpactContext(context:ImpactContext,options:OperationOptions):Result<{context:ImpactContext;digest:string}>{for(const[k,v]of Object.entries(context))if(!v)return fail('CONTEXT_BINDING_INVALID','M28 context binding field is empty.',k);const d=digest(options,'XCG28',context);return d.ok?ok({context:{...context},digest:d.value}):d;}
export function sameImpactContext(a:ImpactContext,b:ImpactContext){return Object.keys(a).every(k=>a[k as keyof ImpactContext]===b[k as keyof ImpactContext]);}
