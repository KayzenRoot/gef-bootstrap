import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTemplate, loadTemplate, renderTemplate, resolveVariables, selectConditions, validateTemplate } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, control, digest, sourcePort } from "./m07-fixture.mjs";

async function evaluated(manifest = baseManifest(), files = {}) {
  const result = await evaluateTemplate(bundle(manifest, files), digest, control());
  assert.equal(result.ok, true, result.ok ? "" : result.error.code);
  return result.value;
}

async function renderOnly(manifest = baseManifest(), files = {}) {
  const port = bundle(manifest, files);
  const template = await loadTemplate(port, digest, control());
  assert.equal(template.ok, true);
  const variables = resolveVariables(template.value, undefined, digest, control());
  assert.equal(variables.ok, true);
  const conditions = selectConditions(template.value, variables.value, digest, control());
  assert.equal(conditions.ok, true);
  const render = renderTemplate(template.value, variables.value, conditions.value, digest, control());
  assert.equal(render.ok, true);
  return { template: template.value, render: render.value };
}

test("complete valid snapshot becomes VALIDATED_FOR_EFFECT_PLANNING", async () => {
  const result = await evaluated();
  assert.equal(result.validation.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  assert.deepEqual(result.validation.downstreamRequirements, ["M05_CURRENT_STATE_CLASSIFICATION", "M06_PHYSICAL_PATH_AUTHORITY"]);
  assert.equal(result.validation.artifacts.length, 1);
  assert.equal("operation" in result.validation.artifacts[0], false);
});

test("partial extra duplicate and kind-mismatched artifacts block", async () => {
  const { template, render } = await renderOnly();
  const cases = [
    { ...render, artifacts: [] },
    { ...render, artifacts: [...render.artifacts, { ...render.artifacts[0], entryId: "extra" }] },
    { ...render, artifacts: [render.artifacts[0], render.artifacts[0]] },
    { ...render, artifacts: [{ ...render.artifacts[0], kind: "BINARY_COPY" }] },
  ];
  for (const snapshot of cases) {
    const result = validateTemplate(template, snapshot, digest, control());
    assert.equal(result.ok, true);
    assert.equal(result.value.outcome, "BLOCKED");
  }
});

test("mandatory render gap yields INDETERMINATE not guessed success", async () => {
  const { template, render } = await renderOnly();
  const result = validateTemplate(template, { ...render, gaps: ["UNKNOWN_REQUIRED_FACT"] }, digest, control());
  assert.equal(result.ok, true);
  assert.equal(result.value.outcome, "INDETERMINATE");
});

test("tampered content target length and aggregate digest are detected", async () => {
  const { template, render } = await renderOnly();
  const artifact = render.artifacts[0];
  const cases = [
    { ...render, artifacts: [{ ...artifact, content: [...artifact.content, 1] }] },
    { ...render, artifacts: [{ ...artifact, logicalTarget: "other.md" }] },
    { ...render, artifacts: [{ ...artifact, byteLength: artifact.byteLength + 1 }] },
    { ...render, renderSnapshotDigest: "tampered" },
  ];
  for (const snapshot of cases) {
    const result = validateTemplate(template, snapshot, digest, control());
    assert.equal(result.ok, true);
    assert.equal(result.value.outcome, "BLOCKED");
  }
});

test("invalid final logical target classes block", async () => {
  const invalidTargets = ["", "/abs", "C:/x", "//server/share", "a\\b", "a//b", "a/./b", "a/../b", "a/<bad>", "a/con.txt", "a/NUL", "a/name. ", "a/"];
  for (const target of invalidTargets) {
    const { template, render } = await renderOnly();
    const artifact = render.artifacts[0];
    const bytes = Uint8Array.from(artifact.content);
    const snapshot = {
      ...render,
      artifacts: [{ ...artifact, logicalTarget: target, renderedTargetDigest: digest.digest(target), renderedContentDigest: digest.digest(bytes), byteLength: bytes.length }],
    };
    const result = validateTemplate(template, snapshot, digest, control());
    assert.equal(result.ok, true, target);
    assert.equal(result.value.outcome, "BLOCKED", target);
  }
});

test("exact duplicate and ASCII-case aliases collide even with identical content", async () => {
  for (const pair of [["Readme.md", "Readme.md"], ["Readme.md", "README.md"]]) {
    const entries = [
      { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: pair[0] },
      { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: pair[1] },
    ];
    const manifest = baseManifest({ entries });
    const result = await evaluateTemplate(bundle(manifest, { "content/a.txt": "x", "content/b.txt": "x" }), digest, control());
    assert.equal(result.ok, true);
    assert.equal(result.value.validation.outcome, "BLOCKED");
  }
});

test("exact and case-folded ancestor descendant collisions block while siblings remain valid", async () => {
  for (const pair of [["config", "config/app.json"], ["Config", "config/app.json"]]) {
    const manifest = baseManifest({ entries: [
      { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: pair[0] },
      { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: pair[1] },
    ] });
    const result = await evaluateTemplate(bundle(manifest, { "content/a.txt": "a", "content/b.txt": "b" }), digest, control());
    assert.equal(result.ok, true);
    assert.equal(result.value.validation.outcome, "BLOCKED");
  }
  const siblings = baseManifest({ entries: [
    { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "config/a.json" },
    { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "config/b.json" },
  ] });
  const result = await evaluateTemplate(bundle(siblings, { "content/a.txt": "a", "content/b.txt": "b" }), digest, control());
  assert.equal(result.ok, true);
  assert.equal(result.value.validation.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
});

test("artifact array order does not change validation outcome or identity", async () => {
  const manifest = baseManifest({ entries: [
    { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "a.txt" },
    { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "b.txt" },
  ] });
  const { template, render } = await renderOnly(manifest, { "content/a.txt": "a", "content/b.txt": "b" });
  const a = validateTemplate(template, render, digest, control());
  const b = validateTemplate(template, { ...render, artifacts: [...render.artifacts].reverse() }, digest, control());
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(a.value.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  assert.equal(b.value.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  assert.equal(a.value.templateValidationDigest, b.value.templateValidationDigest);
});

test("validation is brownfield-local and source port is never asked about project occupancy", async () => {
  const port = bundle();
  const result = await evaluateTemplate(port, digest, control());
  assert.equal(result.ok, true);
  assert.deepEqual(port.calls, ["template.json", "content/readme.txt"]);
  assert.equal(port.calls.some((ref) => ref.includes("project") || ref.includes("existing")), false);
});

test("template omission does not create deletion candidates", async () => {
  const result = await evaluated();
  const artifact = result.validation.artifacts[0];
  assert.deepEqual(Object.keys(artifact).sort(), ["byteLength", "contentRef", "entryId", "kind", "logicalTarget", "renderedContentDigest", "renderedTargetDigest", "targetCollisionKey"].sort());
  assert.equal(result.validation.downstreamRequirements.includes("M05_CURRENT_STATE_CLASSIFICATION"), true);
});
