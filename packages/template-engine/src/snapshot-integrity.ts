import { CONDITION_CONTRACT_VERSION, stableStringify, VARIABLE_CONTRACT_VERSION } from "./runtime.js";
import type { ConditionalSelectionSnapshot, DigestPort, TemplateResult, VariableResolutionSnapshot } from "./types.js";
import { fail } from "./runtime.js";

export function expectedVariableValueDigest(snapshot: VariableResolutionSnapshot, digest: DigestPort): string {
  const values = snapshot.entries.map((item) => ({ id: item.id, type: item.type, status: item.status, value: item.value }));
  return digest.digest(stableStringify({ templateSemanticDigest: snapshot.templateSemanticDigest, values }));
}

export function verifyVariableSnapshot(snapshot: VariableResolutionSnapshot, digest: DigestPort): TemplateResult<true> {
  if (snapshot.variableContractVersion !== VARIABLE_CONTRACT_VERSION) return fail("VARIABLE_SNAPSHOT_VERSION_MISMATCH", "VARIABLES", "Variable snapshot contract version is incompatible.");
  if (expectedVariableValueDigest(snapshot, digest) !== snapshot.variableValueDigest) return fail("VARIABLE_SNAPSHOT_DIGEST_MISMATCH", "VARIABLES", "Variable snapshot value identity is inconsistent.");
  return { ok: true, value: true };
}

export function expectedConditionalDecisionDigest(snapshot: ConditionalSelectionSnapshot, digest: DigestPort): string {
  const decisionShape = snapshot.entries.map((entry) => ({
    entryId: entry.entryId,
    conditionTreeDigest: entry.conditionTreeDigest,
    decisions: entry.decisions,
    selectedTokens: entry.selectedTokens,
  }));
  return digest.digest(stableStringify({
    conditionContractVersion: snapshot.conditionContractVersion,
    templateSemanticDigest: snapshot.templateSemanticDigest,
    variableValueDigest: snapshot.variableValueDigest,
    decisionShape,
    evaluatedConditionRefs: snapshot.evaluatedConditionRefs,
  }));
}

export function verifyConditionalSnapshot(snapshot: ConditionalSelectionSnapshot, digest: DigestPort): TemplateResult<true> {
  if (snapshot.conditionContractVersion !== CONDITION_CONTRACT_VERSION) return fail("CONDITION_SNAPSHOT_VERSION_MISMATCH", "CONDITIONS", "Conditional snapshot contract version is incompatible.");
  if (expectedConditionalDecisionDigest(snapshot, digest) !== snapshot.conditionalDecisionDigest) return fail("CONDITION_SNAPSHOT_DIGEST_MISMATCH", "CONDITIONS", "Conditional snapshot identity is inconsistent.");
  return { ok: true, value: true };
}
