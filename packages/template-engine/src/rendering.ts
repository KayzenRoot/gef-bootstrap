import { measureRenderedUtf8Bytes } from "./render-budget.js";
import { applyLineEndings, boundProjection, renderLogicalTarget } from "./render-helpers.js";
import { verifyConditionalSnapshot, verifyVariableSnapshot } from "./snapshot-integrity.js";
import { checkControl, encodeUtf8, fail, freezeBytes, RENDER_CONTRACT_VERSION, stableStringify, thawBytes } from "./runtime.js";
import type { ConditionalSelectionSnapshot, DigestPort, RenderArtifact, RenderSnapshot, TemplateControl, TemplateDescriptor, TemplateResult, VariableResolutionSnapshot } from "./types.js";

const RESERVED_INTRODUCER = "{{" + "gef:";

export function renderTemplate(template: TemplateDescriptor, variables: VariableResolutionSnapshot, conditions: ConditionalSelectionSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<RenderSnapshot> {
  const gate = checkControl(control, "RENDERING");
  if (!gate.ok) return gate;
  if (!template || !variables || !conditions || template.templateSemanticDigest !== variables.templateSemanticDigest || template.templateSemanticDigest !== conditions.templateSemanticDigest || variables.variableValueDigest !== conditions.variableValueDigest || !Array.isArray(variables.entries) || !Array.isArray(conditions.entries)) return fail("RENDER_INPUT_MISMATCH", "RENDERING", "S01/S02/S03 snapshots are incompatible.");
  const variableIntegrity = verifyVariableSnapshot(variables, digest);
  if (!variableIntegrity.ok) return fail(variableIntegrity.error.code, "RENDERING", variableIntegrity.error.summary, variableIntegrity.error.ref);
  const conditionIntegrity = verifyConditionalSnapshot(conditions, digest);
  if (!conditionIntegrity.ok) return fail(conditionIntegrity.error.code, "RENDERING", conditionIntegrity.error.summary, conditionIntegrity.error.ref);

  const variableMap = new Map(variables.entries.map((item) => [item.id, item] as const));
  if (variableMap.size !== variables.entries.length) return fail("RENDER_VARIABLE_SNAPSHOT_DUPLICATE", "RENDERING", "Variable snapshot contains duplicate identities.");
  const selectionMap = new Map(conditions.entries.map((item) => [item.entryId, item] as const));
  if (selectionMap.size !== conditions.entries.length || selectionMap.size !== template.entries.length) return fail("RENDER_SELECTION_ACCOUNTING_MISMATCH", "RENDERING", "Conditional selection does not account for every template entry exactly once.");
  for (const selection of conditions.entries) if (!template.entries.some((entry) => entry.entryId === selection.entryId)) return fail("RENDER_SELECTION_UNKNOWN", "RENDERING", "Conditional selection references an unknown template entry.", selection.entryId);

  const artifacts: RenderArtifact[] = [];
  let totalBytes = 0;

  for (const entry of template.entries) {
    const controlGate = checkControl(control, "RENDERING");
    if (!controlGate.ok) return controlGate;
    const selection = selectionMap.get(entry.entryId);
    if (!selection) return fail("RENDER_SELECTION_MISSING", "RENDERING", "Template entry has no compatible conditional selection.", entry.entryId);
    const target = renderLogicalTarget(entry.targetPattern, variableMap, control);
    if (!target.ok) return target;

    let bytes: Uint8Array;
    if (entry.kind === "BINARY_COPY") {
      if (selection.selectedTokens.length !== 0 || selection.decisions.length !== 0) return fail("RENDER_BINARY_SELECTION_INVALID", "RENDERING", "BINARY_COPY cannot carry text or conditional selection state.", entry.entryId);
      const measured = entry.sourceBytes.length;
      if (measured > control.budgets.maxRenderedBytesPerEntry) return fail("RENDER_ENTRY_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact exceeds the per-entry byte budget.", entry.entryId);
      if (totalBytes + measured > control.budgets.maxRenderedBytesTotal) return fail("RENDER_TOTAL_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact set exceeds the aggregate byte budget.");
      bytes = thawBytes(entry.sourceBytes);
    } else {
      const chunks: string[] = [];
      for (const token of selection.selectedTokens) {
        const tokenGate = checkControl(control, "RENDERING");
        if (!tokenGate.ok) return tokenGate;
        if (token.kind === "LITERAL") chunks.push(token.text);
        else if (token.kind === "VAR") {
          const value = boundProjection(variableMap.get(token.id), "TEXT_CONTENT");
          if (!value.ok) return value;
          chunks.push(value.value);
        } else if (token.kind === "LITERAL_OPEN") chunks.push(RESERVED_INTRODUCER);
        else return fail("RENDER_CONTROL_TOKEN_LEAK", "RENDERING", "Condition control token reached byte rendering.", entry.entryId);
      }

      const policy = entry.lineEndings ?? "PRESERVE_SOURCE";
      const measured = measureRenderedUtf8Bytes(chunks, policy, control.budgets.maxRenderedBytesPerEntry);
      if (measured > control.budgets.maxRenderedBytesPerEntry) return fail("RENDER_ENTRY_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact exceeds the per-entry byte budget.", entry.entryId);
      if (totalBytes + measured > control.budgets.maxRenderedBytesTotal) return fail("RENDER_TOTAL_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact set exceeds the aggregate byte budget.");

      const logicalText = chunks.join("");
      bytes = encodeUtf8(applyLineEndings(logicalText, policy));
      if (bytes.byteLength !== measured) return fail("RENDER_MEASUREMENT_MISMATCH", "RENDERING", "Rendered byte measurement disagrees with materialized output.", entry.entryId);
    }

    totalBytes += bytes.byteLength;
    const renderedTargetDigest = digest.digest(target.value);
    const renderedContentDigest = digest.digest(bytes);
    artifacts.push(Object.freeze({ entryId: entry.entryId, kind: entry.kind, logicalTarget: target.value, renderedTargetDigest, renderedContentDigest, byteLength: bytes.byteLength, content: freezeBytes(bytes) }));
  }
  artifacts.sort((a, b) => a.entryId.localeCompare(b.entryId));
  const identity = artifacts.map((item) => ({ entryId: item.entryId, kind: item.kind, logicalTarget: item.logicalTarget, renderedTargetDigest: item.renderedTargetDigest, renderedContentDigest: item.renderedContentDigest, byteLength: item.byteLength }));
  const renderSnapshotDigest = digest.digest(stableStringify({ renderContractVersion: RENDER_CONTRACT_VERSION, templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, conditionalDecisionDigest: conditions.conditionalDecisionDigest, artifacts: identity }));
  return { ok: true, value: Object.freeze({ renderContractVersion: RENDER_CONTRACT_VERSION, templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, conditionalDecisionDigest: conditions.conditionalDecisionDigest, artifacts: Object.freeze(artifacts), renderSnapshotDigest, gaps: Object.freeze([]) }) };
}
