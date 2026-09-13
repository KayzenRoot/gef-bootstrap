import type { GefError } from "@gef-bootstrap/contracts";
import type { IdentityDiagnostic } from "./types.js";

export function identityDiagnosticsToGefError(diagnostics: readonly IdentityDiagnostic[], commandId?: string, runId?: string): GefError {
  const first = diagnostics[0];
  return {
    schemaVersion: 1,
    id: `identity:${first?.code ?? "unknown"}`,
    category: first?.severity === "WARNING" ? "PRECONDITION" : "INTEGRITY",
    reasonCode: first?.code ?? "gef.identity.invalid",
    severity: first?.severity === "WARNING" ? "WARNING" : "ERROR",
    summary: first?.summary ?? "Project identity validation failed.",
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    effectStatus: "NONE",
    ...(commandId ? { commandId } : {}),
    ...(runId ? { runId } : {}),
    causes: diagnostics.slice(1, 8).map((item, index) => ({ id: `identity-${index + 1}`, reasonCode: item.code, summary: item.summary })),
    evidenceRefs: [],
    remediations: [{ actionId: "gef.identity.resolve" }],
    metadata: { diagnostics: diagnostics.slice(0, 16).map((item) => ({ code: item.code, severity: item.severity })) },
  };
}
