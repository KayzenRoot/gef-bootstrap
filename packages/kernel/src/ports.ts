import type {
  CommandRequest,
  GefError,
  ReceiptRequest,
  RuntimeEvent,
  TargetBinding,
  VerificationRequest,
} from "@gef-bootstrap/contracts";

export interface ClockPort { nowMs(): number; }
export interface IdGeneratorPort { nextId(prefix: string): string; }
export interface TelemetryPort { emit(event: RuntimeEvent): void; }

export interface PolicyCheckContext {
  readonly runId: string;
  readonly commandId: string;
  readonly authorizationRef?: string;
  readonly target?: TargetBinding;
  readonly mutation: boolean;
  readonly securityClass?: string;
}

export type GateResult = { readonly ok: true } | { readonly ok: false; readonly error: GefError };
export interface PolicyPort { check(context: PolicyCheckContext): Promise<GateResult> | GateResult; }
export interface TargetBindingPort {
  bind(request: CommandRequest): Promise<{ readonly ok: true; readonly target: TargetBinding } | { readonly ok: false; readonly error: GefError }> | { readonly ok: true; readonly target: TargetBinding } | { readonly ok: false; readonly error: GefError };
}
export interface VerificationPort { verify<T>(request: VerificationRequest<T>): Promise<GateResult> | GateResult; }
export interface ReceiptPort {
  write<T>(request: ReceiptRequest<T>): Promise<{ readonly ok: true; readonly receiptRef: string } | { readonly ok: false; readonly error: GefError }> | { readonly ok: true; readonly receiptRef: string } | { readonly ok: false; readonly error: GefError };
}
export interface ProcessPort {
  run(spec: { readonly executable: string; readonly argv: readonly string[]; readonly cwd?: string; readonly env?: Readonly<Record<string, string>> }): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }>;
}
export interface RuntimePorts {
  readonly clock: ClockPort;
  readonly ids: IdGeneratorPort;
  readonly telemetry?: TelemetryPort;
  readonly policy?: PolicyPort;
  readonly targetBinding?: TargetBindingPort;
  readonly verification?: VerificationPort;
  readonly receipts?: ReceiptPort;
  readonly process?: ProcessPort;
}
export const systemClock: ClockPort = Object.freeze({ nowMs: () => Date.now() });
