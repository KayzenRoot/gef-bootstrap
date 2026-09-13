import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTemplate,
  loadTemplate,
  parseStrictJson,
  renderTemplate,
  resolveVariables,
  scanTemplateTokens,
  selectConditions,
  validateTemplate,
} from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, control, digest, sourcePort } from "./m07-fixture.mjs";

test("public stages fail closed for malformed JavaScript inputs instead of throwing", async () => {
  const calls = [
    () => resolveVariables(null, null, null, null),
    () => selectConditions(null, null, null, null),
    () => renderTemplate(null, null, null, null, null),
    () => validateTemplate(null, null, null, null),
    () => scanTemplateTokens(null, null),
  ];
  for (const invoke of calls) {
    let result;
    assert.doesNotThrow(() => { result = invoke(); });
    assert.equal(result.ok, false);
  }
  const loaded = await loadTemplate(null, null, null);
  assert.equal(loaded.ok, false);
  const evaluated = await evaluateTemplate(null, null, null);
  assert.equal(evaluated.ok, false);
});

test("unexpected digest capability failure is sanitized into typed result", async () => {
  const badDigest = { digest() { throw new Error("secret-capability-detail"); } };
  const result = await loadTemplate(bundle(), badDigest, control());
  assert.equal(result.ok, false);
  assert.equal(result.error.summary.includes("secret-capability-detail"), false);
});

test("source port failure is typed and does not leak thrown message", async () => {
  const port = { async read() { throw new Error("sensitive-local-path-/tmp/private"); } };
  const result = await loadTemplate(port, digest, control());
  assert.equal(result.ok, false);
  assert.equal(result.error.summary.includes("/tmp/private"), false);
});

test("pre-cancelled operation creates no successful template snapshot", async () => {
  const controller = new AbortController();
  controller.abort();
  const port = bundle();
  const result = await loadTemplate(port, digest, control({ signal: controller.signal }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TEMPLATE_CANCELLED");
  assert.deepEqual(port.calls, []);
});

test("deadline requires injected clock and expired deadline blocks before read", async () => {
  const noClock = await loadTemplate(bundle(), digest, control({ deadlineMs: 10 }));
  assert.equal(noClock.ok, false);
  assert.equal(noClock.error.code, "CONTROL_CLOCK_REQUIRED");
  const port = bundle();
  const expired = await loadTemplate(port, digest, control({ deadlineMs: 10, nowMs: () => 10 }));
  assert.equal(expired.ok, false);
  assert.equal(expired.error.code, "TEMPLATE_DEADLINE_EXCEEDED");
  assert.deepEqual(port.calls, []);
});

test("manifest source marker and value budgets fail closed", async () => {
  const manifestTooSmall = await loadTemplate(bundle(), digest, control({ budgets: { maxManifestBytes: 4 } }));
  assert.equal(manifestTooSmall.ok, false);
  assert.equal(manifestTooSmall.error.code, "MANIFEST_TOO_LARGE");

  const sourceTooSmall = await loadTemplate(bundle(), digest, control({ budgets: { maxSourceBytes: 2 } }));
  assert.equal(sourceTooSmall.ok, false);
  assert.equal(sourceTooSmall.error.code, "SOURCE_TOO_LARGE");

  const marker = scanTemplateTokens("{{gef:literal-open}}{{gef:literal-open}}", control({ budgets: { maxMarkers: 1 } }));
  assert.equal(marker.ok, false);
  assert.equal(marker.error.code, "MARKER_BUDGET_EXCEEDED");

  const manifest = baseManifest({
    variables: [{ variableId: "value", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] }],
    entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }],
  });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": "{{gef:var value}}" }), digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, { explicit: [{ id: "value", value: "12345" }] }, digest, control({ budgets: { maxValueBytes: 4 } }));
  assert.equal(resolved.ok, false);
  assert.equal(resolved.error.code, "VARIABLE_TYPE_MISMATCH");
});

test("strict parser bounds deep and overly complex inputs", () => {
  const deep = parseStrictJson("[".repeat(70) + "0" + "]".repeat(70));
  assert.equal(deep.ok, false);
  assert.equal(deep.error.code, "JSON_TOO_DEEP");
});

test("prototype payload cannot mutate global Object prototype through manifest parsing", async () => {
  const text = '{"schemaVersion":1,"templateContractVersion":"1.0","templateId":"demo.template","templateVersion":"1.0.0","entries":[],"__proto__":{"polluted":true}}';
  const result = await loadTemplate(sourcePort({ "template.json": text }), digest, control());
  assert.equal(result.ok, false);
  assert.equal({}.polluted, undefined);
});

test("secret-like binding value never appears in diagnostic text", async () => {
  const manifest = baseManifest({ variables: [{ variableId: "token", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT"] }] });
  const loaded = await loadTemplate(bundle(manifest), digest, control());
  assert.equal(loaded.ok, true);
  const secret = "sk-abcdefghijklmnopqrstuvwxyz123456";
  const result = resolveVariables(loaded.value, { explicit: [{ id: "token", value: secret }] }, digest, control());
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("malformed source port payload is fail-closed", async () => {
  const result = await loadTemplate({ async read() { return "not-bytes"; } }, digest, control());
  assert.equal(result.ok, false);
});
