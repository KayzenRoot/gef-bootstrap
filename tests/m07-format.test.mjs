import test from "node:test";
import assert from "node:assert/strict";
import { loadTemplate, parseStrictJson, scanTemplateTokens } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, control, digest, sourcePort, utf8 } from "./m07-fixture.mjs";

test("strict JSON rejects duplicate keys at root and nested levels", () => {
  for (const text of ['{"a":1,"a":2}', '{"a":{"b":1,"b":2}}']) {
    const result = parseStrictJson(text);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "JSON_DUPLICATE_KEY");
  }
});

test("strict JSON prototype-shaped members remain inert own data", () => {
  const before = {}.polluted;
  const result = parseStrictJson('{"__proto__":{"polluted":true},"constructor":{"prototype":{"bad":true}}}');
  assert.equal(result.ok, true);
  assert.equal(Object.getPrototypeOf(result.value), null);
  assert.equal({}.polluted, before);
  assert.equal({}.bad, undefined);
});

test("valid template loads exact referenced sources only", async () => {
  const port = bundle(baseManifest(), { "content/unreferenced.txt": "ignore" });
  const result = await loadTemplate(port, digest, control());
  assert.equal(result.ok, true, result.ok ? "" : result.error.code);
  assert.deepEqual(port.calls, ["template.json", "content/readme.txt"]);
  assert.equal(result.value.entries.length, 1);
  assert.equal(result.value.entries[0].kind, "TEXT_TEMPLATE");
});

test("duplicate entry ids and unknown manifest fields fail closed", async () => {
  const duplicate = baseManifest({ entries: [baseManifest().entries[0], baseManifest().entries[0]] });
  const dup = await loadTemplate(bundle(duplicate), digest, control());
  assert.equal(dup.ok, false);
  assert.equal(dup.error.code, "TEMPLATE_ENTRY_DUPLICATE");
  const unknown = await loadTemplate(bundle({ ...baseManifest(), surprise: true }), digest, control());
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error.code, "MANIFEST_UNKNOWN_FIELD");
});

test("unsupported schema or contract version fails closed", async () => {
  const schema = await loadTemplate(bundle(baseManifest({ schemaVersion: 2 })), digest, control());
  assert.equal(schema.ok, false);
  assert.equal(schema.error.code, "MANIFEST_SCHEMA_VERSION_UNSUPPORTED");
  const contract = await loadTemplate(bundle(baseManifest({ templateContractVersion: "2.0" })), digest, control());
  assert.equal(contract.ok, false);
  assert.equal(contract.error.code, "MANIFEST_CONTRACT_VERSION_UNSUPPORTED");
});

test("manifest and TEXT source BOM are rejected", async () => {
  const manifestBytes = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8(JSON.stringify(baseManifest()))]);
  const manifest = await loadTemplate(sourcePort({ "template.json": manifestBytes, "content/readme.txt": "hello" }), digest, control());
  assert.equal(manifest.ok, false);
  assert.equal(manifest.error.code, "MANIFEST_BOM_FORBIDDEN");
  const textBytes = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8("hello")]);
  const source = await loadTemplate(sourcePort({ "template.json": JSON.stringify(baseManifest()), "content/readme.txt": textBytes }), digest, control());
  assert.equal(source.ok, false);
  assert.equal(source.error.code, "TEXT_BOM_FORBIDDEN");
});

test("invalid UTF-8 text source rejects while binary remains opaque", async () => {
  const invalid = Uint8Array.from([0xc3, 0x28]);
  const text = await loadTemplate(sourcePort({ "template.json": JSON.stringify(baseManifest()), "content/readme.txt": invalid }), digest, control());
  assert.equal(text.ok, false);
  assert.equal(text.error.code, "UTF8_INVALID");
  const binaryManifest = baseManifest({ entries: [{ entryId: "blob", kind: "BINARY_COPY", sourceRef: "content/blob.bin", targetPattern: "blob.bin" }] });
  const binary = await loadTemplate(sourcePort({ "template.json": JSON.stringify(binaryManifest), "content/blob.bin": invalid }), digest, control());
  assert.equal(binary.ok, true, binary.ok ? "" : binary.error.code);
  assert.deepEqual(binary.value.entries[0].sourceBytes, [0xc3, 0x28]);
});

test("sourceRef traversal absolute alternate separator and device-like paths fail", async () => {
  const refs = ["content/../evil", "/content/a", "content\\a", "C:/content/a", "content//a"];
  for (const sourceRef of refs) {
    const manifest = baseManifest({ entries: [{ entryId: "x", kind: "TEXT_TEMPLATE", sourceRef, targetPattern: "x.txt" }] });
    const result = await loadTemplate(bundle(manifest), digest, control());
    assert.equal(result.ok, false, sourceRef);
  }
});

test("marker grammar is namespaced and closed", () => {
  const ordinary = scanTemplateTokens("hello {{ user }}", control());
  assert.equal(ordinary.ok, true);
  assert.deepEqual(ordinary.value, [{ kind: "LITERAL", text: "hello {{ user }}" }]);
  for (const invalid of ["{{gef:exec cmd}}", "{{gef:var name_}}", "{{gef:if x", "{{gef:var X}}"] ) {
    const result = scanTemplateTokens(invalid, control());
    assert.equal(result.ok, false, invalid);
  }
});

test("binary marker-looking bytes are never parsed", async () => {
  const manifest = baseManifest({ entries: [{ entryId: "blob", kind: "BINARY_COPY", sourceRef: "content/blob.bin", targetPattern: "blob.bin" }] });
  const port = sourcePort({ "template.json": JSON.stringify(manifest), "content/blob.bin": "{{gef:exec dangerous}}" });
  const result = await loadTemplate(port, digest, control());
  assert.equal(result.ok, true, result.ok ? "" : result.error.code);
  assert.equal(result.value.entries[0].tokens, undefined);
});

test("targetPattern admits variable markers only", async () => {
  const variable = { variableId: "name", type: "STRING", required: true, allowedContexts: ["TARGET_PATH_SEGMENT"] };
  const valid = baseManifest({ variables: [variable], entries: [{ ...baseManifest().entries[0], targetPattern: "docs/{{gef:var name}}.md" }] });
  assert.equal((await loadTemplate(bundle(valid), digest, control())).ok, true);
  for (const marker of ["{{gef:if name}}x{{gef:end}}", "{{gef:literal-open}}x"]) {
    const manifest = baseManifest({ variables: [variable], entries: [{ ...baseManifest().entries[0], targetPattern: marker }] });
    assert.equal((await loadTemplate(bundle(manifest), digest, control())).ok, false);
  }
});

test("entry array order does not change semantic identity", async () => {
  const a = { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "a.txt" };
  const b = { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "b.txt" };
  const files = { "content/a.txt": "A", "content/b.txt": "B" };
  const first = await loadTemplate(bundle(baseManifest({ entries: [a, b] }), files), digest, control());
  const second = await loadTemplate(bundle(baseManifest({ entries: [b, a] }), files), digest, control());
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.value.templateSemanticDigest, second.value.templateSemanticDigest);
});
