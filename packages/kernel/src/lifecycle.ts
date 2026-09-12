import type { EffectStatus, LifecyclePhase, LifecycleSnapshot, LifecycleTerminal, RuntimeEvent } from "@gef-bootstrap/contracts";
import type { ClockPort, TelemetryPort } from "./ports.js";
const order: readonly LifecyclePhase[] = ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"];

export class LifecycleRecorder {
  readonly #runId: string; readonly #parentRunId: string | undefined; readonly #commandId: string; readonly #targetRef: string | undefined; readonly #clock: ClockPort; readonly #telemetry: TelemetryPort | undefined; readonly #phases: LifecyclePhase[] = []; readonly #startedAtMs: number; #terminal: LifecycleSnapshot | undefined;
  constructor(params: { runId: string; parentRunId?: string; commandId: string; targetRef?: string; clock: ClockPort; telemetry?: TelemetryPort }) {
    this.#runId=params.runId; this.#parentRunId=params.parentRunId; this.#commandId=params.commandId; this.#targetRef=params.targetRef; this.#clock=params.clock; this.#telemetry=params.telemetry; this.#startedAtMs=params.clock.nowMs(); this.enter("RECEIVED");
  }
  get currentPhase(): LifecyclePhase { return this.#phases[this.#phases.length-1] ?? "RECEIVED"; }
  get phases(): readonly LifecyclePhase[] { return Object.freeze([...this.#phases]); }
  enter(phase: LifecyclePhase): void {
    if (this.#terminal) throw new Error("Lifecycle is already terminal");
    const previousIndex=this.#phases.length===0?-1:order.indexOf(this.currentPhase); const nextIndex=order.indexOf(phase);
    if(nextIndex<previousIndex) throw new Error(`Lifecycle regression ${this.currentPhase} -> ${phase}`);
    if(nextIndex===previousIndex && this.#phases.length>0) return;
    this.#phases.push(phase); this.#emit("PHASE", phase);
  }
  finish(params:{terminal:LifecycleTerminal;effectStatus?:EffectStatus;receiptRef?:string}):LifecycleSnapshot {
    if(this.#terminal) return this.#terminal;
    const snapshot:LifecycleSnapshot=Object.freeze({runId:this.#runId,...(this.#parentRunId===undefined?{}:{parentRunId:this.#parentRunId}),commandId:this.#commandId,phases:Object.freeze([...this.#phases]),terminal:params.terminal,startedAtMs:this.#startedAtMs,endedAtMs:this.#clock.nowMs(),effectStatus:params.effectStatus??"NONE",...(this.#targetRef===undefined?{}:{targetRef:this.#targetRef}),...(params.receiptRef===undefined?{}:{receiptRef:params.receiptRef})});
    this.#terminal=snapshot; this.#emit("TERMINAL",params.terminal); return snapshot;
  }
  #emit(event:RuntimeEvent["event"],phase:LifecyclePhase|LifecycleTerminal):void { this.#telemetry?.emit(Object.freeze({runId:this.#runId,commandId:this.#commandId,phase,event,timestampMs:this.#clock.nowMs()})); }
}
