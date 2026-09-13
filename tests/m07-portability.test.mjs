import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTemplate, validateLogicalFileTarget } from "../packages/template-engine/dist/index.js";
import { baseManifest, bundle, bytesToText, control, digest } from "./m07-fixture.mjs";

test("explicit LF rendering is host-independent", async () => {
  const variable = { variableId: "name", type: "STRING", required: true, allowedContexts: ["TEXT_CONTENT", "TARGET_PATH_SEGMENT"] };
  const manifest = baseManifest({
    variables: [variable],
    entries: [{ ...baseManifest().entries[0], targetPattern: "docs/{{gef:var name}}.txt", textPolicy: { lineEndings: "LF" } }],
  });
  const result = await evaluateTemplate(bundle(manifest, { "content/readme.txt": "a\r\nb\r{{gef:var name}}\n" }), digest, control(), { bindings: { explicit: [{ id: "name", value: "portable" }] } });
  assert.equal(result.ok, true, result.ok ? "" : result.error.code);
  assert.equal(result.value.validation.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  assert.equal(result.value.render.artifacts[0].logicalTarget, "docs/portable.txt");
  assert.equal(bytesToText(result.value.render.artifacts[0].content), "a\nb\nportable\n");
});

test("portable logical target policy rejects host-specific forms on every runner", () => {
  for (const target of ["C:/temp/x", "//server/share/x", "a\\b", "CON.txt", "a/NUL.log", "a/../b"]) {
    assert.equal(validateLogicalFileTarget(target, control().budgets), false, target);
  }
  assert.equal(validateLogicalFileTarget("docs/Résumé.txt", control().budgets), true);
  assert.equal(validateLogicalFileTarget("docs/Re\u0301sume\u0301.txt", control().budgets), false);
});

test("portable collision baseline is independent of host filesystem case behavior", async () => {
  const manifest = baseManifest({ entries: [
    { entryId: "a", kind: "TEXT_TEMPLATE", sourceRef: "content/a.txt", targetPattern: "Docs/Readme.md" },
    { entryId: "b", kind: "TEXT_TEMPLATE", sourceRef: "content/b.txt", targetPattern: "docs/README.md" },
  ] });
  const result = await evaluateTemplate(bundle(manifest, { "content/a.txt": "a", "content/b.txt": "b" }), digest, control());
  assert.equal(result.ok, true);
  assert.equal(result.value.validation.outcome, "BLOCKED");
  assert.equal(result.value.validation.gaps.includes("TARGET_CASE_ALIAS_COLLISION"), true);
});
