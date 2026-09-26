import test from "node:test";
import assert from "node:assert/strict";
import { loadTemplate, resolveVariables, selectConditions, validateTemplate } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, control, digest, sourcePort, utf8 } from "./m07-fixture.mjs";

test("cancellation raised during manifest read blocks before parsing or source reads", async () => {
  const controller = new AbortController();
  const calls = [];
  const port = {
    async read(ref) {
      calls.push(ref);
      if (ref === "template.json") {
        controller.abort();
        return utf8(JSON.stringify(baseManifest()));
      }
      return utf8("unexpected");
    },
  };
  const result = await loadTemplate(port, digest, control({ signal: controller.signal }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TEMPLATE_CANCELLED");
  assert.deepEqual(calls, ["template.json"]);
});

test("marker budget is aggregate across referenced text sources", async () => {
  const manifest = baseManifest({ entries: [
    { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "a.txt" },
    { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "b.txt" },
  ] });
  const port = sourcePort({ "template.json": JSON.stringify(manifest), "content/a.txt": "{{gef:literal-open}}", "content/b.txt": "{{gef:literal-open}}" });
  const result = await loadTemplate(port, digest, control({ budgets: { maxMarkers: 1 } }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MARKER_BUDGET_EXCEEDED");
});

test("empty allowedBindingSources admits default-only variable and rejects supplied candidates", async () => {
  const manifest = baseManifest({
    variables: [{ variableId: "value", type: "STRING", required: true, default: "only", allowedContexts: ["TEXT_CONTENT"], allowedBindingSources: [] }],
    entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }],
  });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": "{{gef:var value}}" }), digest, control());
  assert.equal(loaded.ok, true, loaded.ok ? "" : loaded.error.code);
  const defaultOnly = resolveVariables(loaded.value, undefined, digest, control());
  assert.equal(defaultOnly.ok, true);
  assert.equal(defaultOnly.value.entries[0].projection, "only");
  const supplied = resolveVariables(loaded.value, { explicit: [{ id: "value", value: "override" }] }, digest, control());
  assert.equal(supplied.ok, false);
  assert.equal(supplied.error.code, "VARIABLE_SOURCE_NOT_ALLOWED");
});

test("TRUE branch decision evidence remains source-tree preorder before inactive alternate subtree", async () => {
  const variables = [
    { variableId: "outer", type: "BOOLEAN", required: true, allowedContexts: ["CONDITION_REFERENCE"] },
    { variableId: "primary", type: "BOOLEAN", required: true, allowedContexts: ["CONDITION_REFERENCE"] },
    { variableId: "alternate", type: "BOOLEAN", required: false, allowedContexts: ["CONDITION_REFERENCE"] },
  ];
  const source = "{{gef:if outer}}{{gef:if primary}}P{{gef:end}}{{gef:else}}{{gef:if alternate}}A{{gef:end}}{{gef:end}}";
  const manifest = baseManifest({ variables, entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, { explicit: [{ id: "outer", value: true }, { id: "primary", value: true }] }, digest, control());
  assert.equal(resolved.ok, true);
  const selected = selectConditions(loaded.value, resolved.value, digest, control());
  assert.equal(selected.ok, true);
  assert.deepEqual(selected.value.entries[0].decisions.map((item) => [item.variableId, item.evaluationStatus]), [["outer", "TRUE"], ["primary", "TRUE"], ["alternate", "NOT_EVALUATED"]]);
});

test("target component byte budget applies to variable segments and final validation", async () => {
  const variableManifest = baseManifest({
    variables: [{ variableId: "name", type: "STRING", required: true, allowedContexts: ["TARGET_PATH_SEGMENT"] }],
    entries: [{ ...baseManifest().entries[0], targetPattern: "docs/{{gef:var name}}" }],
  });
  const loaded = await loadTemplate(bundle(variableManifest), digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, { explicit: [{ id: "name", value: "abcde" }] }, digest, control({ budgets: { maxTargetComponentBytes: 4 } }));
  assert.equal(resolved.ok, false);
  assert.equal(resolved.error.code, "VARIABLE_PATH_UNSAFE");

  const staticLoaded = await loadTemplate(bundle(), digest, control());
  assert.equal(staticLoaded.ok, true);
  const staticVars = resolveVariables(staticLoaded.value, undefined, digest, control());
  assert.equal(staticVars.ok, true);
  const staticConditions = selectConditions(staticLoaded.value, staticVars.value, digest, control());
  assert.equal(staticConditions.ok, true);
  const render = (await import("../packages/template-engine/dist/index.js")).renderTemplate(staticLoaded.value, staticVars.value, staticConditions.value, digest, control());
  assert.equal(render.ok, true);
  const validation = validateTemplate(staticLoaded.value, render.value, digest, control({ budgets: { maxTargetComponentBytes: 4 } }));
  assert.equal(validation.ok, true);
  assert.equal(validation.value.outcome, "BLOCKED");
});
