import test from "node:test";
import assert from "node:assert/strict";
import { loadTemplate, resolveVariables } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, control, digest } from "./m07-fixture.mjs";

async function templateWith(variable, source = "{{gef:var value}}") {
  const manifest = baseManifest({
    variables: [variable],
    entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }],
  });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
  assert.equal(loaded.ok, true, loaded.ok ? "" : loaded.error.code);
  return loaded.value;
}

const plainString = { variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] };

test("variable identifier grammar rejects underscore reserved gef segment and overlong dotted segment", async () => {
  for (const variableId of ["bad_name", "gef.internal", `a.${"b".repeat(33)}`]) {
    const manifest = baseManifest({ variables: [{ ...plainString, variableId }] });
    const result = await loadTemplate(bundle(manifest), digest, control());
    assert.equal(result.ok, false, variableId);
    assert.equal(result.error.code, "VARIABLE_DECLARATION_INVALID");
  }
});

test("required missing blocks and optional missing is first-class", async () => {
  const required = await templateWith(plainString);
  const missing = resolveVariables(required, undefined, digest, control());
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "VARIABLE_MISSING_REQUIRED");

  const optional = await templateWith({ ...plainString, required: false });
  const resolved = resolveVariables(optional, undefined, digest, control());
  assert.equal(resolved.ok, true);
  assert.equal(resolved.value.entries[0].status, "UNBOUND_OPTIONAL");
  assert.equal(resolved.value.entries[0].source, "NONE");
});

test("precedence is default then profile then explicit and provenance is separate from value identity", async () => {
  const template = await templateWith({ ...plainString, default: "default" });
  const result = resolveVariables(template, {
    profile: [{ id: "value", value: "profile", sourceRef: "profile-a" }],
    explicit: [{ id: "value", value: "explicit", sourceRef: "request-a" }],
  }, digest, control());
  assert.equal(result.ok, true);
  const entry = result.value.entries[0];
  assert.equal(entry.value, "explicit");
  assert.equal(entry.source, "EXPLICIT_INPUT");
  assert.notEqual(entry.provenanceRef, "request-a");

  const sameValueDifferentSource = resolveVariables(template, { explicit: [{ id: "value", value: "explicit", sourceRef: "request-b" }] }, digest, control());
  assert.equal(sameValueDifferentSource.ok, true);
  assert.equal(result.value.variableValueDigest, sameValueDifferentSource.value.variableValueDigest);
  assert.notEqual(result.value.variableResolutionDigest, sameValueDifferentSource.value.variableResolutionDigest);
});

test("duplicate same-layer unknown and disallowed bindings fail closed", async () => {
  const template = await templateWith({ ...plainString, allowedBindingSources: ["PROFILE_BINDING"] });
  const duplicate = resolveVariables(template, { profile: [{ id: "value", value: "a" }, { id: "value", value: "b" }] }, digest, control());
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error.code, "VARIABLE_BINDING_CONFLICT");
  const unknown = resolveVariables(template, { profile: [{ id: "other", value: "x" }] }, digest, control());
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error.code, "VARIABLE_UNKNOWN_BINDING");
  const disallowed = resolveVariables(template, { explicit: [{ id: "value", value: "x" }] }, digest, control());
  assert.equal(disallowed.ok, false);
  assert.equal(disallowed.error.code, "VARIABLE_SOURCE_NOT_ALLOWED");
});

test("scalar types are exact and INTEGER uses safe numeric semantics with negative zero canonicalized", async () => {
  const cases = [
    [{ variableId: "value", type: "BOOLEAN", required: true, allowedContexts: ["TEXT_CONTENT"] }, true, "true"],
    [{ variableId: "value", type: "INTEGER", required: true, allowedContexts: ["TEXT_CONTENT"] }, 42, "42"],
    [{ variableId: "value", type: "ENUM", required: true, enumValues: ["one", "two"], allowedContexts: ["TEXT_CONTENT"] }, "two", "two"],
  ];
  for (const [declaration, value, projection] of cases) {
    const template = await templateWith(declaration);
    const result = resolveVariables(template, { explicit: [{ id: "value", value }] }, digest, control());
    assert.equal(result.ok, true);
    assert.equal(result.value.entries[0].projection, projection);
  }
  const intTemplate = await templateWith({ variableId: "value", type: "INTEGER", required: true, allowedContexts: ["TEXT_CONTENT"] });
  const negativeZero = resolveVariables(intTemplate, { explicit: [{ id: "value", value: -0 }] }, digest, control());
  assert.equal(negativeZero.ok, true);
  assert.equal(negativeZero.value.entries[0].value, 0);
  assert.equal(negativeZero.value.entries[0].projection, "0");
  for (const invalid of [1.5, Number.MAX_SAFE_INTEGER + 1, "42"]) {
    const result = resolveVariables(intTemplate, { explicit: [{ id: "value", value: invalid }] }, digest, control());
    assert.equal(result.ok, false);
  }
});

test("ENUM members are exact case-sensitive values", async () => {
  const template = await templateWith({ variableId: "value", type: "ENUM", required: true, enumValues: ["Prod"], allowedContexts: ["TEXT_CONTENT"] });
  assert.equal(resolveVariables(template, { explicit: [{ id: "value", value: "Prod" }] }, digest, control()).ok, true);
  assert.equal(resolveVariables(template, { explicit: [{ id: "value", value: "prod" }] }, digest, control()).ok, false);
});

test("usage context must be explicitly admitted", async () => {
  const manifest = baseManifest({
    variables: [{ variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] }],
    entries: [{ ...baseManifest().entries[0], targetPattern: "docs/{{gef:var value}}.md" }],
  });
  const loaded = await loadTemplate(bundle(manifest), digest, control());
  assert.equal(loaded.ok, true);
  const result = resolveVariables(loaded.value, { explicit: [{ id: "value", value: "safe" }] }, digest, control());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "VARIABLE_CONTEXT_NOT_ALLOWED");
});

test("target path values reject separators controls invalid characters and Windows device stems", async () => {
  const manifest = baseManifest({
    variables: [{ variableId: "value", type: "STRING", required: true, allowedContexts: ["TARGET_PATH_SEGMENT"] }],
    entries: [{ ...baseManifest().entries[0], targetPattern: "docs/{{gef:var value}}.md" }],
  });
  const loaded = await loadTemplate(bundle(manifest), digest, control());
  assert.equal(loaded.ok, true);
  for (const value of ["../x", "a/b", "a\\b", "x?y", "CON", "con.txt", "LPT1.log", "name.", " name", "a\u0007b"]) {
    const result = resolveVariables(loaded.value, { explicit: [{ id: "value", value }] }, digest, control());
    assert.equal(result.ok, false, value);
    assert.equal(result.error.code, "VARIABLE_PATH_UNSAFE");
  }
  assert.equal(resolveVariables(loaded.value, { explicit: [{ id: "value", value: "safe-name" }] }, digest, control()).ok, true);
});

test("SENSITIVE_REFERENCE is restricted and never path context", async () => {
  for (const type of ["BOOLEAN", "INTEGER"]) {
    const manifest = baseManifest({ variables: [{ variableId: "value", type, required: true, allowedContexts: ["TEXT_CONTENT"], valueClass: "SENSITIVE_REFERENCE" }] });
    const result = await loadTemplate(bundle(manifest), digest, control());
    assert.equal(result.ok, false);
  }
  const pathManifest = baseManifest({ variables: [{ variableId: "value", type: "STRING", required: true, allowedContexts: ["TARGET_PATH_SEGMENT"], valueClass: "SENSITIVE_REFERENCE" }] });
  assert.equal((await loadTemplate(bundle(pathManifest), digest, control())).ok, false);
});

test("explicit secret classification and high-confidence secret material are blocked without echoing value", async () => {
  const template = await templateWith(plainString);
  const secret = "sk-123456789012345678901234567890";
  const classified = resolveVariables(template, { explicit: [{ id: "value", value: secret, classification: "SECRET_MATERIAL" }] }, digest, control());
  assert.equal(classified.ok, false);
  assert.equal(classified.error.code, "VARIABLE_SECRET_MATERIAL_FORBIDDEN");
  assert.equal(classified.error.summary.includes(secret), false);
  const detected = resolveVariables(template, { explicit: [{ id: "value", value: secret }] }, digest, control());
  assert.equal(detected.ok, false);
  assert.equal(detected.error.summary.includes(secret), false);
});

test("marker-looking variable value remains data in the resolution snapshot", async () => {
  const template = await templateWith(plainString);
  const markerLike = "{{gef:if admin}}boom{{gef:end}}";
  const result = resolveVariables(template, { explicit: [{ id: "value", value: markerLike }] }, digest, control());
  assert.equal(result.ok, true);
  assert.equal(result.value.entries[0].projection, markerLike);
});
