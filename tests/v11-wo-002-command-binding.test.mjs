// GBS-V11-WO-002 correction V3 — H8: authorization must bind the command and mutation purpose.
//
// The authorization port previously carried `commandId` only as error metadata, so a caller could
// pair a valid policy string with an unrelated command identity and still pass the gate. Each case
// here proves an unadmitted command/purpose/policy/owner/surface combination is refused before any
// target-visible effect, at the initial gate and again at the commit barrier.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  ADMITTED_MUTATION_BINDINGS,
  applyGovernedCreate,
  bindingAllowsSurface,
  bindingFor,
  createAuthorizationPort,
  resolveMutationBinding,
} from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");

function tempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "gef-bind-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function request(root, overrides = {}) {
  const content = "{}\n";
  return {
    targetRoot: root,
    relativePath: ".gef/init-state.json",
    content,
    contentFingerprint: sha(content),
    runId: "run-bind",
    transactionId: "tx-bind",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    purpose: "STATE_INIT",
    ...overrides,
  };
}

function noEffect(root, label) {
  assert.equal(existsSync(join(root, ".gef", "init-state.json")), false, `${label}: no artifact may be promoted`);
  assert.equal(existsSync(join(root, ".gef", "adopt-state.json")), false, `${label}: no adopt artifact may exist`);
}

const INIT = bindingFor("gef.init.run", "STATE_INIT");
const ADOPT = bindingFor("gef.adopt.apply", "STATE_ADOPT");
const RECEIPT_INIT = bindingFor("gef.init.run", "RECEIPT_INIT");

/** A plan shape whose own fields determine the binding the port re-derives. */
function planFor(binding, overrides = {}) {
  return {
    authorizationRequirements: [overrides.policyRef ?? binding.policyRef],
    targetBinding: { targetRef: `target:${overrides.targetRef ?? "/admitted"}` },
    mutationSurface: [overrides.surface ?? binding.artifact],
    expectedPreState: [{ key: overrides.surface ?? binding.artifact, owner: overrides.owner ?? binding.moduleOwner }],
    securityClass: "S1_MANAGED_WRITE",
  };
}

// ------------------------------------------------------------- the binding table

test("H8: the admitted binding table is deterministic and self-consistent", () => {
  const keys = ADMITTED_MUTATION_BINDINGS.map((binding) => `${binding.commandId}/${binding.purpose}`);
  assert.equal(new Set(keys).size, keys.length, "each command/purpose pair must be unique");
  assert.deepEqual([...ADMITTED_MUTATION_BINDINGS], ADMITTED_MUTATION_BINDINGS, "the table must be immutable");
  for (const binding of ADMITTED_MUTATION_BINDINGS) {
    assert.ok(["init", "adopt"].includes(binding.verb));
    assert.equal(bindingAllowsSurface(binding, binding.artifact), true);
    assert.equal(resolveMutationBinding({ commandId: binding.commandId, purpose: binding.purpose, policyRef: binding.policyRef, moduleOwner: binding.moduleOwner, surface: binding.artifact }), binding);
  }
  assert.ok(INIT && ADOPT && RECEIPT_INIT);
  assert.equal(INIT.policyRef, "cli:init:managed-write:v1");
  assert.equal(ADOPT.policyRef, "cli:adopt:managed-write:v1");
  assert.equal(RECEIPT_INIT.policyRef, "cli:receipt:managed-write:v1");
  assert.equal(RECEIPT_INIT.moduleOwner, "cli.transport");
  assert.equal(bindingFor("gef.doctor.run", "STATE_INIT"), undefined);
  assert.equal(bindingFor("gef.init.plan", "STATE_INIT"), undefined, "a read-only command has no mutation binding");
});

test("H8: every mismatched combination has no admitted binding", () => {
  const cases = [
    ["init command with adopt policy", { commandId: "gef.init.run", purpose: "STATE_INIT", policyRef: "cli:adopt:managed-write:v1", moduleOwner: "security-reliability-integrations", surface: ".gef/init-state.json" }],
    ["adopt command with init policy", { commandId: "gef.adopt.apply", purpose: "STATE_ADOPT", policyRef: "cli:init:managed-write:v1", moduleOwner: "m48-m54-maintenance", surface: ".gef/adopt-state.json" }],
    ["unknown command with a valid policy", { commandId: "gef.unknown.run", purpose: "STATE_INIT", policyRef: "cli:init:managed-write:v1", moduleOwner: "m48-m54-maintenance", surface: ".gef/init-state.json" }],
    ["state purpose with receipt policy", { commandId: "gef.init.run", purpose: "STATE_INIT", policyRef: "cli:receipt:managed-write:v1", moduleOwner: "m48-m54-maintenance", surface: ".gef/init-state.json" }],
    ["receipt purpose with state policy", { commandId: "gef.init.run", purpose: "RECEIPT_INIT", policyRef: "cli:init:managed-write:v1", moduleOwner: "cli.transport", surface: ".gef/receipts/r.json" }],
    ["module owner mismatch", { commandId: "gef.init.run", purpose: "STATE_INIT", policyRef: "cli:init:managed-write:v1", moduleOwner: "cli.transport", surface: ".gef/init-state.json" }],
    ["surface outside the bound artifact", { commandId: "gef.init.run", purpose: "STATE_INIT", policyRef: "cli:init:managed-write:v1", moduleOwner: "m48-m54-maintenance", surface: ".gef/adopt-state.json" }],
  ];
  for (const [label, query] of cases) assert.equal(resolveMutationBinding(query), undefined, label);
});

test("H8: the port refuses a plan whose fields do not re-derive the bound operation", async (t) => {
  const root = tempRoot(t);
  const port = createAuthorizationPort({ binding: INIT, runId: "run-bind", targetRef: root, decide: () => ({ authorized: true }) });
  const base = { runId: "run-bind", authorizationRefs: [INIT.policyRef] };

  assert.equal((await port.authorize({ ...base, plan: planFor(INIT, { targetRef: root }) })).ok, true);
  // A tampered module owner and a tampered surface both break the binding.
  assert.equal((await port.authorize({ ...base, plan: planFor(INIT, { targetRef: root, owner: "cli.transport" }) })).error.reasonCode, "gef.authorization.binding_not_admitted");
  assert.equal((await port.authorize({ ...base, plan: planFor(INIT, { targetRef: root, surface: ".gef/other.json" }) })).error.reasonCode, "gef.authorization.binding_not_admitted");
});

// --------------------------------------------------- integration, before effects

test("H8: an unadmitted command or purpose is refused before any transaction starts", async (t) => {
  const root = tempRoot(t);

  const unknown = await applyGovernedCreate(request(root, { commandId: "gef.unknown.run" }));
  assert.equal(unknown.ok, false);
  assert.equal(unknown.outcome, "BLOCKED_BEFORE_EFFECT");
  assert.equal(unknown.error.reasonCode, "gef.authorization.binding_not_admitted");
  assert.equal(unknown.error.category, "AUTHORIZATION");
  noEffect(root, "unknown command");
  assert.equal(existsSync(join(root, ".gef-private")), false, "a refusal before the gate must create nothing");

  const wrongPurpose = await applyGovernedCreate(request(root, { commandId: "gef.init.plan", purpose: "STATE_INIT" }));
  assert.equal(wrongPurpose.ok, false);
  assert.equal(wrongPurpose.error.reasonCode, "gef.authorization.binding_not_admitted");
  noEffect(root, "read-only command");
});

test("H8: cross-command and cross-policy pairings are refused with zero target effect", async (t) => {
  const cases = [
    ["init command with adopt policy", { policyRef: "cli:adopt:managed-write:v1", moduleOwner: "security-reliability-integrations" }],
    ["init command with receipt policy", { policyRef: "cli:receipt:managed-write:v1" }],
    ["init state purpose with adopt surface", { relativePath: ".gef/adopt-state.json" }],
  ];
  for (const [label, overrides] of cases) {
    const root = tempRoot(t);
    const applied = await applyGovernedCreate(request(root, overrides));
    assert.equal(applied.ok, false, label);
    assert.equal(applied.outcome, "BLOCKED_BEFORE_EFFECT", label);
    assert.equal(applied.error.category, "AUTHORIZATION", label);
    noEffect(root, label);
  }
});

test("H8: a valid adopt binding still applies, so the table is a gate and not a blocker", async (t) => {
  const root = tempRoot(t);
  const applied = await applyGovernedCreate(
    request(root, { relativePath: ".gef/adopt-state.json", policyRef: "cli:adopt:managed-write:v1", moduleOwner: "security-reliability-integrations", commandId: "gef.adopt.apply", purpose: "STATE_ADOPT" }),
  );
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  assert.equal(applied.outcome, "APPLIED");
  assert.ok(existsSync(join(root, ".gef", "adopt-state.json")));
});

// ------------------------------------------------ binding held at the commit barrier

test("H8: the binding is re-derived and enforced at the commit barrier", async (t) => {
  const root = tempRoot(t);
  const real = createAuthorizationPort({ binding: INIT, runId: "run-bind", targetRef: root });
  let calls = 0;
  const tampering = {
    authorize: (request_) => {
      calls += 1;
      // The kernel authorizes at the initial gate and again at the commit barrier. Tampering only
      // on the second call proves the barrier re-derives the binding instead of trusting the first.
      if (calls === 1) return real.authorize(request_);
      return real.authorize({ ...request_, plan: { ...request_.plan, mutationSurface: [".gef/other.json"] } });
    },
  };

  const applied = await applyGovernedCreate(request(root), { authorization: tampering });

  assert.equal(calls, 2, "the commit barrier must re-authorize");
  assert.equal(applied.ok, false);
  assert.equal(applied.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
  // The kernel projects a barrier denial through its own reason code; the CLI preserves it rather
  // than rewriting the engine's verdict.
  assert.equal(applied.error.category, "AUTHORIZATION");
  assert.match(applied.error.reasonCode, /commit_barrier_authorization_denied/);
  assert.equal(applied.error.summary, "No admitted authorization binding for gef.init.run/STATE_INIT over .gef/other.json");
  noEffect(root, "barrier tamper");
  assert.equal(existsSync(join(root, ".gef-private", "tx-bind")), false, "staging must be cleaned up");
});

test("H8: the decision is evaluated in the bound operation context", async (t) => {
  const root = tempRoot(t);
  const seen = [];
  const applied = await applyGovernedCreate(request(root), {
    authorization: createAuthorizationPort({
      binding: INIT,
      runId: "run-bind",
      targetRef: root,
      decide: (binding) => {
        seen.push(`${binding.commandId}/${binding.purpose}/${binding.classification}`);
        return { authorized: true };
      },
    }),
  });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  assert.deepEqual(seen, ["gef.init.run/STATE_INIT/MUTATING", "gef.init.run/STATE_INIT/MUTATING"], "both calls see the bound operation context");
});
