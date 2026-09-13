import { verifyVariableSnapshot } from "./snapshot-integrity.js";
import { checkControl, CONDITION_CONTRACT_VERSION, fail, stableStringify } from "./runtime.js";
import type {
  ConditionDecision,
  ConditionalSelectionSnapshot,
  DigestPort,
  SelectedTemplateEntry,
  TemplateControl,
  TemplateDescriptor,
  TemplateResult,
  TemplateToken,
  VariableResolutionEntry,
  VariableResolutionSnapshot,
} from "./types.js";

type LeafToken = Extract<TemplateToken, { kind: "LITERAL" | "VAR" | "LITERAL_OPEN" }>;
interface ConditionNode {
  readonly kind: "CONDITION";
  readonly nodeId: string;
  readonly variableId: string;
  readonly primary: readonly TreeNode[];
  readonly alternate: readonly TreeNode[] | null;
}
type TreeNode = LeafToken | ConditionNode;

interface ParseSequenceResult {
  readonly nodes: readonly TreeNode[];
  readonly index: number;
  readonly stop: "ELSE" | "END" | "EOF";
}

function parseSequence(tokens: readonly TemplateToken[], start: number, entryId: string, depth: number, control: TemplateControl): TemplateResult<ParseSequenceResult> {
  if (depth > control.budgets.maxNestingDepth) return fail("CONDITION_NESTING_EXCEEDED", "CONDITIONS", "Conditional nesting exceeds the admitted bound.", entryId);
  const nodes: TreeNode[] = [];
  let index = start;
  while (index < tokens.length) {
    const token = tokens[index];
    if (!token) return fail("CONDITION_STRUCTURE_INVALID", "CONDITIONS", "Condition token stream is malformed.", entryId);
    if (token.kind === "ELSE") return { ok: true, value: { nodes: Object.freeze(nodes), index, stop: "ELSE" } };
    if (token.kind === "END") return { ok: true, value: { nodes: Object.freeze(nodes), index, stop: "END" } };
    if (token.kind !== "IF") {
      nodes.push(token as LeafToken);
      index += 1;
      continue;
    }
    const primary = parseSequence(tokens, index + 1, entryId, depth + 1, control);
    if (!primary.ok) return primary;
    let alternate: readonly TreeNode[] | null = null;
    let endIndex: number;
    if (primary.value.stop === "ELSE") {
      const alt = parseSequence(tokens, primary.value.index + 1, entryId, depth + 1, control);
      if (!alt.ok) return alt;
      if (alt.value.stop !== "END") return fail("CONDITION_UNCLOSED", "CONDITIONS", "Conditional else branch is missing its matching end.", entryId);
      alternate = alt.value.nodes;
      endIndex = alt.value.index;
    } else if (primary.value.stop === "END") {
      endIndex = primary.value.index;
    } else {
      return fail("CONDITION_UNCLOSED", "CONDITIONS", "Conditional block is missing its matching end.", entryId);
    }
    nodes.push(Object.freeze({ kind: "CONDITION", nodeId: `${entryId}:${token.ordinal}`, variableId: token.id, primary: primary.value.nodes, alternate }) as ConditionNode);
    index = endIndex + 1;
  }
  return { ok: true, value: { nodes: Object.freeze(nodes), index, stop: "EOF" } };
}

function collectConditions(nodes: readonly TreeNode[], out: ConditionNode[] = []): ConditionNode[] {
  for (const node of nodes) {
    if (node.kind !== "CONDITION") continue;
    out.push(node);
    collectConditions(node.primary, out);
    if (node.alternate) collectConditions(node.alternate, out);
  }
  return out;
}

function staticValidate(nodes: readonly TreeNode[], template: TemplateDescriptor, entryId: string): TemplateResult<true> {
  const declarations = new Map(template.variables.map((item) => [item.id, item] as const));
  for (const node of collectConditions(nodes)) {
    const declaration = declarations.get(node.variableId);
    if (!declaration) return fail("CONDITION_VARIABLE_UNDECLARED", "CONDITIONS", "Condition references an undeclared variable.", node.variableId);
    if (declaration.type !== "BOOLEAN") return fail("CONDITION_TYPE_INVALID", "CONDITIONS", "Condition variable must be BOOLEAN.", node.variableId);
    if (!declaration.allowedContexts.includes("CONDITION_REFERENCE")) return fail("CONDITION_CONTEXT_NOT_ALLOWED", "CONDITIONS", "Variable is not admitted for condition use.", node.variableId);
  }
  if (collectConditions(nodes).length > 0 && entryId.length === 0) return fail("CONDITION_STRUCTURE_INVALID", "CONDITIONS", "Condition entry identity is invalid.");
  return { ok: true, value: true };
}

function markNotEvaluated(nodes: readonly TreeNode[], decisions: ConditionDecision[]): void {
  for (const node of nodes) {
    if (node.kind !== "CONDITION") continue;
    decisions.push(Object.freeze({ conditionNodeId: node.nodeId, variableId: node.variableId, evaluationStatus: "NOT_EVALUATED" }));
    markNotEvaluated(node.primary, decisions);
    if (node.alternate) markNotEvaluated(node.alternate, decisions);
  }
}

function evaluateNodes(
  nodes: readonly TreeNode[],
  resolutions: ReadonlyMap<string, VariableResolutionEntry>,
  decisions: ConditionDecision[],
  selected: TemplateToken[],
  evaluated: Set<string>,
  control: TemplateControl,
): TemplateResult<true> {
  for (const node of nodes) {
    const gate = checkControl(control, "CONDITIONS");
    if (!gate.ok) return gate;
    if (node.kind !== "CONDITION") {
      selected.push(node);
      continue;
    }
    const resolution = resolutions.get(node.variableId);
    if (!resolution) return fail("CONDITION_RESOLUTION_MISSING", "CONDITIONS", "Condition variable has no compatible resolution entry.", node.variableId);
    if (resolution.status === "UNBOUND_OPTIONAL") return fail("CONDITION_UNBOUND_OPTIONAL", "CONDITIONS", "Reached optional condition has no value.", node.variableId);
    if (typeof resolution.value !== "boolean") return fail("CONDITION_RESOLUTION_INVALID", "CONDITIONS", "Condition resolution is not a BOOLEAN value.", node.variableId);
    evaluated.add(node.variableId);
    if (resolution.value) {
      decisions.push(Object.freeze({ conditionNodeId: node.nodeId, variableId: node.variableId, evaluationStatus: "TRUE", selectedBranch: "PRIMARY" }));
      const primary = evaluateNodes(node.primary, resolutions, decisions, selected, evaluated, control);
      if (!primary.ok) return primary;
      if (node.alternate) markNotEvaluated(node.alternate, decisions);
    } else if (node.alternate) {
      decisions.push(Object.freeze({ conditionNodeId: node.nodeId, variableId: node.variableId, evaluationStatus: "FALSE", selectedBranch: "ALTERNATE" }));
      markNotEvaluated(node.primary, decisions);
      const alt = evaluateNodes(node.alternate, resolutions, decisions, selected, evaluated, control);
      if (!alt.ok) return alt;
    } else {
      decisions.push(Object.freeze({ conditionNodeId: node.nodeId, variableId: node.variableId, evaluationStatus: "FALSE", selectedBranch: "EMPTY" }));
      markNotEvaluated(node.primary, decisions);
    }
    if (decisions.length > control.budgets.maxEvidenceEntries) return fail("CONDITION_EVIDENCE_BUDGET_EXCEEDED", "CONDITIONS", "Condition evidence exceeds the admitted bound.");
  }
  return { ok: true, value: true };
}

function treeIdentity(nodes: readonly TreeNode[]): unknown[] {
  return nodes.map((node) => node.kind === "CONDITION"
    ? { kind: "CONDITION", nodeId: node.nodeId, variableId: node.variableId, primary: treeIdentity(node.primary), alternate: node.alternate ? treeIdentity(node.alternate) : null }
    : node.kind === "LITERAL" ? { kind: "LITERAL" } : { kind: node.kind, id: node.kind === "VAR" ? node.id : undefined });
}

export function selectConditions(template: TemplateDescriptor, variables: VariableResolutionSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<ConditionalSelectionSnapshot> {
  const gate = checkControl(control, "CONDITIONS");
  if (!gate.ok) return gate;
  if (!template || !variables || template.templateSemanticDigest !== variables.templateSemanticDigest || !Array.isArray(template.entries) || !Array.isArray(variables.entries)) return fail("CONDITION_INPUT_MISMATCH", "CONDITIONS", "S01/S02 snapshots are incompatible.");
  const variableIntegrity = verifyVariableSnapshot(variables, digest);
  if (!variableIntegrity.ok) return fail(variableIntegrity.error.code, "CONDITIONS", variableIntegrity.error.summary, variableIntegrity.error.ref);
  const resolutions = new Map(variables.entries.map((item) => [item.id, item] as const));
  const selectedEntries: SelectedTemplateEntry[] = [];
  const staticRefs = new Set<string>();
  const evaluatedRefs = new Set<string>();

  for (const entry of template.entries) {
    if (entry.kind === "BINARY_COPY") {
      const conditionTreeDigest = digest.digest(stableStringify([]));
      selectedEntries.push(Object.freeze({ entryId: entry.entryId, selectedTokens: Object.freeze([]), decisions: Object.freeze([]), conditionTreeDigest }));
      continue;
    }
    if (!Array.isArray(entry.tokens)) return fail("CONDITION_TOKEN_STREAM_MISSING", "CONDITIONS", "TEXT_TEMPLATE entry lacks its frozen token stream.", entry.entryId);
    const parsed = parseSequence(entry.tokens, 0, entry.entryId, 0, control);
    if (!parsed.ok) return parsed;
    if (parsed.value.stop !== "EOF") return fail("CONDITION_STRUCTURE_INVALID", "CONDITIONS", "Unmatched condition control marker.", entry.entryId);
    const valid = staticValidate(parsed.value.nodes, template, entry.entryId);
    if (!valid.ok) return valid;
    for (const node of collectConditions(parsed.value.nodes)) staticRefs.add(node.variableId);
    const decisions: ConditionDecision[] = [];
    const selected: TemplateToken[] = [];
    const evaluated = new Set<string>();
    const outcome = evaluateNodes(parsed.value.nodes, resolutions, decisions, selected, evaluated, control);
    if (!outcome.ok) return outcome;
    for (const id of evaluated) evaluatedRefs.add(id);
    const conditionTreeDigest = digest.digest(stableStringify(treeIdentity(parsed.value.nodes)));
    selectedEntries.push(Object.freeze({ entryId: entry.entryId, selectedTokens: Object.freeze(selected), decisions: Object.freeze(decisions), conditionTreeDigest }));
  }

  selectedEntries.sort((a, b) => a.entryId.localeCompare(b.entryId));
  const staticConditionRefs = Object.freeze([...staticRefs].sort());
  const evaluatedConditionRefs = Object.freeze([...evaluatedRefs].sort());
  const decisionShape = selectedEntries.map((entry) => ({ entryId: entry.entryId, conditionTreeDigest: entry.conditionTreeDigest, decisions: entry.decisions, selectedTokens: entry.selectedTokens }));
  const conditionalDecisionDigest = digest.digest(stableStringify({ conditionContractVersion: CONDITION_CONTRACT_VERSION, templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, decisionShape, evaluatedConditionRefs }));
  return { ok: true, value: Object.freeze({ conditionContractVersion: CONDITION_CONTRACT_VERSION, templateSemanticDigest: template.templateSemanticDigest, variableValueDigest: variables.variableValueDigest, entries: Object.freeze(selectedEntries), staticConditionRefs, evaluatedConditionRefs, conditionalDecisionDigest }) };
}
