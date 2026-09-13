import { ownField, ownRecord, parseStrictJson } from "./strict-json.js";
import {
  checkControl,
  decodeUtf8,
  fail,
  freezeBytes,
  hasUtf8Bom,
  stableStringify,
  TEMPLATE_CONTRACT_VERSION,
  TEMPLATE_SCHEMA_VERSION,
  utf8Length,
  validSemver,
  validSimpleId,
  validTemplateVariableDeclarationId,
  validVariableId,
  validateLogicalFileTarget,
  validateSourceRef,
} from "./runtime.js";
import type {
  DigestPort,
  LineEndingPolicy,
  ScalarValue,
  TemplateControl,
  TemplateDescriptor,
  TemplateEntryDescriptor,
  TemplateEntryKind,
  TemplateResult,
  TemplateSourcePort,
  TemplateToken,
  VariableBindingSource,
  VariableContext,
  VariableDeclaration,
  VariableType,
  VariableValueClass,
} from "./types.js";

const TOP_FIELDS = new Set(["schemaVersion", "templateContractVersion", "templateId", "templateVersion", "metadata", "entries", "extensions", "variables"]);
const ENTRY_FIELDS = new Set(["entryId", "kind", "sourceRef", "targetPattern", "textPolicy"]);
const TEXT_POLICY_FIELDS = new Set(["lineEndings"]);
const VARIABLE_FIELDS = new Set(["variableId", "type", "required", "default", "enumValues", "allowedContexts", "allowedBindingSources", "valueClass"]);
const VARIABLE_TYPES = new Set<VariableType>(["STRING", "BOOLEAN", "INTEGER", "ENUM"]);
const VARIABLE_CONTEXTS = new Set<VariableContext>(["TEXT_CONTENT", "TARGET_PATH_SEGMENT", "CONDITION_REFERENCE"]);
const BINDING_SOURCES = new Set<VariableBindingSource>(["PROFILE_BINDING", "EXPLICIT_INPUT"]);
const VALUE_CLASSES = new Set<VariableValueClass>(["PLAIN", "SENSITIVE_REFERENCE"]);
const LINE_ENDINGS = new Set<LineEndingPolicy>(["PRESERVE_SOURCE", "LF", "CRLF"]);

function unknownField(record: Record<string, unknown>, allowed: ReadonlySet<string>): string | null {
  for (const key of Object.keys(record)) if (!allowed.has(key)) return key;
  return null;
}

function uniqueStrings(value: unknown, allowed: ReadonlySet<string>, allowEmpty = false): readonly string[] | null {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || !allowed.has(item) || seen.has(item)) return null;
    seen.add(item);
    out.push(item);
  }
  return Object.freeze(out);
}

function validStringValue(value: unknown, maxBytes: number): value is string {
  return typeof value === "string" && !value.includes("\0") && utf8Length(value) <= maxBytes;
}

function validValue(value: unknown, type: VariableType, enumValues: readonly string[] | undefined, maxBytes: number): value is ScalarValue {
  if (type === "STRING") return validStringValue(value, maxBytes);
  if (type === "BOOLEAN") return typeof value === "boolean";
  if (type === "INTEGER") return typeof value === "number" && Number.isSafeInteger(value);
  return typeof value === "string" && enumValues !== undefined && enumValues.includes(value) && utf8Length(value) <= maxBytes;
}

function parseVariable(value: unknown, control: TemplateControl): TemplateResult<VariableDeclaration> {
  if (!ownRecord(value)) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "Variable declaration must be an object.");
  const extra = unknownField(value, VARIABLE_FIELDS);
  if (extra) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "Variable declaration contains an unknown field.", extra);

  const rawId = ownField(value, "variableId");
  const rawType = ownField(value, "type");
  const rawRequired = ownField(value, "required");
  if (typeof rawId !== "string" || !validTemplateVariableDeclarationId(rawId)) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "variableId is not canonical.");
  if (typeof rawType !== "string" || !VARIABLE_TYPES.has(rawType as VariableType)) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "Variable type is not admitted.", rawId);
  if (typeof rawRequired !== "boolean") return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "required must be a boolean.", rawId);
  const type = rawType as VariableType;

  let enumValues: readonly string[] | undefined;
  const rawEnum = ownField(value, "enumValues");
  if (type === "ENUM") {
    if (!Array.isArray(rawEnum) || rawEnum.length === 0 || rawEnum.length > 256) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "ENUM requires a bounded non-empty enumValues set.", rawId);
    const seen = new Set<string>();
    const items: string[] = [];
    for (const item of rawEnum) {
      if (!validStringValue(item, control.budgets.maxValueBytes) || seen.has(item)) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "enumValues must be unique valid strings.", rawId);
      seen.add(item);
      items.push(item);
    }
    enumValues = Object.freeze(items.sort());
  } else if (rawEnum !== undefined) {
    return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "enumValues is valid only for ENUM.", rawId);
  }

  const rawContexts = ownField(value, "allowedContexts");
  const contexts = uniqueStrings(rawContexts, VARIABLE_CONTEXTS);
  if (!contexts) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "allowedContexts must be a non-empty unique admitted set.", rawId);

  const rawSources = ownField(value, "allowedBindingSources");
  const sources = rawSources === undefined
    ? Object.freeze(["PROFILE_BINDING", "EXPLICIT_INPUT"] as VariableBindingSource[])
    : uniqueStrings(rawSources, BINDING_SOURCES, true) as readonly VariableBindingSource[] | null;
  if (!sources) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "allowedBindingSources must be a unique admitted subset.", rawId);

  const rawClass = ownField(value, "valueClass");
  const valueClass = rawClass === undefined ? "PLAIN" : rawClass;
  if (typeof valueClass !== "string" || !VALUE_CLASSES.has(valueClass as VariableValueClass)) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "Unknown valueClass.", rawId);
  if (valueClass === "SENSITIVE_REFERENCE" && type !== "STRING" && type !== "ENUM") return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "SENSITIVE_REFERENCE requires STRING or ENUM.", rawId);
  if (valueClass === "SENSITIVE_REFERENCE" && contexts.includes("TARGET_PATH_SEGMENT")) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "SENSITIVE_REFERENCE cannot be used as a target path segment.", rawId);

  const rawDefault = ownField(value, "default");
  if (rawDefault !== undefined && !validValue(rawDefault, type, enumValues, control.budgets.maxValueBytes)) return fail("VARIABLE_DECLARATION_INVALID", "FORMAT", "Default value does not match its declaration.", rawId);

  const base = {
    id: rawId,
    type,
    required: rawRequired,
    allowedBindingSources: Object.freeze([...sources]),
    allowedContexts: Object.freeze(contexts as VariableContext[]),
    valueClass: valueClass as VariableValueClass,
  } as const;
  if (rawDefault !== undefined && enumValues !== undefined) return { ok: true, value: Object.freeze({ ...base, defaultValue: rawDefault as ScalarValue, enumValues }) };
  if (rawDefault !== undefined) return { ok: true, value: Object.freeze({ ...base, defaultValue: rawDefault as ScalarValue }) };
  if (enumValues !== undefined) return { ok: true, value: Object.freeze({ ...base, enumValues }) };
  return { ok: true, value: Object.freeze(base) };
}

export function scanTemplateTokens(text: string, control: TemplateControl): TemplateResult<readonly TemplateToken[]> {
  const tokens: TemplateToken[] = [];
  let cursor = 0;
  let markers = 0;
  let ordinal = 0;
  while (cursor < text.length) {
    const open = text.indexOf("{{gef:", cursor);
    if (open < 0) {
      if (cursor < text.length) tokens.push({ kind: "LITERAL", text: text.slice(cursor) });
      break;
    }
    if (open > cursor) tokens.push({ kind: "LITERAL", text: text.slice(cursor, open) });
    const close = text.indexOf("}}", open + 6);
    if (close < 0) return fail("MARKER_UNCLOSED", "FORMAT", "Reserved GEF marker is not closed.");
    const markerLength = close + 2 - open;
    if (markerLength > control.budgets.maxMarkerLength) return fail("MARKER_TOO_LONG", "FORMAT", "Marker exceeds the admitted length bound.");
    markers += 1;
    if (markers > control.budgets.maxMarkers) return fail("MARKER_BUDGET_EXCEEDED", "FORMAT", "Marker count exceeds the admitted bound.");
    const body = text.slice(open + 6, close);
    let token: TemplateToken;
    const varMatch = /^var ([a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*)$/.exec(body);
    const ifMatch = /^if ([a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*)$/.exec(body);
    if (varMatch?.[1] && validVariableId(varMatch[1])) token = { kind: "VAR", id: varMatch[1] };
    else if (ifMatch?.[1] && validVariableId(ifMatch[1])) { ordinal += 1; token = { kind: "IF", id: ifMatch[1], ordinal }; }
    else if (body === "else") token = { kind: "ELSE" };
    else if (body === "end") token = { kind: "END" };
    else if (body === "literal-open") token = { kind: "LITERAL_OPEN" };
    else return fail("MARKER_INVALID", "FORMAT", "Reserved GEF marker is malformed or unsupported.");
    tokens.push(token);
    cursor = close + 2;
  }
  return { ok: true, value: Object.freeze(tokens) };
}

function validateTargetPattern(pattern: string, control: TemplateControl): TemplateResult<true> {
  const scanned = scanTemplateTokens(pattern, control);
  if (!scanned.ok) return scanned;
  let staticProjection = "";
  for (const token of scanned.value) {
    if (token.kind === "LITERAL") staticProjection += token.text;
    else if (token.kind === "VAR") staticProjection += "x";
    else return fail("TARGET_PATTERN_DIRECTIVE_FORBIDDEN", "FORMAT", "targetPattern admits variable markers only.");
  }
  if (!validateLogicalFileTarget(staticProjection, control.budgets)) return fail("TARGET_PATTERN_INVALID", "FORMAT", "targetPattern is not a portable logical file target.");
  return { ok: true, value: true };
}

function parseEntry(value: unknown, control: TemplateControl): TemplateResult<{ entryId: string; kind: TemplateEntryKind; sourceRef: string; targetPattern: string; lineEndings?: LineEndingPolicy }> {
  if (!ownRecord(value)) return fail("TEMPLATE_ENTRY_INVALID", "FORMAT", "Template entry must be an object.");
  const extra = unknownField(value, ENTRY_FIELDS);
  if (extra) return fail("TEMPLATE_ENTRY_INVALID", "FORMAT", "Template entry contains an unknown field.", extra);
  const entryId = ownField(value, "entryId");
  const kind = ownField(value, "kind");
  const sourceRef = ownField(value, "sourceRef");
  const targetPattern = ownField(value, "targetPattern");
  if (typeof entryId !== "string" || !validSimpleId(entryId)) return fail("TEMPLATE_ENTRY_INVALID", "FORMAT", "entryId is not canonical.");
  if (kind !== "TEXT_TEMPLATE" && kind !== "BINARY_COPY") return fail("TEMPLATE_ENTRY_INVALID", "FORMAT", "Entry kind is not admitted.", entryId);
  if (typeof sourceRef !== "string" || !validateSourceRef(sourceRef, control.budgets)) return fail("SOURCE_REF_INVALID", "FORMAT", "sourceRef is not a safe content-relative reference.", entryId);
  if (typeof targetPattern !== "string") return fail("TARGET_PATTERN_INVALID", "FORMAT", "targetPattern must be a string.", entryId);
  const targetValid = validateTargetPattern(targetPattern, control);
  if (!targetValid.ok) return targetValid;

  const rawPolicy = ownField(value, "textPolicy");
  if (kind === "BINARY_COPY") {
    if (rawPolicy !== undefined) return fail("TEMPLATE_ENTRY_INVALID", "FORMAT", "BINARY_COPY cannot declare textPolicy.", entryId);
    return { ok: true, value: { entryId, kind, sourceRef, targetPattern } };
  }
  let lineEndings: LineEndingPolicy = "PRESERVE_SOURCE";
  if (rawPolicy !== undefined) {
    if (!ownRecord(rawPolicy) || unknownField(rawPolicy, TEXT_POLICY_FIELDS)) return fail("TEXT_POLICY_INVALID", "FORMAT", "textPolicy contains invalid fields.", entryId);
    const line = ownField(rawPolicy, "lineEndings");
    if (typeof line !== "string" || !LINE_ENDINGS.has(line as LineEndingPolicy)) return fail("TEXT_POLICY_INVALID", "FORMAT", "lineEndings is not admitted.", entryId);
    lineEndings = line as LineEndingPolicy;
  }
  return { ok: true, value: { entryId, kind, sourceRef, targetPattern, lineEndings } };
}

async function readSource(source: TemplateSourcePort, ref: string, control: TemplateControl): Promise<TemplateResult<Uint8Array>> {
  const gate = checkControl(control, "FORMAT");
  if (!gate.ok) return gate;
  let bytes: Uint8Array | null;
  try { bytes = await source.read(ref, control); }
  catch { return fail("SOURCE_READ_FAILED", "FORMAT", "Template source read failed.", ref); }
  const afterRead = checkControl(control, "FORMAT");
  if (!afterRead.ok) return afterRead;
  if (bytes === null) return fail("SOURCE_NOT_FOUND", "FORMAT", "Required template source was not found.", ref);
  if (!(bytes instanceof Uint8Array)) return fail("SOURCE_READ_INVALID", "FORMAT", "Source port returned an invalid byte payload.", ref);
  if (bytes.byteLength > control.budgets.maxSourceBytes) return fail("SOURCE_TOO_LARGE", "FORMAT", "Template source exceeds the per-source byte budget.", ref);
  return { ok: true, value: bytes };
}

export async function loadTemplate(source: TemplateSourcePort, digest: DigestPort, control: TemplateControl): Promise<TemplateResult<TemplateDescriptor>> {
  const gate = checkControl(control, "FORMAT");
  if (!gate.ok) return gate;
  let manifestBytes: Uint8Array | null;
  try { manifestBytes = await source.read("template.json", control); }
  catch { return fail("MANIFEST_READ_FAILED", "FORMAT", "template.json could not be read."); }
  const afterManifestRead = checkControl(control, "FORMAT");
  if (!afterManifestRead.ok) return afterManifestRead;
  if (manifestBytes === null || !(manifestBytes instanceof Uint8Array)) return fail("MANIFEST_NOT_FOUND", "FORMAT", "template.json is required.");
  if (manifestBytes.byteLength > control.budgets.maxManifestBytes) return fail("MANIFEST_TOO_LARGE", "FORMAT", "template.json exceeds the admitted byte budget.");
  if (hasUtf8Bom(manifestBytes)) return fail("MANIFEST_BOM_FORBIDDEN", "FORMAT", "UTF-8 BOM is not canonical for template.json.");
  const decoded = decodeUtf8(manifestBytes);
  if (!decoded.ok) return decoded;
  const parsed = parseStrictJson(decoded.value);
  if (!parsed.ok) return parsed;
  if (!ownRecord(parsed.value)) return fail("MANIFEST_INVALID", "FORMAT", "template.json must contain one JSON object.");
  const manifest = parsed.value;
  const extra = unknownField(manifest, TOP_FIELDS);
  if (extra) return fail("MANIFEST_UNKNOWN_FIELD", "FORMAT", "Unknown manifest core field.", extra);
  if (ownField(manifest, "schemaVersion") !== TEMPLATE_SCHEMA_VERSION) return fail("MANIFEST_SCHEMA_VERSION_UNSUPPORTED", "FORMAT", "Unsupported template schemaVersion.");
  if (ownField(manifest, "templateContractVersion") !== TEMPLATE_CONTRACT_VERSION) return fail("MANIFEST_CONTRACT_VERSION_UNSUPPORTED", "FORMAT", "Unsupported templateContractVersion.");
  const templateId = ownField(manifest, "templateId");
  const templateVersion = ownField(manifest, "templateVersion");
  if (typeof templateId !== "string" || !validSimpleId(templateId)) return fail("TEMPLATE_ID_INVALID", "FORMAT", "templateId is not canonical.");
  if (typeof templateVersion !== "string" || !validSemver(templateVersion)) return fail("TEMPLATE_VERSION_INVALID", "FORMAT", "templateVersion must be canonical SemVer.");
  const rawEntries = ownField(manifest, "entries");
  if (!Array.isArray(rawEntries) || rawEntries.length > control.budgets.maxEntries) return fail("ENTRY_BUDGET_EXCEEDED", "FORMAT", "entries must be a bounded array.");
  const rawVariables = ownField(manifest, "variables");
  if (rawVariables !== undefined && (!Array.isArray(rawVariables) || rawVariables.length > control.budgets.maxVariables)) return fail("VARIABLE_BUDGET_EXCEEDED", "FORMAT", "variables must be a bounded array.");
  const metadata = ownField(manifest, "metadata");
  if (metadata !== undefined && !ownRecord(metadata)) return fail("MANIFEST_METADATA_INVALID", "FORMAT", "metadata must be an object when present.");
  const extensions = ownField(manifest, "extensions");
  if (extensions !== undefined && !ownRecord(extensions)) return fail("MANIFEST_EXTENSIONS_INVALID", "FORMAT", "extensions must be an object when present.");

  const variables: VariableDeclaration[] = [];
  const variableIds = new Set<string>();
  for (const rawVariable of (rawVariables as readonly unknown[] | undefined) ?? []) {
    const parsedVariable = parseVariable(rawVariable, control);
    if (!parsedVariable.ok) return parsedVariable;
    if (variableIds.has(parsedVariable.value.id)) return fail("VARIABLE_DUPLICATE", "FORMAT", "Duplicate variable declaration.", parsedVariable.value.id);
    variableIds.add(parsedVariable.value.id);
    variables.push(parsedVariable.value);
  }
  variables.sort((a, b) => a.id.localeCompare(b.id));

  const entrySpecs: { entryId: string; kind: TemplateEntryKind; sourceRef: string; targetPattern: string; lineEndings?: LineEndingPolicy }[] = [];
  const entryIds = new Set<string>();
  for (const rawEntry of rawEntries) {
    const parsedEntry = parseEntry(rawEntry, control);
    if (!parsedEntry.ok) return parsedEntry;
    if (entryIds.has(parsedEntry.value.entryId)) return fail("TEMPLATE_ENTRY_DUPLICATE", "FORMAT", "Duplicate entryId.", parsedEntry.value.entryId);
    entryIds.add(parsedEntry.value.entryId);
    entrySpecs.push(parsedEntry.value);
  }
  entrySpecs.sort((a, b) => a.entryId.localeCompare(b.entryId));

  const cachedSources = new Map<string, Uint8Array>();
  const sourceDigests = new Map<string, string>();
  let aggregateBytes = 0;
  let aggregateMarkers = 0;
  const entries: TemplateEntryDescriptor[] = [];
  for (const spec of entrySpecs) {
    const controlGate = checkControl(control, "FORMAT");
    if (!controlGate.ok) return controlGate;
    let bytes = cachedSources.get(spec.sourceRef);
    if (!bytes) {
      const loaded = await readSource(source, spec.sourceRef, control);
      if (!loaded.ok) return loaded;
      bytes = loaded.value;
      aggregateBytes += bytes.byteLength;
      if (aggregateBytes > control.budgets.maxAggregateSourceBytes) return fail("SOURCE_AGGREGATE_TOO_LARGE", "FORMAT", "Aggregate referenced source bytes exceed the admitted budget.");
      cachedSources.set(spec.sourceRef, bytes);
      sourceDigests.set(spec.sourceRef, digest.digest(bytes));
    }
    const sourceDigest = sourceDigests.get(spec.sourceRef);
    if (!sourceDigest) return fail("DIGEST_PORT_INVALID", "FORMAT", "Digest port did not produce a source identity.", spec.sourceRef);
    if (spec.kind === "TEXT_TEMPLATE") {
      if (hasUtf8Bom(bytes)) return fail("TEXT_BOM_FORBIDDEN", "FORMAT", "TEXT_TEMPLATE source must not contain a UTF-8 BOM.", spec.sourceRef);
      const text = decodeUtf8(bytes);
      if (!text.ok) return text;
      const tokens = scanTemplateTokens(text.value, control);
      if (!tokens.ok) return tokens;
      aggregateMarkers += tokens.value.reduce((count, token) => count + (token.kind === "LITERAL" ? 0 : 1), 0);
      if (aggregateMarkers > control.budgets.maxMarkers) return fail("MARKER_BUDGET_EXCEEDED", "FORMAT", "Aggregate marker count exceeds the admitted bound.");
      entries.push(Object.freeze({ entryId: spec.entryId, kind: spec.kind, sourceRef: spec.sourceRef, targetPattern: spec.targetPattern, lineEndings: spec.lineEndings ?? "PRESERVE_SOURCE", sourceBytes: freezeBytes(bytes), sourceDigest, tokens: tokens.value }));
    } else {
      entries.push(Object.freeze({ entryId: spec.entryId, kind: spec.kind, sourceRef: spec.sourceRef, targetPattern: spec.targetPattern, sourceBytes: freezeBytes(bytes), sourceDigest }));
    }
  }

  const manifestDigest = digest.digest(manifestBytes);
  const sourceBundleDigest = digest.digest(stableStringify({ manifestDigest, sources: [...sourceDigests.entries()].sort(([a], [b]) => a.localeCompare(b)) }));
  const semanticShape = {
    templateContractVersion: TEMPLATE_CONTRACT_VERSION,
    templateId,
    templateVersion,
    variables: variables.map((item) => ({ id: item.id, type: item.type, required: item.required, defaultValue: item.defaultValue, enumValues: item.enumValues, allowedBindingSources: item.allowedBindingSources, allowedContexts: item.allowedContexts, valueClass: item.valueClass })),
    entries: entries.map((item) => ({ entryId: item.entryId, kind: item.kind, sourceDigest: item.sourceDigest, targetPattern: item.targetPattern, lineEndings: item.lineEndings })),
  };
  const templateSemanticDigest = digest.digest(stableStringify(semanticShape));
  return {
    ok: true,
    value: Object.freeze({ schemaVersion: 1, templateContractVersion: "1.0", templateId, templateVersion, entries: Object.freeze(entries), variables: Object.freeze(variables), sourceBundleDigest, templateSemanticDigest }),
  };
}
