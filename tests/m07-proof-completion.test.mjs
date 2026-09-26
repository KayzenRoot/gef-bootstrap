import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTemplate,
  loadTemplate,
  renderTemplate,
  resolveVariables,
  selectConditions,
  validateTemplate,
} from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, bytesToText, control, digest } from "./m07-fixture.mjs";

async function stages({ manifest = baseManifest(), files = {}, bindings, renderControl = control() } = {}) {
  const loaded = await loadTemplate(bundle(manifest, files), digest, control());
  assert.equal(loaded.ok, true, loaded.ok ? "" : loaded.error.code);
  const variables = resolveVariables(loaded.value, bindings, digest, control());
  assert.equal(variables.ok, true, variables.ok ? "" : variables.error.code);
  const conditions = selectConditions(loaded.value, variables.value, digest, control());
  assert.equal(conditions.ok, true, conditions.ok ? "" : conditions.error.code);
  const render = renderTemplate(loaded.value, variables.value, conditions.value, digest, renderControl);
  return { template: loaded.value, variables: variables.value, conditions: conditions.value, render };
}

function variable(variableId, type, required = true, allowedContexts = ["TEXT_CONTENT"], extra = {}) {
  return { variableId, type, required, allowedContexts, ...extra };
}

test("stage snapshots expose and enforce their frozen contract versions", async () => {
  const manifest = baseManifest({ variables: [variable("flag", "BOOLEAN", true, ["CONDITION_REFERENCE"])], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const s = await stages({ manifest, files: { "content/readme.txt": "{{gef:if flag}}yes{{gef:end}}" }, bindings: { explicit: [{ id: "flag", value: true }] } });
  assert.equal(s.variables.variableContractVersion, "1.0");
  assert.equal(s.conditions.conditionContractVersion, "1.0");
  assert.equal(s.render.ok, true);
  assert.equal(s.render.value.renderContractVersion, "1.0");
  const validated = validateTemplate(s.template, s.render.value, digest, control());
  assert.equal(validated.ok, true);
  assert.equal(validated.value.validationContractVersion, "1.0");

  const badVariableVersion = selectConditions(s.template, { ...s.variables, variableContractVersion: "9.9" }, digest, control());
  assert.equal(badVariableVersion.ok, false);
  const badConditionVersion = renderTemplate(s.template, s.variables, { ...s.conditions, conditionContractVersion: "9.9" }, digest, control());
  assert.equal(badConditionVersion.ok, false);
  const badRenderVersion = validateTemplate(s.template, { ...s.render.value, renderContractVersion: "9.9" }, digest, control());
  assert.equal(badRenderVersion.ok, false);
});

test("tampered S02 value payload and S03 selected structure are rejected with stale digests", async () => {
  const manifest = baseManifest({ variables: [variable("flag", "BOOLEAN", true, ["CONDITION_REFERENCE"])], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const s = await stages({ manifest, files: { "content/readme.txt": "{{gef:if flag}}yes{{gef:else}}no{{gef:end}}" }, bindings: { explicit: [{ id: "flag", value: true }] } });
  const alteredVariable = { ...s.variables.entries[0], value: false, projection: "false" };
  const staleVariables = { ...s.variables, entries: [alteredVariable] };
  const selected = selectConditions(s.template, staleVariables, digest, control());
  assert.equal(selected.ok, false);
  assert.match(selected.error.code, /VARIABLE_SNAPSHOT_DIGEST_MISMATCH/);

  assert.equal(s.render.ok, true);
  const alteredSelection = { ...s.conditions.entries[0], selectedTokens: [{ kind: "LITERAL", text: "forged" }] };
  const staleConditions = { ...s.conditions, entries: [alteredSelection] };
  const rendered = renderTemplate(s.template, s.variables, staleConditions, digest, control());
  assert.equal(rendered.ok, false);
  assert.match(rendered.error.code, /CONDITION_SNAPSHOT_DIGEST_MISMATCH/);
});

test("empty branches are valid and unreachable optional conditions remain NOT_EVALUATED", async () => {
  const variables = [
    variable("outer", "BOOLEAN", true, ["CONDITION_REFERENCE"]),
    variable("inner", "BOOLEAN", false, ["CONDITION_REFERENCE"]),
  ];
  const source = "{{gef:if outer}}{{gef:else}}{{gef:if inner}}x{{gef:end}}{{gef:end}}";
  const manifest = baseManifest({ variables, entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const s = await stages({ manifest, files: { "content/readme.txt": source }, bindings: { explicit: [{ id: "outer", value: true }] } });
  assert.equal(s.render.ok, true);
  assert.equal(s.render.value.artifacts[0].byteLength, 0);
  assert.deepEqual(s.conditions.staticConditionRefs, ["inner", "outer"]);
  assert.deepEqual(s.conditions.evaluatedConditionRefs, ["outer"]);
  assert.equal(s.conditions.entries[0].decisions.some((item) => item.variableId === "inner" && item.evaluationStatus === "NOT_EVALUATED"), true);

  const emptyAlternateSource = "{{gef:if outer}}x{{gef:else}}{{gef:end}}";
  const alt = await stages({ manifest, files: { "content/readme.txt": emptyAlternateSource }, bindings: { explicit: [{ id: "outer", value: false }] } });
  assert.equal(alt.render.ok, true);
  assert.equal(alt.render.value.artifacts[0].byteLength, 0);
});

test("all non-BOOLEAN condition declarations fail static condition validation", async () => {
  for (const [type, extra, value] of [
    ["STRING", {}, "yes"],
    ["INTEGER", {}, 1],
    ["ENUM", { enumValues: ["yes", "no"] }, "yes"],
  ]) {
    const manifest = baseManifest({ variables: [variable("flag", type, true, ["CONDITION_REFERENCE"], extra)], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
    const loaded = await loadTemplate(bundle(manifest, { "content/readme.txt": "{{gef:if flag}}x{{gef:end}}" }), digest, control());
    assert.equal(loaded.ok, true);
    const resolved = resolveVariables(loaded.value, { explicit: [{ id: "flag", value }] }, digest, control());
    assert.equal(resolved.ok, true);
    const selected = selectConditions(loaded.value, resolved.value, digest, control());
    assert.equal(selected.ok, false, type);
    assert.equal(selected.error.code, "CONDITION_TYPE_INVALID", type);
  }
});

test("reached boolean value changes conditional decision identity", async () => {
  const manifest = baseManifest({ variables: [variable("flag", "BOOLEAN", true, ["CONDITION_REFERENCE"])], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const files = { "content/readme.txt": "{{gef:if flag}}yes{{gef:else}}no{{gef:end}}" };
  const yes = await stages({ manifest, files, bindings: { explicit: [{ id: "flag", value: true }] } });
  const no = await stages({ manifest, files, bindings: { explicit: [{ id: "flag", value: false }] } });
  assert.notEqual(yes.conditions.conditionalDecisionDigest, no.conditions.conditionalDecisionDigest);
});

test("selected unbound variable blocks rendering while inactive unbound variable does not", async () => {
  const variables = [
    variable("flag", "BOOLEAN", true, ["CONDITION_REFERENCE"]),
    variable("optional", "STRING", false, ["TEXT_CONTENT"]),
  ];
  const manifest = baseManifest({ variables, entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const direct = await stages({ manifest, files: { "content/readme.txt": "{{gef:var optional}}" }, bindings: { explicit: [{ id: "flag", value: true }] } });
  assert.equal(direct.render.ok, false);
  assert.equal(direct.render.error.code, "VARIABLE_UNBOUND_FOR_RENDER");

  const inactive = await stages({ manifest, files: { "content/readme.txt": "{{gef:if flag}}{{gef:var optional}}{{gef:else}}safe{{gef:end}}" }, bindings: { explicit: [{ id: "flag", value: false }] } });
  assert.equal(inactive.render.ok, true);
  assert.equal(bytesToText(inactive.render.value.artifacts[0].content), "safe");
});

test("S04 preserves duplicate target products for S05 and does not resolve by order", async () => {
  const manifest = baseManifest({ entries: [
    { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "same.txt" },
    { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "same.txt" },
  ] });
  const s = await stages({ manifest, files: { "content/a.txt": "a", "content/b.txt": "b" } });
  assert.equal(s.render.ok, true);
  assert.equal(s.render.value.artifacts.length, 2);
  assert.deepEqual(s.render.value.artifacts.map((item) => item.entryId), ["a", "b"]);
  const validated = validateTemplate(s.template, s.render.value, digest, control());
  assert.equal(validated.ok, true);
  assert.equal(validated.value.outcome, "BLOCKED");
});

test("render target/content digest changes only with corresponding output and provenance stays separate", async () => {
  const declaration = variable("value", "STRING", true, ["TEXT_CONTENT"]);
  const manifest = baseManifest({ variables: [declaration], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt" }] });
  const one = await stages({ manifest, files: { "content/readme.txt": "{{gef:var value}}" }, bindings: { explicit: [{ id: "value", value: "same", sourceRef: "profile-a" }] } });
  const two = await stages({ manifest, files: { "content/readme.txt": "{{gef:var value}}" }, bindings: { explicit: [{ id: "value", value: "same", sourceRef: "profile-b" }] } });
  assert.equal(one.render.ok, true);
  assert.equal(two.render.ok, true);
  assert.equal(one.variables.variableValueDigest, two.variables.variableValueDigest);
  assert.notEqual(one.variables.variableResolutionDigest, two.variables.variableResolutionDigest);
  assert.equal(one.render.value.renderSnapshotDigest, two.render.value.renderSnapshotDigest);

  const changed = await stages({ manifest, files: { "content/readme.txt": "{{gef:var value}}!" }, bindings: { explicit: [{ id: "value", value: "same" }] } });
  assert.equal(changed.render.ok, true);
  assert.notEqual(one.render.value.artifacts[0].renderedContentDigest, changed.render.value.artifacts[0].renderedContentDigest);

  const targetManifest = baseManifest({ variables: [variable("name", "STRING", true, ["TARGET_PATH_SEGMENT"])], entries: [{ ...baseManifest().entries[0], targetPattern: "{{gef:var name}}.txt" }] });
  const t1 = await stages({ manifest: targetManifest, bindings: { explicit: [{ id: "name", value: "one" }] } });
  const t2 = await stages({ manifest: targetManifest, bindings: { explicit: [{ id: "name", value: "two" }] } });
  assert.equal(t1.render.ok, true);
  assert.equal(t2.render.ok, true);
  assert.notEqual(t1.render.value.artifacts[0].renderedTargetDigest, t2.render.value.artifacts[0].renderedTargetDigest);
});

test("rendering performs no implicit language escaping based on target extension", async () => {
  const manifest = baseManifest({ variables: [variable("value", "STRING")], entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt", targetPattern: "config.json" }] });
  const s = await stages({ manifest, files: { "content/readme.txt": "{\"v\":\"{{gef:var value}}\"}" }, bindings: { explicit: [{ id: "value", value: "a\"b" }] } });
  assert.equal(s.render.ok, true);
  assert.equal(bytesToText(s.render.value.artifacts[0].content), "{\"v\":\"a\"b\"}");
});

test("render byte budgets account for CRLF expansion before materialization", async () => {
  const manifest = baseManifest({ entries: [{ ...baseManifest().entries[0], sourceRef: "content/readme.txt", textPolicy: { lineEndings: "CRLF" } }] });
  const exact = await stages({ manifest, files: { "content/readme.txt": "a\nb" }, renderControl: control({ budgets: { maxRenderedBytesPerEntry: 4, maxRenderedBytesTotal: 4 } }) });
  assert.equal(exact.render.ok, true);
  assert.equal(exact.render.value.artifacts[0].byteLength, 4);
  const over = await stages({ manifest, files: { "content/readme.txt": "a\nb" }, renderControl: control({ budgets: { maxRenderedBytesPerEntry: 3 } }) });
  assert.equal(over.render.ok, false);
  assert.equal(over.render.error.code, "RENDER_ENTRY_BUDGET_EXCEEDED");
});

test("S05 reuses frozen in-process content and freezes a verified deserialized copy", async () => {
  const s = await stages();
  assert.equal(s.render.ok, true);
  const inProcess = validateTemplate(s.template, s.render.value, digest, control());
  assert.equal(inProcess.ok, true);
  assert.equal(inProcess.value.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  assert.equal(inProcess.value.artifacts[0].contentRef, s.render.value.artifacts[0].content);
  assert.equal(Object.isFrozen(inProcess.value.artifacts[0].contentRef), true);

  const roundTrip = JSON.parse(JSON.stringify(s.render.value));
  const external = validateTemplate(s.template, roundTrip, digest, control());
  assert.equal(external.ok, true);
  assert.equal(external.value.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  assert.notEqual(external.value.artifacts[0].contentRef, roundTrip.artifacts[0].content);
  assert.equal(Object.isFrozen(external.value.artifacts[0].contentRef), true);
});

test("S05 blocks non-NFC and control-character targets and accepts same content on distinct targets", async () => {
  const s = await stages();
  assert.equal(s.render.ok, true);
  for (const target of ["docs/e\u0301.txt", "docs/a\u0001b.txt"]) {
    const artifact = s.render.value.artifacts[0];
    const snapshot = { ...s.render.value, artifacts: [{ ...artifact, logicalTarget: target, renderedTargetDigest: digest.digest(target) }] };
    const result = validateTemplate(s.template, snapshot, digest, control());
    assert.equal(result.ok, true);
    assert.equal(result.value.outcome, "BLOCKED");
  }

  const manifest = baseManifest({ entries: [
    { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "a.txt" },
    { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "b.txt" },
  ] });
  const same = await evaluateTemplate(bundle(manifest, { "content/a.txt": "same", "content/b.txt": "same" }), digest, control());
  assert.equal(same.ok, true);
  assert.equal(same.value.validation.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
});

test("S05 validates aggregate integrity before reporting a mandatory render gap", async () => {
  const s = await stages();
  assert.equal(s.render.ok, true);
  const tampered = validateTemplate(s.template, { ...s.render.value, gaps: ["UNKNOWN"], renderSnapshotDigest: "tampered" }, digest, control());
  assert.equal(tampered.ok, true);
  assert.equal(tampered.value.outcome, "BLOCKED");
  assert.deepEqual(tampered.value.gaps, ["RENDER_SNAPSHOT_DIGEST_MISMATCH"]);

  const unknown = validateTemplate(s.template, { ...s.render.value, gaps: ["UNKNOWN"] }, digest, control());
  assert.equal(unknown.ok, true);
  assert.equal(unknown.value.outcome, "INDETERMINATE");
});

test("validation identity is deterministic and validation cancellation/deadline never yields READY", async () => {
  const s = await stages();
  assert.equal(s.render.ok, true);
  const a = validateTemplate(s.template, s.render.value, digest, control());
  const b = validateTemplate(s.template, s.render.value, digest, control());
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(a.value.templateValidationDigest, b.value.templateValidationDigest);

  const controller = new AbortController();
  controller.abort();
  const cancelled = validateTemplate(s.template, s.render.value, digest, control({ signal: controller.signal }));
  assert.equal(cancelled.ok, false);
  const expired = validateTemplate(s.template, s.render.value, digest, control({ deadlineMs: 10, nowMs: () => 10 }));
  assert.equal(expired.ok, false);
});

test("validation evidence and content budgets fail closed at one-over-limit", async () => {
  const s = await stages();
  assert.equal(s.render.ok, true);
  const evidence = validateTemplate(s.template, s.render.value, digest, control({ budgets: { maxEvidenceEntries: 0 } }));
  assert.equal(evidence.ok, true);
  assert.equal(evidence.value.outcome, "BLOCKED");
  const content = validateTemplate(s.template, s.render.value, digest, control({ budgets: { maxRenderedBytesPerEntry: Math.max(0, s.render.value.artifacts[0].byteLength - 1) } }));
  assert.equal(content.ok, true);
  assert.equal(content.value.outcome, "BLOCKED");
});
