import type { TargetBinding } from "@gef-bootstrap/contracts";
import type { RuntimeIdentity, RuntimePorts } from "./ports.js";

export interface ExecutionContext {
  readonly runId: string;
  readonly parentRunId?: string;
  readonly commandId: string;
  readonly contractVersion: string;
  readonly capabilities: ReadonlySet<string>;
  readonly target?: TargetBinding;
  readonly signal?: AbortSignal;
  readonly deadlineMs?: number;
  readonly identity: RuntimeIdentity;
  readonly ports: RuntimePorts;
}
