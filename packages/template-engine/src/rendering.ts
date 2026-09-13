import { measureRenderedUtf8Bytes } from "./render-budget.js";
import { applyLineEndings, boundProjection, renderLogicalTarget } from "./render-helpers.js";
import { checkControl, encodeUtf8, fail, freezeBytes, stableStringify, thawBytes } from "./runtime.js";
import type { ConditionalSelectionSnapshot, DigestPort, RenderArtifact, RenderSnapshot, TemplateControl, TemplateDescriptor, TemplateResult, VariableResolutionSnapshot } from "./types.js";

const RESERVED_INTRODUCER = "{{" + "gef:";

export function renderTemplate(template: TemplateDescriptor, variables: VariableResolutionSnapshot, conditions: ConditionalSelectionSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<RenderSnapshot> {
  const gate = checkControl(control, "RENDERING");
  if (!gate.ok) return gate;
  if (!template || !variables || !conditions || template.templateSemanticDigest !== variables.templateSemanticDigest || template.templateSemanticDigest !== conditions.templateSemanticDigest || variables.variableValueDigest !== conditions.variableValueDigest) return fail("RENDER_INPUT_MISMATCH", "RENDERING", "S01/S02/S03 snapshots are incompatible.");
  const variableMap = new Map(variables.entries.map((item) => [item.id, item] as const));
  const selectionMap = new Map(conditions.entries.map((item) => [item.entryId, item] as const));
  const artifacts: RenderArtifact[] = [];
  let totalBytes = 0;

  for (const entry of template.entries) {
    const controlGate = checkControl(control, "RENDERING");
    if (!controlGate.ok) return controlGate;
    const target = renderLogicalTarget(entry.targetPattern, variableMap, control);
    if (!target.ok) return target;

    let bytes: Uint8Array;
    if (entry.kind === "BINARY_COPY") {
      const measured = entry.sourceBytes.length;
      if (measured > control.budgets.maxRenderedBytesPerEntry) return fail("RENDER_ENTRY_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact exceeds the per-entry byte budget.", entry.entryId);
      if (totalBytes + measured > control.budgets.maxRenderedBytesTotal) return fail("RENDER_TOTAL_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact set exceeds the aggregate byte budget.");
      bytes = thawBytes(entry.sourceBytes);
    } else {
      const selection = selectionMap.get(entry.entryId);
      if (!selection) return fail("RENDER_SELECTION_MISSING", "RENDERING", "TEXT_TEMPLATE entry has no compatible selection.", entry.entryId);
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
  const renderSnapshotDigest = digest.digest(stableStringify({ templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, conditionalDecisionDigest: conditions.conditionalDecisionDigest, artifacts: identity }));
  return { ok: true, value: Object.freeze({ templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, conditionalDecisionDigest: conditions.conditionalDecisionDigest, artifacts: Object.freeze(artifacts), renderSnapshotDigest, gaps: Object.freeze([]) }) };
}
