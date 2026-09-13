import { asciiFoldTarget, checkControl, fail, freezeBytes, stableStringify, validateLogicalFileTarget } from "./runtime.js";
import type { DesiredArtifact, DigestPort, RenderSnapshot, TemplateControl, TemplateDescriptor, TemplateResult, TemplateValidationSnapshot } from "./types.js";

function validationSnapshot(render: RenderSnapshot, digest: DigestPort, outcome: TemplateValidationSnapshot["outcome"], artifacts: readonly DesiredArtifact[], gaps: readonly string[]): TemplateValidationSnapshot {
  const identity = artifacts.map((item) => ({ entryId: item.entryId, kind: item.kind, logicalTarget: item.logicalTarget, targetCollisionKey: item.targetCollisionKey, renderedTargetDigest: item.renderedTargetDigest, renderedContentDigest: item.renderedContentDigest, byteLength: item.byteLength }));
  const templateValidationDigest = digest.digest(stableStringify({ renderSnapshotDigest: render.renderSnapshotDigest, validationContractVersion: "1.0", outcome, artifacts: identity, gaps }));
  return Object.freeze({ outcome, renderSnapshotDigest: render.renderSnapshotDigest, artifacts: Object.freeze([...artifacts]), downstreamRequirements: Object.freeze(["M05_CURRENT_STATE_CLASSIFICATION", "M06_PHYSICAL_PATH_AUTHORITY"]), templateValidationDigest, gaps: Object.freeze([...gaps]) });
}

function blocked(render: RenderSnapshot, digest: DigestPort, code: string): TemplateResult<TemplateValidationSnapshot> {
  return { ok: true, value: validationSnapshot(render, digest, "BLOCKED", [], [code]) };
}

function validByteArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isInteger(item) && item >= 0 && item <= 255);
}

export function validateTemplate(template: TemplateDescriptor, render: RenderSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<TemplateValidationSnapshot> {
  const gate = checkControl(control, "VALIDATION");
  if (!gate.ok) return gate;
  if (!template || !render || template.templateSemanticDigest !== render.templateSemanticDigest || !Array.isArray(template.entries) || !Array.isArray(render.artifacts)) return fail("VALIDATION_INPUT_MISMATCH", "VALIDATION", "Template and render snapshots are incompatible.");
  if (render.gaps.length > 0) return { ok: true, value: validationSnapshot(render, digest, "INDETERMINATE", [], ["RENDER_MANDATORY_GAP"]) };
  if (render.artifacts.length !== template.entries.length) return blocked(render, digest, "ARTIFACT_ACCOUNTING_MISMATCH");

  const expectedEntries = new Map(template.entries.map((item) => [item.entryId, item] as const));
  const seenEntries = new Set<string>();
  const desired: DesiredArtifact[] = [];

  for (const artifact of render.artifacts) {
    const controlGate = checkControl(control, "VALIDATION");
    if (!controlGate.ok) return controlGate;
    if (!artifact || typeof artifact.entryId !== "string" || seenEntries.has(artifact.entryId)) return blocked(render, digest, "ARTIFACT_ENTRY_DUPLICATE_OR_INVALID");
    seenEntries.add(artifact.entryId);
    const expected = expectedEntries.get(artifact.entryId);
    if (!expected || expected.kind !== artifact.kind) return blocked(render, digest, "ARTIFACT_ENTRY_UNKNOWN_OR_KIND_MISMATCH");
    if (typeof artifact.logicalTarget !== "string" || !validateLogicalFileTarget(artifact.logicalTarget, control.budgets)) return blocked(render, digest, "LOGICAL_TARGET_INVALID");
    if (!validByteArray(artifact.content)) return blocked(render, digest, "RENDER_CONTENT_INVALID");
    const bytes = Uint8Array.from(artifact.content);
    if (artifact.byteLength !== bytes.byteLength) return blocked(render, digest, "RENDER_LENGTH_MISMATCH");
    if (artifact.renderedTargetDigest !== digest.digest(artifact.logicalTarget)) return blocked(render, digest, "RENDER_TARGET_DIGEST_MISMATCH");
    if (artifact.renderedContentDigest !== digest.digest(bytes)) return blocked(render, digest, "RENDER_CONTENT_DIGEST_MISMATCH");
    desired.push(Object.freeze({ entryId: artifact.entryId, kind: artifact.kind, logicalTarget: artifact.logicalTarget, targetCollisionKey: asciiFoldTarget(artifact.logicalTarget), renderedTargetDigest: artifact.renderedTargetDigest, renderedContentDigest: artifact.renderedContentDigest, byteLength: artifact.byteLength, contentRef: freezeBytes(bytes) }));
  }

  const renderIdentity = [...render.artifacts].sort((a, b) => a.entryId.localeCompare(b.entryId)).map((item) => ({ entryId: item.entryId, kind: item.kind, logicalTarget: item.logicalTarget, renderedTargetDigest: item.renderedTargetDigest, renderedContentDigest: item.renderedContentDigest, byteLength: item.byteLength }));
  const expectedRenderDigest = digest.digest(stableStringify({ templateSemanticDigest: render.templateSemanticDigest, variableValueDigest: render.variableValueDigest, conditionalDecisionDigest: render.conditionalDecisionDigest, artifacts: renderIdentity }));
  if (expectedRenderDigest !== render.renderSnapshotDigest) return blocked(render, digest, "RENDER_SNAPSHOT_DIGEST_MISMATCH");

  const exact = new Map<string, string>();
  const folded = new Map<string, string>();
  for (const item of desired) {
    if (exact.has(item.logicalTarget)) return blocked(render, digest, "TARGET_DUPLICATE");
    if (folded.has(item.targetCollisionKey)) return blocked(render, digest, "TARGET_CASE_ALIAS_COLLISION");
    exact.set(item.logicalTarget, item.entryId);
    folded.set(item.targetCollisionKey, item.entryId);
  }
  for (const item of desired) {
    const parts = item.logicalTarget.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      const ancestor = parts.slice(0, index).join("/");
      if (exact.has(ancestor) || folded.has(asciiFoldTarget(ancestor))) return blocked(render, digest, "TARGET_ANCESTOR_DESCENDANT_COLLISION");
    }
  }
  desired.sort((a, b) => a.entryId.localeCompare(b.entryId));
  if (desired.length > control.budgets.maxEvidenceEntries) return blocked(render, digest, "VALIDATION_EVIDENCE_BUDGET_EXCEEDED");
  return { ok: true, value: validationSnapshot(render, digest, "VALIDATED_FOR_EFFECT_PLANNING", desired, []) };
}
