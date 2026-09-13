import { scanTemplateTokens } from "./format.js";
import { fail } from "./runtime.js";
import type { TemplateControl, TemplateResult, VariableResolutionEntry } from "./types.js";

export function applyLineEndings(text: string, policy: "PRESERVE_SOURCE" | "LF" | "CRLF"): string {
  if (policy === "PRESERVE_SOURCE") return text;
  const lf = text.replace(/\r\n|\r|\n/g, "\n");
  return policy === "LF" ? lf : lf.replace(/\n/g, "\r\n");
}

export function boundProjection(entry: VariableResolutionEntry | undefined, context: "TEXT_CONTENT" | "TARGET_PATH_SEGMENT"): TemplateResult<string> {
  if (!entry || !entry.allowedContexts.includes(context)) return fail("RENDER_VARIABLE_CONTEXT_INVALID", "RENDERING", "Variable is unavailable for the requested rendering context.", entry?.id);
  if (entry.status !== "BOUND" || entry.projection === undefined) return fail("VARIABLE_UNBOUND_FOR_RENDER", "RENDERING", "Selected variable has no renderable value.", entry.id);
  return { ok: true, value: entry.projection };
}

export function renderLogicalTarget(pattern: string, variables: ReadonlyMap<string, VariableResolutionEntry>, control: TemplateControl): TemplateResult<string> {
  const scanned = scanTemplateTokens(pattern, control);
  if (!scanned.ok) return scanned;
  let output = "";
  for (const token of scanned.value) {
    if (token.kind === "LITERAL") output += token.text;
    else if (token.kind === "VAR") {
      const value = boundProjection(variables.get(token.id), "TARGET_PATH_SEGMENT");
      if (!value.ok) return value;
      output += value.value;
    } else return fail("TARGET_PATTERN_DIRECTIVE_FORBIDDEN", "RENDERING", "Non-variable directive reached target rendering.");
  }
  return { ok: true, value: output };
}
