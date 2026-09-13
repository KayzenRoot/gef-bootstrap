import { scanTemplateTokens } from "./format.js";
import { canonicalInteger, fail } from "./runtime.js";
import type { TemplateControl, TemplateResult, VariableResolutionEntry } from "./types.js";

export function applyLineEndings(text: string, policy: "PRESERVE_SOURCE" | "LF" | "CRLF"): string {
  if (policy === "PRESERVE_SOURCE") return text;
  const lf = text.replace(/\r\n|\r|\n/g, "\n");
  return policy === "LF" ? lf : lf.replace(/\n/g, "\r\n");
}

function canonicalProjection(entry: VariableResolutionEntry): string | null {
  if (entry.status !== "BOUND" || entry.value === undefined) return null;
  if (entry.type === "STRING" || entry.type === "ENUM") return typeof entry.value === "string" ? entry.value : null;
  if (entry.type === "BOOLEAN") return typeof entry.value === "boolean" ? (entry.value ? "true" : "false") : null;
  if (entry.type === "INTEGER") return typeof entry.value === "number" && Number.isSafeInteger(entry.value) ? canonicalInteger(entry.value) : null;
  return null;
}

export function boundProjection(entry: VariableResolutionEntry | undefined, context: "TEXT_CONTENT" | "TARGET_PATH_SEGMENT"): TemplateResult<string> {
  if (!entry || !entry.allowedContexts.includes(context)) return fail("RENDER_VARIABLE_CONTEXT_INVALID", "RENDERING", "Variable is unavailable for the requested rendering context.", entry?.id);
  const expected = canonicalProjection(entry);
  if (expected === null || entry.projection === undefined) return fail("VARIABLE_UNBOUND_FOR_RENDER", "RENDERING", "Selected variable has no renderable value.", entry.id);
  if (entry.projection !== expected) return fail("VARIABLE_PROJECTION_MISMATCH", "RENDERING", "Variable projection is inconsistent with its typed value.", entry.id);
  return { ok: true, value: entry.projection };
}

export function renderLogicalTarget(pattern: string, variables: ReadonlyMap<string, VariableResolutionEntry>, control: TemplateControl): TemplateResult<string> {
  const scanned = scanTemplateTokens(pattern, control);
  if (!scanned.ok) return scanned;
  const chunks: string[] = [];
  let characters = 0;
  for (const token of scanned.value) {
    let chunk: string;
    if (token.kind === "LITERAL") chunk = token.text;
    else if (token.kind === "VAR") {
      const value = boundProjection(variables.get(token.id), "TARGET_PATH_SEGMENT");
      if (!value.ok) return value;
      chunk = value.value;
    } else return fail("TARGET_PATTERN_DIRECTIVE_FORBIDDEN", "RENDERING", "Non-variable directive reached target rendering.");
    characters += chunk.length;
    if (characters > control.budgets.maxTargetBytes * 2) return fail("RENDER_TARGET_BUDGET_EXCEEDED", "RENDERING", "Rendered logical target exceeds its bounded allocation envelope.");
    chunks.push(chunk);
  }
  return { ok: true, value: chunks.join("") };
}
