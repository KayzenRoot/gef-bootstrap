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
    if (entry.kind === "BINARY_COPY") bytes = thawBytes(entry.sourceBytes);
    else {
      const selection = selectionMap.get(entry.entryId);
      if (!selection) return fail("RENDER_SELECTION_MISSING", "RENDERING", "TEXT_TEMPLATE entry has no compatible selection.", entry.entryId);
      let logicalText = "";
      for (const token of selection.selectedTokens) {
        if (token.kind === "LITERAL") logicalText += token.text;
        else if (token.kind === "VAR") {
          const value = boundProjection(variableMap.get(token.id), "TEXT_CONTENT");
          if (!value.ok) return value;
          logicalText += value.value;
        } else if (token.kind === "LITERAL_OPEN") logicalText += RESERVED_INTRODUCER;
        else return fail("RENDER_CONTROL_TOKEN_LEAK", "RENDERING", "Condition control token reached byte rendering.", entry.entryId);
      }
      bytes = encodeUtf8(applyLineEndings(logicalText, entry.lineEndings ?? "PRESERVE_SOURCE"));
    }
    if (bytes.byteLength > control.budgets.maxRenderedBytesPerEntry) return fail("RENDER_ENTRY_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact exceeds the per-entry byte budget.", entry.entryId);
    totalBytes += bytes.byteLength;
    if (totalBytes > control.budgets.maxRenderedBytesTotal) return fail("RENDER_TOTAL_BUDGET_EXCEEDED", "RENDERING", "Rendered artifact set exceeds the aggregate byte budget.");
    artifacts.push(Object.freeze({ entryId: entry.entryId, kind: entry.kind, logicalTarget: target.value, renderedTargetDigest: digest.digest(target.value), renderedContentDigest: digest.digest(bytes), byteLength: bytes.byteLength, content: freezeBytes(bytes) }));
  }
  artifacts.sort((a, b) => a.entryId.localeCompare(b.entryId));
  const identity = artifacts.map((item) => ({ entryId: item.entryId, kind: item.kind, logicalTarget: item.logicalTarget, renderedTargetDigest: item.renderedTargetDigest, renderedContentDigest: item.renderedContentDigest, byteLength: item.byteLength }));
  const renderSnapshotDigest = digest.digest(stableStringify({ templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, conditionalDecisionDigest: conditions.conditionalDecisionDigest, artifacts: identity }));
  return { ok: true, value: Object.freeze({ templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, conditionalDecisionDigest: conditions.conditionalDecisionDigest, artifacts: Object.freeze(artifacts), renderSnapshotDigest, gaps: Object.freeze([]) }) };
}
