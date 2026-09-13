import { selectConditions } from "./conditions.js";
import { loadTemplate } from "./format.js";
import { renderTemplate } from "./rendering.js";
import { resolveVariables } from "./variables.js";
import { validateTemplate } from "./validation.js";
import type { DigestPort, EvaluateTemplateInput, EvaluateTemplateResult, TemplateControl, TemplateResult, TemplateSourcePort } from "./types.js";

export async function evaluateTemplate(source: TemplateSourcePort, digest: DigestPort, control: TemplateControl, input: EvaluateTemplateInput = {}): Promise<TemplateResult<EvaluateTemplateResult>> {
  const template = await loadTemplate(source, digest, control);
  if (!template.ok) return template;
  const variables = resolveVariables(template.value, input.bindings, digest, control);
  if (!variables.ok) return variables;
  const conditions = selectConditions(template.value, variables.value, digest, control);
  if (!conditions.ok) return conditions;
  const render = renderTemplate(template.value, variables.value, conditions.value, digest, control);
  if (!render.ok) return render;
  const validation = validateTemplate(template.value, render.value, digest, control);
  if (!validation.ok) return validation;
  return { ok: true, value: Object.freeze({ template: template.value, variables: variables.value, conditions: conditions.value, render: render.value, validation: validation.value }) };
}
