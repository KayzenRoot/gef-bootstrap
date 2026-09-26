import { selectConditions as selectConditionsCore } from "./conditions.js";
import { evaluateTemplate as evaluateTemplateCore } from "./engine.js";
import { loadTemplate as loadTemplateCore, scanTemplateTokens as scanTemplateTokensCore } from "./format.js";
import { renderTemplate as renderTemplateCore } from "./rendering.js";
import { fail } from "./runtime.js";
import { resolveVariables as resolveVariablesCore } from "./variables.js";
import { validateTemplate as validateTemplateCore } from "./validation.js";
import type { ConditionalSelectionSnapshot, DigestPort, EvaluateTemplateInput, EvaluateTemplateResult, RenderSnapshot, TemplateControl, TemplateDescriptor, TemplateResult, TemplateSourcePort, TemplateToken, TemplateValidationSnapshot, VariableBindingInput, VariableResolutionSnapshot } from "./types.js";

export async function loadTemplate(source: TemplateSourcePort, digest: DigestPort, control: TemplateControl): Promise<TemplateResult<TemplateDescriptor>> {
  try { return await loadTemplateCore(source, digest, control); }
  catch { return fail("FORMAT_RUNTIME_INPUT_INVALID", "FORMAT", "Template format request is structurally invalid or a supplied capability failed unexpectedly."); }
}

export function scanTemplateTokens(text: string, control: TemplateControl): TemplateResult<readonly TemplateToken[]> {
  try { return scanTemplateTokensCore(text, control); }
  catch { return fail("MARKER_RUNTIME_INPUT_INVALID", "FORMAT", "Marker scan request is structurally invalid."); }
}

export function resolveVariables(template: TemplateDescriptor, bindings: VariableBindingInput | undefined, digest: DigestPort, control: TemplateControl): TemplateResult<VariableResolutionSnapshot> {
  try { return resolveVariablesCore(template, bindings, digest, control); }
  catch { return fail("VARIABLE_RUNTIME_INPUT_INVALID", "VARIABLES", "Variable resolution request is structurally invalid or a supplied capability failed unexpectedly."); }
}

export function selectConditions(template: TemplateDescriptor, variables: VariableResolutionSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<ConditionalSelectionSnapshot> {
  try { return selectConditionsCore(template, variables, digest, control); }
  catch { return fail("CONDITION_RUNTIME_INPUT_INVALID", "CONDITIONS", "Conditional selection request is structurally invalid or a supplied capability failed unexpectedly."); }
}

export function renderTemplate(template: TemplateDescriptor, variables: VariableResolutionSnapshot, conditions: ConditionalSelectionSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<RenderSnapshot> {
  try { return renderTemplateCore(template, variables, conditions, digest, control); }
  catch { return fail("RENDER_RUNTIME_INPUT_INVALID", "RENDERING", "Rendering request is structurally invalid or a supplied capability failed unexpectedly."); }
}

export function validateTemplate(template: TemplateDescriptor, render: RenderSnapshot, digest: DigestPort, control: TemplateControl): TemplateResult<TemplateValidationSnapshot> {
  try { return validateTemplateCore(template, render, digest, control); }
  catch { return fail("VALIDATION_RUNTIME_INPUT_INVALID", "VALIDATION", "Validation request is structurally invalid or a supplied capability failed unexpectedly."); }
}

export async function evaluateTemplate(source: TemplateSourcePort, digest: DigestPort, control: TemplateControl, input: EvaluateTemplateInput = {}): Promise<TemplateResult<EvaluateTemplateResult>> {
  try { return await evaluateTemplateCore(source, digest, control, input); }
  catch { return fail("TEMPLATE_RUNTIME_INPUT_INVALID", "CONTROL", "Template evaluation request is structurally invalid or a supplied capability failed unexpectedly."); }
}
