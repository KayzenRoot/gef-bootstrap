import test from "node:test";
import assert from "node:assert/strict";
import { loadTemplate, resolveVariables, selectConditions } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, control, digest } from "./m07-fixture.mjs";

async function prepare(source, variables, bindings) {
  const manifest = baseManifest({ variables, entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
  assert.equal(loaded.ok, true, loaded.ok ? "" : loaded.error.code);
  const resolved = resolveVariables(loaded.value, { explicit: bindings }, digest, control());
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.error.code);
  return { template: loaded.value, variables: resolved.value };
}

const bool = (id, required = true) => ({ variableId: id, type: "BOOLEAN", required, allowedContexts: ["CONDITION_REFERENCE"] });

test("true selects primary and false selects alternate or empty", async () => {
  for (const [source, value, branch] of [
    ["A{{gef:if flag}}YES{{gef:else}}NO{{gef:end}}Z", true, "PRIMARY"],
    ["A{{gef:if flag}}YES{{gef:else}}NO{{gef:end}}Z", false, "ALTERNATE"],
    ["A{{gef:if flag}}YES{{gef:end}}Z", false, "EMPTY"],
  ]) {
    const prepared = await prepare(source, [bool("flag")], [{ id: "flag", value }]);
    const result = selectConditions(prepared.template, prepared.variables, digest, control());
    assert.equal(result.ok, true, result.ok ? "" : result.error.code);
    assert.equal(result.value.entries[0].decisions[0].selectedBranch, branch);
  }
});

test("nested reachable conditions evaluate in stable preorder", async () => {
  const source = "{{gef:if outer}}A{{gef:if inner}}B{{gef:else}}C{{gef:end}}{{gef:else}}D{{gef:end}}";
  const prepared = await prepare(source, [bool("outer"), bool("inner")], [{ id: "outer", value: true }, { id: "inner", value: false }]);
  const result = selectConditions(prepared.template, prepared.variables, digest, control());
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.entries[0].decisions.map((item) => [item.variableId, item.evaluationStatus]), [["outer", "TRUE"], ["inner", "FALSE"]]);
  assert.deepEqual(result.value.evaluatedConditionRefs, ["inner", "outer"]);
});

test("inactive nested condition value is short-circuited as NOT_EVALUATED", async () => {
  const source = "{{gef:if outer}}A{{gef:if optional}}B{{gef:end}}{{gef:else}}D{{gef:end}}";
  const manifest = baseManifest({
    variables: [bool("outer"), bool("optional", false)],
    entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }],
  });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, { explicit: [{ id: "outer", value: false }] }, digest, control());
  assert.equal(resolved.ok, true);
  const result = selectConditions(loaded.value, resolved.value, digest, control());
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.entries[0].decisions.map((item) => [item.variableId, item.evaluationStatus]), [["outer", "FALSE"], ["optional", "NOT_EVALUATED"]]);
  assert.deepEqual(result.value.evaluatedConditionRefs, ["outer"]);
  assert.deepEqual(result.value.staticConditionRefs, ["optional", "outer"]);
});

test("reached UNBOUND_OPTIONAL condition blocks", async () => {
  const manifest = baseManifest({ variables: [bool("optional", false)], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": "{{gef:if optional}}X{{gef:end}}" }), digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, undefined, digest, control());
  assert.equal(resolved.ok, true);
  const result = selectConditions(loaded.value, resolved.value, digest, control());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CONDITION_UNBOUND_OPTIONAL");
});

test("wrong condition type or missing condition context fails before runtime selection", async () => {
  for (const variable of [
    { variableId: "flag", type: "STRING", required: true, allowedContexts: ["CONDITION_REFERENCE"] },
    { variableId: "flag", type: "BOOLEAN", required: true, allowedContexts: ["TEXT_CONTENT"] },
  ]) {
    const source = "{{gef:if flag}}X{{gef:end}}";
    const manifest = baseManifest({ variables: [variable], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
    const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
    assert.equal(loaded.ok, true);
    const resolved = resolveVariables(loaded.value, { explicit: [{ id: "flag", value: variable.type === "STRING" ? "x" : true }] }, digest, control());
    if (!resolved.ok) {
      assert.equal(variable.allowedContexts.includes("CONDITION_REFERENCE"), false);
      continue;
    }
    const selected = selectConditions(loaded.value, resolved.value, digest, control());
    assert.equal(selected.ok, false);
  }
});

test("undeclared condition fails even when inside an inactive outer branch", async () => {
  const source = "{{gef:if outer}}{{gef:if missing}}X{{gef:end}}{{gef:else}}Y{{gef:end}}";
  const manifest = baseManifest({ variables: [bool("outer")], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
  assert.equal(loaded.ok, true);
  const resolved = resolveVariables(loaded.value, { explicit: [{ id: "outer", value: false }] }, digest, control());
  assert.equal(resolved.ok, false);
  assert.equal(resolved.error.code, "VARIABLE_UNDECLARED_REFERENCE");
});

test("malformed stack structures fail closed", async () => {
  const cases = [
    "{{gef:else}}",
    "{{gef:end}}",
    "{{gef:if flag}}x",
    "{{gef:if flag}}x{{gef:else}}y{{gef:else}}z{{gef:end}}",
  ];
  for (const source of cases) {
    const manifest = baseManifest({ variables: [bool("flag")], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
    const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": source }), digest, control());
    assert.equal(loaded.ok, true, source);
    const resolved = resolveVariables(loaded.value, { explicit: [{ id: "flag", value: true }] }, digest, control());
    assert.equal(resolved.ok, true, source);
    const selected = selectConditions(loaded.value, resolved.value, digest, control());
    assert.equal(selected.ok, false, source);
  }
});

test("condition nesting budget fails closed", async () => {
  const source = "{{gef:if flag}}".repeat(4) + "X" + "{{gef:end}}".repeat(4);
  const prepared = await prepare(source, [bool("flag")], [{ id: "flag", value: true }]);
  const result = selectConditions(prepared.template, prepared.variables, digest, control({ budgets: { maxNestingDepth: 2 } }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CONDITION_NESTING_EXCEEDED");
});

test("identical decisions are deterministic and random/time are absent from identity", async () => {
  const prepared = await prepare("{{gef:if flag}}X{{gef:else}}Y{{gef:end}}", [bool("flag")], [{ id: "flag", value: true }]);
  const a = selectConditions(prepared.template, prepared.variables, digest, control());
  const b = selectConditions(prepared.template, prepared.variables, digest, control());
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(a.value.conditionalDecisionDigest, b.value.conditionalDecisionDigest);
});
