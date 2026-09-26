import type { EffectStatus, ErrorCategory, ErrorCause, GefError, LifecyclePhase, LifecycleTerminal, Recoverability, RemediationAction, Retryability, RuntimeSeverity } from "@gef-bootstrap/contracts";

const SECRET_KEY = /(secret|token|password|passwd|api[_-]?key|authorization|credential|private[_-]?key)/i;
const MAX_CAUSES = 8;

export function redactText(text: string): string {
  return text
    .replace(/(bearer\s+)[^\s]+/gi, "$1[REDACTED]")
    .replace(/(token|password|passwd|secret|api[_-]?key|authorization|credential)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
}

export interface ErrorInput {
  readonly id: string;
  readonly category: ErrorCategory;
  readonly reason: string;
  readonly severity: RuntimeSeverity;
  readonly summary: string;
  readonly retryability: Retryability;
  readonly recoverability: Recoverability;
  readonly effectStatus?: EffectStatus;
  readonly lifecyclePhase?: LifecyclePhase;
  readonly terminal?: Exclude<LifecycleTerminal, "SUCCEEDED">;
  readonly commandId?: string;
  readonly runId?: string;
  readonly targetRef?: string;
  readonly causes?: readonly ErrorCause[];
  readonly evidenceRefs?: readonly string[];
  readonly remediations?: readonly RemediationAction[];
  readonly diagnosticRef?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

function reasonCode(category: ErrorCategory, reason: string): string {
  if (!/^[a-z0-9][a-z0-9_]*(?:\.[a-z0-9][a-z0-9_]*)*$/.test(reason)) throw new TypeError(`Invalid error reason token: ${reason}`);
  return `gef.${category.toLowerCase()}.${reason}`;
}

export function redactUnknown(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[CYCLE]";
  seen.add(value);
  if (Array.isArray(value)) return Object.freeze(value.map((item) => redactUnknown(item, seen)));
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) output[key] = SECRET_KEY.test(key) ? "[REDACTED]" : redactUnknown(nested, seen);
  return Object.freeze(output);
}

export function normalizeCauses(causes: readonly ErrorCause[] = []): readonly ErrorCause[] {
  const ids = new Set<string>();
  const output: ErrorCause[] = [];
  for (const cause of causes) {
    if (output.length >= MAX_CAUSES || ids.has(cause.id)) continue;
    ids.add(cause.id);
    output.push(Object.freeze({ id: cause.id, reasonCode: cause.reasonCode, summary: redactText(cause.summary) }));
  }
  return Object.freeze(output);
}

export function createGefError(input: ErrorInput): GefError {
  const metadata = (redactUnknown(input.metadata ?? {}) ?? {}) as Readonly<Record<string, unknown>>;
  const base = {
    schemaVersion: 1 as const,
    id: input.id,
    category: input.category,
    reasonCode: reasonCode(input.category, input.reason),
    severity: input.severity,
    summary: redactText(input.summary),
    retryability: input.retryability,
    recoverability: input.recoverability,
    effectStatus: input.effectStatus ?? "NONE",
    causes: normalizeCauses(input.causes),
    evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])]),
    remediations: Object.freeze((input.remediations ?? []).map((action) => Object.freeze({ actionId: action.actionId, ...(action.parameters === undefined ? {} : { parameters: redactUnknown(action.parameters) as Readonly<Record<string, unknown>> }) }))),
    metadata,
  };
  return Object.freeze({ ...base,
    ...(input.lifecyclePhase === undefined ? {} : { lifecyclePhase: input.lifecyclePhase }),
    ...(input.terminal === undefined ? {} : { terminal: input.terminal }),
    ...(input.commandId === undefined ? {} : { commandId: input.commandId }),
    ...(input.runId === undefined ? {} : { runId: input.runId }),
    ...(input.targetRef === undefined ? {} : { targetRef: input.targetRef }),
    ...(input.diagnosticRef === undefined ? {} : { diagnosticRef: input.diagnosticRef }),
  });
}

export function internalError(params: { readonly id: string; readonly runId: string; readonly commandId: string; readonly phase: LifecyclePhase; readonly diagnosticRef?: string }): GefError {
  return createGefError({ id: params.id, category: "INTERNAL", reason: "unexpected", severity: "ERROR", summary: "Unexpected internal failure", retryability: "MANUAL_ONLY", recoverability: "NONE_REQUIRED", lifecyclePhase: params.phase, terminal: "FAILED", commandId: params.commandId, runId: params.runId, ...(params.diagnosticRef === undefined ? {} : { diagnosticRef: params.diagnosticRef }) });
}
