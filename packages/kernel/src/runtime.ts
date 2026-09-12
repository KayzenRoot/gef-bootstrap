import type { CommandRequest,EffectStatus,FailureResult,GefError,GefResult,HandlerOutcome,LifecycleTerminal,SuccessResult,TargetBinding } from "@gef-bootstrap/contracts";
import { createGefError,internalError } from "./errors.js";
import { LifecycleRecorder } from "./lifecycle.js";
import type { RuntimeIdentity,RuntimePorts } from "./ports.js";
import { canonicalCommandIdPattern,type CommandRegistration,CommandRegistry } from "./registry.js";
import type { ExecutionContext } from "./runtime-types.js";

export interface KernelRuntimeOptions {
  readonly capabilities?: ReadonlySet<string> | readonly string[];
  readonly maxConcurrentReads?: number;
  readonly identity?: RuntimeIdentity;
}

class AsyncLimiter {
  readonly #limit:number;
  #active=0;
  readonly #queue:Array<() => void>=[];
  constructor(limit:number){this.#limit=Math.max(1,Math.floor(limit));}
  async run<T>(task:()=>Promise<T>):Promise<T>{
    if(this.#active>=this.#limit)await new Promise<void>(resolve=>this.#queue.push(resolve));
    this.#active+=1;
    try{return await task();}
    finally{
      this.#active-=1;
      this.#queue.shift()?.();
    }
  }
}

class AsyncMutex {
  #tail:Promise<void>=Promise.resolve();
  async run<T>(task:()=>Promise<T>):Promise<T>{
    let release!:()=>void;
    const next=new Promise<void>(resolve=>{release=resolve;});
    const previous=this.#tail;
    this.#tail=next;
    await previous;
    try{return await task();}
    finally{release();}
  }
}

function frozenCapabilities(input?:ReadonlySet<string>|readonly string[]):ReadonlySet<string>{return new Set(input instanceof Set?input:input??[]);}
function defaultIdentity():RuntimeIdentity{return Object.freeze({productVersion:"0.0.0-dev",nodeVersion:process.version,platform:process.platform,architecture:process.arch});}
function lifecycleTerminalFor(error:GefError,preferred?:Exclude<LifecycleTerminal,"SUCCEEDED">):Exclude<LifecycleTerminal,"SUCCEEDED">{if(preferred)return preferred;if(error.category==="CANCELLED")return"CANCELLED";if(error.category==="TIMEOUT")return"TIMED_OUT";if(["POLICY","AUTHORIZATION","PRECONDITION","CAPABILITY","DEPENDENCY","INPUT"].includes(error.category))return"BLOCKED";if(error.recoverability==="RECOVERY_REQUIRED"||error.recoverability==="MANUAL_REPAIR_REQUIRED")return"RECOVERY_REQUIRED";if(error.recoverability==="IRREVERSIBLE_EFFECT_RECORDED"||error.effectStatus==="PARTIAL"||error.effectStatus==="IRREVERSIBLE")return"PARTIAL_EXTERNAL_EFFECT";return"FAILED";}

export class KernelRuntime {
  readonly #registry:CommandRegistry;
  readonly #ports:RuntimePorts;
  readonly #capabilities:ReadonlySet<string>;
  readonly #identity:RuntimeIdentity;
  readonly #readLimiter:AsyncLimiter;
  readonly #mutationMutex=new AsyncMutex();

  constructor(registry:CommandRegistry,ports:RuntimePorts,options:KernelRuntimeOptions={}){
    this.#registry=registry;
    this.#ports=ports;
    this.#capabilities=frozenCapabilities(options.capabilities);
    this.#identity=Object.freeze({...defaultIdentity(),...options.identity});
    this.#readLimiter=new AsyncLimiter(options.maxConcurrentReads??8);
  }

  introspect(){return this.#registry.introspect();}
  runtimeIdentity():RuntimeIdentity{return this.#identity;}

  async execute<T=unknown>(request:CommandRequest):Promise<GefResult<T>>{
    const runId=this.#ports.ids.nextId("run");
    const lifecycle=new LifecycleRecorder({runId,...(request.parentRunId===undefined?{}:{parentRunId:request.parentRunId}),commandId:request.commandId,...(request.targetRef===undefined?{}:{targetRef:request.targetRef}),clock:this.#ports.clock,...(this.#ports.telemetry===undefined?{}:{telemetry:this.#ports.telemetry})});
    const fail=(error:GefError,terminal?:Exclude<LifecycleTerminal,"SUCCEEDED">,effectStatus?:EffectStatus):FailureResult=>({ok:false,error,lifecycle:lifecycle.finish({terminal:lifecycleTerminalFor(error,terminal),effectStatus:effectStatus??error.effectStatus})});
    try{
      lifecycle.enter("VALIDATING");
      const registration=this.#resolveRegistration(request,runId,lifecycle.currentPhase);
      if(!registration.ok)return fail(registration.error);
      const validated=registration.value.validateInput(request.input);
      if(!validated.ok)return fail(createGefError({id:this.#ports.ids.nextId("err"),category:"INPUT",reason:"invalid_request",severity:"ERROR",summary:"Command input failed validation",retryability:"NEVER",recoverability:"NONE_REQUIRED",lifecyclePhase:lifecycle.currentPhase,terminal:"BLOCKED",commandId:request.commandId,runId,metadata:validated.metadata??{reason:validated.reason}}));

      lifecycle.enter("PREFLIGHTING");
      const preflight=await this.#preflight(registration.value,request,runId,lifecycle.currentPhase);
      if(!preflight.ok)return fail(preflight.error);

      lifecycle.enter("READY");
      const interruption=this.#interruption(request,runId,lifecycle.currentPhase);
      if(interruption)return fail(interruption);
      lifecycle.enter("EXECUTING");

      const context:ExecutionContext=Object.freeze({runId,...(request.parentRunId===undefined?{}:{parentRunId:request.parentRunId}),commandId:request.commandId,contractVersion:request.contractVersion,capabilities:this.#capabilities,...(preflight.target===undefined?{}:{target:preflight.target}),...(request.signal===undefined?{}:{signal:request.signal}),...(request.deadlineMs===undefined?{}:{deadlineMs:request.deadlineMs}),identity:this.#identity,ports:this.#ports});
      const invoke=async()=>await registration.value.handler(validated.value,context) as HandlerOutcome<T>;
      const outcome=registration.value.mutation?await this.#mutationMutex.run(invoke):await this.#readLimiter.run(invoke);
      if(!outcome.ok)return fail(outcome.error,outcome.terminal,outcome.effectStatus);

      const effectStatus=outcome.effectStatus??(registration.value.mutation?"CONFIRMED":"NONE");
      let receiptRef:string|undefined;
      if(registration.value.mutation){
        lifecycle.enter("VERIFYING");
        const verifyInterruption=this.#interruption(request,runId,lifecycle.currentPhase);
        if(verifyInterruption)return fail(verifyInterruption,undefined,effectStatus);
        if(!this.#ports.verification)return fail(this.#missingPort("verification",request.commandId,runId,lifecycle.currentPhase),"BLOCKED",effectStatus);
        const verified=await this.#ports.verification.verify({runId,commandId:request.commandId,...(preflight.target===undefined?{}:{target:preflight.target}),value:outcome.value,effectStatus,...(request.signal===undefined?{}:{signal:request.signal}),...(request.deadlineMs===undefined?{}:{deadlineMs:request.deadlineMs})});
        if(!verified.ok)return fail(verified.error,undefined,effectStatus);

        lifecycle.enter("RECEIPTING");
        const receiptInterruption=this.#interruption(request,runId,lifecycle.currentPhase);
        if(receiptInterruption)return fail(receiptInterruption,undefined,effectStatus);
        if(!this.#ports.receipts)return fail(this.#missingPort("receipt",request.commandId,runId,lifecycle.currentPhase),"RECOVERY_REQUIRED",effectStatus);
        const receipt=await this.#ports.receipts.write({runId,commandId:request.commandId,...(preflight.target===undefined?{}:{target:preflight.target}),value:outcome.value,effectStatus,lifecyclePhases:lifecycle.phases,...(request.signal===undefined?{}:{signal:request.signal}),...(request.deadlineMs===undefined?{}:{deadlineMs:request.deadlineMs})});
        if(!receipt.ok)return fail(receipt.error,"RECOVERY_REQUIRED",effectStatus);
        receiptRef=receipt.receiptRef;
      }
      const success:SuccessResult<T>={ok:true,value:outcome.value,lifecycle:lifecycle.finish({terminal:"SUCCEEDED",effectStatus,...(receiptRef===undefined?{}:{receiptRef})})};
      return success;
    }catch(_cause:unknown){return fail(internalError({id:this.#ports.ids.nextId("err"),runId,commandId:request.commandId,phase:lifecycle.currentPhase}));}
  }

  #resolveRegistration(request:CommandRequest,runId:string,phase:import("@gef-bootstrap/contracts").LifecyclePhase):{readonly ok:true;readonly value:CommandRegistration}|{readonly ok:false;readonly error:GefError}{if(!canonicalCommandIdPattern.test(request.commandId))return{ok:false,error:createGefError({id:this.#ports.ids.nextId("err"),category:"INPUT",reason:"invalid_command_id",severity:"ERROR",summary:"Command ID is not canonical",retryability:"NEVER",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"BLOCKED",commandId:request.commandId,runId})};const registration=this.#registry.get(request.commandId);if(!registration)return{ok:false,error:createGefError({id:this.#ports.ids.nextId("err"),category:"INPUT",reason:"command_not_found",severity:"ERROR",summary:"Command is not registered",retryability:"NEVER",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"BLOCKED",commandId:request.commandId,runId})};if(registration.contractVersion!==request.contractVersion)return{ok:false,error:createGefError({id:this.#ports.ids.nextId("err"),category:"PRECONDITION",reason:"contract_version_incompatible",severity:"ERROR",summary:"Command contract version is incompatible",retryability:"NEVER",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"BLOCKED",commandId:request.commandId,runId,metadata:{requested:request.contractVersion,supported:registration.contractVersion}})};return{ok:true,value:registration};}
  async #preflight(registration:CommandRegistration,request:CommandRequest,runId:string,phase:import("@gef-bootstrap/contracts").LifecyclePhase):Promise<{readonly ok:true;readonly target?:TargetBinding}|{readonly ok:false;readonly error:GefError}>{const interruption=this.#interruption(request,runId,phase);if(interruption)return{ok:false,error:interruption};for(const capability of registration.requiredCapabilities??[]){if(!this.#capabilities.has(capability))return{ok:false,error:createGefError({id:this.#ports.ids.nextId("err"),category:"CAPABILITY",reason:"missing",severity:"ERROR",summary:"Required capability is unavailable",retryability:"MANUAL_ONLY",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"BLOCKED",commandId:request.commandId,runId,metadata:{capability},remediations:[{actionId:"gef.capability.enable",parameters:{capability}}]})};}if(this.#ports.policy){const checked=await this.#ports.policy.check({runId,commandId:request.commandId,...(request.authorizationRef===undefined?{}:{authorizationRef:request.authorizationRef}),mutation:registration.mutation??false,...(registration.securityClass===undefined?{}:{securityClass:registration.securityClass})});if(!checked.ok)return checked;}let target:TargetBinding|undefined;if(registration.requiresTarget){if(!this.#ports.targetBinding)return{ok:false,error:this.#missingPort("target_binding",request.commandId,runId,phase)};const bound=await this.#ports.targetBinding.bind(request);if(!bound.ok)return bound;target=bound.target;if(request.expectedState!==undefined&&target.stateFingerprint!==request.expectedState)return{ok:false,error:createGefError({id:this.#ports.ids.nextId("err"),category:"PRECONDITION",reason:"stale_target",severity:"ERROR",summary:"Target state does not match the expected fingerprint",retryability:"NEVER",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"BLOCKED",commandId:request.commandId,runId,targetRef:target.targetRef})};}return target===undefined?{ok:true}:{ok:true,target};}
  #interruption(request:CommandRequest,runId:string,phase:import("@gef-bootstrap/contracts").LifecyclePhase):GefError|undefined{if(request.signal?.aborted)return createGefError({id:this.#ports.ids.nextId("err"),category:"CANCELLED",reason:"operator",severity:"WARNING",summary:"Operation was cancelled",retryability:"MANUAL_ONLY",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"CANCELLED",commandId:request.commandId,runId});if(request.deadlineMs!==undefined&&this.#ports.clock.nowMs()>=request.deadlineMs)return createGefError({id:this.#ports.ids.nextId("err"),category:"TIMEOUT",reason:"operation",severity:"WARNING",summary:"Operation deadline expired",retryability:"MANUAL_ONLY",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"TIMED_OUT",commandId:request.commandId,runId});return undefined;}
  #missingPort(port:string,commandId:string,runId:string,phase:import("@gef-bootstrap/contracts").LifecyclePhase):GefError{return createGefError({id:this.#ports.ids.nextId("err"),category:"CAPABILITY",reason:"missing",severity:"ERROR",summary:"Required runtime port is unavailable",retryability:"MANUAL_ONLY",recoverability:"NONE_REQUIRED",lifecyclePhase:phase,terminal:"BLOCKED",commandId,runId,metadata:{port}});}
}
