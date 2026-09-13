import test from "node:test";
import assert from "node:assert/strict";
import { loadTemplate, renderTemplate, resolveVariables, selectConditions } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, bytesToText, control, digest, sourcePort } from "./m07-fixture.mjs";

async function pipeline({ source = "hello", variables = [], bindings, entry = {}, files = {} } = {}) {
  const manifest = baseManifest({ variables, entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt", ...entry }] });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source, ...files }), digest, control());
  assert.equal(loaded.ok, true, loaded.ok ? "" : loaded.error.code);
  const resolved = resolveVariables(loaded.value, bindings, digest, control());
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.error.code);
  const selected = selectConditions(loaded.value, resolved.value, digest, control());
  assert.equal(selected.ok, true, selected.ok ? "" : selected.error.code);
  const rendered = renderTemplate(loaded.value, resolved.value, selected.value, digest, control());
  return { loaded, resolved, selected, rendered };
}

test("scalar projections render deterministically", async () => {
  const cases = [
    [{ variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] }, "abc", "abc"],
    [{ variableId: "value", type: "BOOLEAN", required: true, allowedContexts: ["TEXT_CONTENT"] }, false, "false"],
    [{ variableId: "value", type: "INTEGER", required: true, allowedContexts: ["TEXT_CONTENT"] }, 42, "42"],
    [{ variableId: "value", type: "ENUM", required: true, enumValues: ["a", "b"], allowedContexts: ["TEXT_CONTENT"] }, "b", "b"],
  ];
  for (const [variable, value, expected] of cases) {
    const { rendered } = await pipeline({ source: "<{{gef:var value}}>", variables: [variable], bindings: { explicit: [{ id: "value", value }] } });
    assert.equal(rendered.ok, true);
    assert.equal(bytesToText(rendered.value.artifacts[0].content), `<${expected}>`);
  }
});

test("literal-open emits the reserved introducer without second-pass lexing", async () => {
  const { rendered } = await pipeline({ source: "{{gef:literal-open}}var value}}" });
  assert.equal(rendered.ok, true);
  assert.equal(bytesToText(rendered.value.artifacts[0].content), "{{gef:var value}}");
});

test("marker-looking variable value remains literal output data", async () => {
  const variable = { variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] };
  const marker = "{{gef:if admin}}boom{{gef:end}}";
  const { rendered } = await pipeline({ source: "{{gef:var value}}", variables: [variable], bindings: { explicit: [{ id: "value", value: marker }] } });
  assert.equal(rendered.ok, true);
  assert.equal(bytesToText(rendered.value.artifacts[0].content), marker);
});

test("condition controls emit no bytes and do not chomp neighboring whitespace", async () => {
  const variable = { variableId: "flag", type: "BOOLEAN", required: true, allowedContexts: ["CONDITION_REFERENCE"] };
  const { rendered } = await pipeline({ source: "A \n{{gef:if flag}} B \n{{gef:end}} C", variables: [variable], bindings: { explicit: [{ id: "flag", value: true }] } });
  assert.equal(rendered.ok, true);
  assert.equal(bytesToText(rendered.value.artifacts[0].content), "A \n B \n C");
});

test("line ending policies are explicit and apply after inserted STRING values", async () => {
  const variable = { variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] };
  const source = "a\r\nb\rc\n{{gef:var value}}";
  for (const [policy, expected] of [
    ["PRESERVE_SOURCE", "a\r\nb\rc\nx\r\ny"],
    ["LF", "a\nb\nc\nx\ny"],
    ["CRLF", "a\r\nb\r\nc\r\nx\r\ny"],
  ]) {
    const { rendered } = await pipeline({ source, variables: [variable], bindings: { explicit: [{ id: "value", value: "x\r\ny" }] }, entry: { textPolicy: { lineEndings: policy } } });
    assert.equal(rendered.ok, true, policy);
    assert.equal(bytesToText(rendered.value.artifacts[0].content), expected, policy);
  }
});

test("Unicode line separators are not rewritten and no BOM is synthesized", async () => {
  const { rendered } = await pipeline({ source: "a\u2028b\u2029c", entry: { textPolicy: { lineEndings: "CRLF" } } });
  assert.equal(rendered.ok, true);
  const content = Uint8Array.from(rendered.value.artifacts[0].content);
  assert.equal(bytesToText(content), "a\u2028b\u2029c");
  assert.notDeepEqual([...content.slice(0, 3)], [0xef, 0xbb, 0xbf]);
});

test("rendering performs no Unicode normalization", async () => {
  const decomposed = "e\u0301";
  const { rendered } = await pipeline({ source: decomposed });
  assert.equal(rendered.ok, true);
  assert.equal(bytesToText(rendered.value.artifacts[0].content), decomposed);
  assert.notEqual(decomposed, decomposed.normalize("NFC"));
});

test("BINARY_COPY is byte exact and not line transformed", async () => {
  const binary = Uint8Array.from([0x00, 0x0d, 0x0a, 0xff, 0x7b, 0x7b]);
  const manifest = baseManifest({ entries: [{ entryId: "blob", kind: "BINARY_COPY", sourceRef: "content/blob.bin", targetPattern: "blob.bin" }] });
  const port = sourcePort({ "template.json": JSON.stringify(manifest), "content/blob.bin": binary });
  const loaded = await loadTemplate(port, digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, undefined, digest, control());
  assert.equal(resolved.ok, true);
  const selected = selectConditions(loaded.value, resolved.value, digest, control());
  assert.equal(selected.ok, true);
  const rendered = renderTemplate(loaded.value, resolved.value, selected.value, digest, control());
  assert.equal(rendered.ok, true);
  assert.deepEqual(rendered.value.artifacts[0].content, [...binary]);
});

test("targetPattern substitution remains logical and does not sanitize or resolve roots", async () => {
  const variable = { variableId: "name", type: "STRING", required: true, allowedContexts: ["TARGET_PATH_SEGMENT"] };
  const { rendered } = await pipeline({ source: "x", variables: [variable], bindings: { explicit: [{ id: "name", value: "safe" }] }, entry: { targetPattern: "docs/{{gef:var name}}.md" } });
  assert.equal(rendered.ok, true);
  assert.equal(rendered.value.artifacts[0].logicalTarget, "docs/safe.md");
});

test("zero-byte selected text still yields an artifact", async () => {
  const variable = { variableId: "flag", type: "BOOLEAN", required: true, allowedContexts: ["CONDITION_REFERENCE"] };
  const { rendered } = await pipeline({ source: "{{gef:if flag}}X{{gef:end}}", variables: [variable], bindings: { explicit: [{ id: "flag", value: false }] } });
  assert.equal(rendered.ok, true);
  assert.equal(rendered.value.artifacts.length, 1);
  assert.equal(rendered.value.artifacts[0].byteLength, 0);
});

test("render output identity is deterministic for identical semantic values", async () => {
  const variable = { variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] };
  const a = await pipeline({ source: "{{gef:var value}}", variables: [variable], bindings: { explicit: [{ id: "value", value: "same", sourceRef: "one" }] } });
  const b = await pipeline({ source: "{{gef:var value}}", variables: [variable], bindings: { explicit: [{ id: "value", value: "same", sourceRef: "two" }] } });
  assert.equal(a.rendered.ok, true);
  assert.equal(b.rendered.ok, true);
  assert.equal(a.rendered.value.renderSnapshotDigest, b.rendered.value.renderSnapshotDigest);
});

test("per-entry and aggregate output budgets fail closed", async () => {
  const base = await pipeline({ source: "12345" });
  assert.equal(base.rendered.ok, true);
  const template = base.loaded.value;
  const variables = base.resolved.value;
  const conditions = base.selected.value;
  const perEntry = renderTemplate(template, variables, conditions, digest, control({ budgets: { maxRenderedBytesPerEntry: 4 } }));
  assert.equal(perEntry.ok, false);
  assert.equal(perEntry.error.code, "RENDER_ENTRY_BUDGET_EXCEEDED");
  const total = renderTemplate(template, variables, conditions, digest, control({ budgets: { maxRenderedBytesTotal: 4 } }));
  assert.equal(total.ok, false);
  assert.equal(total.error.code, "RENDER_TOTAL_BUDGET_EXCEEDED");
});
