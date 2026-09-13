import { scanTemplateTokens } from "./format.js";
import {
  canonicalInteger,
  checkControl,
  fail,
  isRecord,
  stableStringify,
  utf8Length,
  validPortableSegment,
  validVariableId,
} from "./runtime.js";
import type {
  BindingCandidate,
  DigestPort,
  ScalarValue,
  TemplateControl,
  TemplateDescriptor,
  TemplateResult,
  VariableBindingInput,
  VariableBindingSource,
  VariableContext,
  VariableDeclaration,
  VariableResolutionEntry,
  VariableResolutionSnapshot,
} from "./types.js";

function validUnicodeString(value: string): boolean {
  if (value.includes("\0")) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

function probableSecret(value: string): boolean {
  return /^(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})$/.test(value)
    || /^-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(value);
}

function normalizeValue(declaration: VariableDeclaration, value: unknown, control: TemplateControl): TemplateResult<{ value: ScalarValue; projection: string }> {
  if (declaration.type === "STRING") {
    if (typeof value !== "string" || !validUnicodeString(value) || utf8Length(value) > control.budgets.maxValueBytes) return fail("VARIABLE_TYPE_MISMATCH", "VARIABLES", "STRING binding is invalid.", declaration.id);
    if (probableSecret(value)) return fail("VARIABLE_SECRET_MATERIAL_FORBIDDEN", "VARIABLES", "Probable secret material is not admitted as a template value.", declaration.id);
    return { ok: true, value: { value, projection: value } };
  }
  if (declaration.type === "BOOLEAN") {
    if (typeof value !== "boolean") return fail("VARIABLE_TYPE_MISMATCH", "VARIABLES", "BOOLEAN binding must be a typed boolean.", declaration.id);
    return { ok: true, value: { value, projection: value ? "true" : "false" } };
  }
  if (declaration.type === "INTEGER") {
    if (typeof value !== "number" || !Number.isSafeInteger(value)) return fail("VARIABLE_TYPE_MISMATCH", "VARIABLES", "INTEGER binding must be a safe integer.", declaration.id);
    const normalized = Object.is(value, -0) ? 0 : value;
    return { ok: true, value: { value: normalized, projection: canonicalInteger(normalized) } };
  }
  if (typeof value !== "string" || !validUnicodeString(value) || utf8Length(value) > control.budgets.maxValueBytes || !declaration.enumValues?.includes(value)) return fail("VARIABLE_ENUM_MISMATCH", "VARIABLES", "ENUM binding is not an admitted member.", declaration.id);
  if (probableSecret(value)) return fail("VARIABLE_SECRET_MATERIAL_FORBIDDEN", "VARIABLES", "Probable secret material is not admitted as a template value.", declaration.id);
  return { ok: true, value: { value, projection: value } };
}

function candidateArrays(input: unknown, control: TemplateControl): TemplateResult<{ profile: readonly BindingCandidate[]; explicit: readonly BindingCandidate[] }> {
  if (input === undefined) return { ok: true, value: { profile: [], explicit: [] } };
  if (!isRecord(input)) return fail("VARIABLE_BINDING_INPUT_INVALID", "VARIABLES", "Variable binding input must be an object.");
  const rawProfile = input.profile;
  const rawExplicit = input.explicit;
  if (rawProfile !== undefined && !Array.isArray(rawProfile)) return fail("VARIABLE_BINDING_INPUT_INVALID", "VARIABLES", "profile bindings must be an array.");
  if (rawExplicit !== undefined && !Array.isArray(rawExplicit)) return fail("VARIABLE_BINDING_INPUT_INVALID", "VARIABLES", "explicit bindings must be an array.");
  const profile = (rawProfile ?? []) as unknown[];
  const explicit = (rawExplicit ?? []) as unknown[];
  if (profile.length + explicit.length > control.budgets.maxBindings) return fail("VARIABLE_BUDGET_EXCEEDED", "VARIABLES", "Binding count exceeds the admitted budget.");
  const normalize = (items: readonly unknown[]): TemplateResult<readonly BindingCandidate[]> => {
    const result: BindingCandidate[] = [];
    for (const item of items) {
      if (!isRecord(item) || typeof item.id !== "string" || !validVariableId(item.id) || !("value" in item)) return fail("VARIABLE_BINDING_INPUT_INVALID", "VARIABLES", "Binding candidate is malformed.");
      if (item.classification !== undefined && item.classification !== "PLAIN" && item.classification !== "SECRET_MATERIAL") return fail("VARIABLE_BINDING_INPUT_INVALID", "VARIABLES", "Binding classification is invalid.", item.id);
      if (item.sourceRef !== undefined && typeof item.sourceRef !== "string") return fail("VARIABLE_BINDING_INPUT_INVALID", "VARIABLES", "Binding sourceRef must be a string.", item.id);
      const candidate: BindingCandidate = item.sourceRef === undefined && item.classification === undefined
        ? { id: item.id, value: item.value }
        : item.sourceRef === undefined
          ? { id: item.id, value: item.value, classification: item.classification as "PLAIN" | "SECRET_MATERIAL" }
          : item.classification === undefined
            ? { id: item.id, value: item.value, sourceRef: item.sourceRef }
            : { id: item.id, value: item.value, sourceRef: item.sourceRef, classification: item.classification as "PLAIN" | "SECRET_MATERIAL" };
      result.push(candidate);
    }
    return { ok: true, value: Object.freeze(result) };
  };
  const p = normalize(profile);
  if (!p.ok) return p;
  const e = normalize(explicit);
  if (!e.ok) return e;
  return { ok: true, value: { profile: p.value, explicit: e.value } };
}

function layerMap(items: readonly BindingCandidate[], declared: ReadonlySet<string>, layer: VariableBindingSource): TemplateResult<Map<string, BindingCandidate>> {
  const result = new Map<string, BindingCandidate>();
  for (const item of items) {
    if (!declared.has(item.id)) return fail("VARIABLE_UNKNOWN_BINDING", "VARIABLES", "Binding references an undeclared variable.", item.id);
    if (result.has(item.id)) return fail("VARIABLE_BINDING_CONFLICT", "VARIABLES", `Duplicate binding at ${layer}.`, item.id);
    result.set(item.id, item);
  }
  return { ok: true, value: result };
}

function usageIndex(template: TemplateDescriptor, control: TemplateControl): TemplateResult<Map<string, Set<VariableContext>>> {
  const usage = new Map<string, Set<VariableContext>>();
  const add = (id: string, context: VariableContext): void => {
    const set = usage.get(id) ?? new Set<VariableContext>();
    set.add(context);
    usage.set(id, set);
  };
  for (const entry of template.entries) {
    if (entry.kind === "TEXT_TEMPLATE") {
      for (const token of entry.tokens ?? []) {
        if (token.kind === "VAR") add(token.id, "TEXT_CONTENT");
        if (token.kind === "IF") add(token.id, "CONDITION_REFERENCE");
      }
    }
    const targetTokens = scanTemplateTokens(entry.targetPattern, control);
    if (!targetTokens.ok) return targetTokens;
    for (const token of targetTokens.value) {
      if (token.kind === "VAR") add(token.id, "TARGET_PATH_SEGMENT");
      else if (token.kind !== "LITERAL") return fail("TARGET_PATTERN_DIRECTIVE_FORBIDDEN", "VARIABLES", "Only variable markers are valid in targetPattern.", entry.entryId);
    }
  }
  return { ok: true, value: usage };
}

export function resolveVariables(template: TemplateDescriptor, bindings: VariableBindingInput | undefined, digest: DigestPort, control: TemplateControl): TemplateResult<VariableResolutionSnapshot> {
  const gate = checkControl(control, "VARIABLES");
  if (!gate.ok) return gate;
  if (!template || !Array.isArray(template.variables) || !Array.isArray(template.entries) || typeof template.templateSemanticDigest !== "string") return fail("VARIABLE_TEMPLATE_INVALID", "VARIABLES", "Template descriptor is malformed.");
  const declared = new Set(template.variables.map((item) => item.id));
  const usage = usageIndex(template, control);
  if (!usage.ok) return usage;
  for (const [id, contexts] of usage.value) {
    const declaration = template.variables.find((item) => item.id === id);
    if (!declaration) return fail("VARIABLE_UNDECLARED_REFERENCE", "VARIABLES", "Template references an undeclared variable.", id);
    for (const context of contexts) if (!declaration.allowedContexts.includes(context)) return fail("VARIABLE_CONTEXT_NOT_ALLOWED", "VARIABLES", "Variable is used in a context not admitted by its declaration.", id);
  }

  const candidates = candidateArrays(bindings, control);
  if (!candidates.ok) return candidates;
  const profile = layerMap(candidates.value.profile, declared, "PROFILE_BINDING");
  if (!profile.ok) return profile;
  const explicit = layerMap(candidates.value.explicit, declared, "EXPLICIT_INPUT");
  if (!explicit.ok) return explicit;

  const resolved: VariableResolutionEntry[] = [];
  for (const declaration of template.variables) {
    const controlGate = checkControl(control, "VARIABLES");
    if (!controlGate.ok) return controlGate;
    const explicitCandidate = explicit.value.get(declaration.id);
    const profileCandidate = profile.value.get(declaration.id);
    if (explicitCandidate && !declaration.allowedBindingSources.includes("EXPLICIT_INPUT")) return fail("VARIABLE_SOURCE_NOT_ALLOWED", "VARIABLES", "Explicit binding source is not allowed.", declaration.id);
    if (profileCandidate && !declaration.allowedBindingSources.includes("PROFILE_BINDING")) return fail("VARIABLE_SOURCE_NOT_ALLOWED", "VARIABLES", "Profile binding source is not allowed.", declaration.id);
    const selected = explicitCandidate ?? profileCandidate;
    const source: VariableResolutionEntry["source"] = explicitCandidate ? "EXPLICIT_INPUT" : profileCandidate ? "PROFILE_BINDING" : declaration.defaultValue !== undefined ? "TEMPLATE_DEFAULT" : "NONE";
    const rawValue = selected?.value ?? declaration.defaultValue;
    if (selected?.classification === "SECRET_MATERIAL") return fail("VARIABLE_SECRET_MATERIAL_FORBIDDEN", "VARIABLES", "Secret material cannot be bound through M07.", declaration.id);
    if (rawValue === undefined) {
      if (declaration.required) return fail("VARIABLE_MISSING_REQUIRED", "VARIABLES", "Required variable has no effective value.", declaration.id);
      resolved.push(Object.freeze({ id: declaration.id, type: declaration.type, status: "UNBOUND_OPTIONAL", source: "NONE", valueClass: declaration.valueClass, allowedContexts: declaration.allowedContexts }));
      continue;
    }
    const normalized = normalizeValue(declaration, rawValue, control);
    if (!normalized.ok) return normalized;
    const usedContexts = usage.value.get(declaration.id);
    if (usedContexts?.has("TARGET_PATH_SEGMENT") && !validPortableSegment(normalized.value.projection)) return fail("VARIABLE_PATH_UNSAFE", "VARIABLES", "Resolved target-path variable is not a portable single segment.", declaration.id);
    const provenanceRef = selected?.sourceRef === undefined ? undefined : digest.digest(selected.sourceRef);
    const base = { id: declaration.id, type: declaration.type, status: "BOUND" as const, source, value: normalized.value.value, projection: normalized.value.projection, valueClass: declaration.valueClass, allowedContexts: declaration.allowedContexts };
    resolved.push(Object.freeze(provenanceRef === undefined ? base : { ...base, provenanceRef }));
  }
  resolved.sort((a, b) => a.id.localeCompare(b.id));
  const valueShape = resolved.map((item) => ({ id: item.id, type: item.type, status: item.status, value: item.value }));
  const variableValueDigest = digest.digest(stableStringify({ templateSemanticDigest: template.templateSemanticDigest, values: valueShape }));
  const resolutionShape = resolved.map((item) => ({ id: item.id, source: item.source, provenanceRef: item.provenanceRef, valueClass: item.valueClass }));
  const variableResolutionDigest = digest.digest(stableStringify({ variableValueDigest, resolution: resolutionShape }));
  return { ok: true, value: Object.freeze({ templateSemanticDigest: template.templateSemanticDigest, entries: Object.freeze(resolved), variableValueDigest, variableResolutionDigest }) };
}
