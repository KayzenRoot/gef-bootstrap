// GBS-V11-WO-002 correction V2 — H5: transaction authorization must be a real decision.
//
// The transaction engine authorizes twice: once at the initial gate and again at the commit
// barrier after staging. These cases prove the CLI's authorization port actually decides, that
// the binding is enforced, and that a denial — initial or at the barrier — produces zero
// target-visible effect.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { JOURNAL_DIRECTORY, TRANSACTION_PRIVATE_DIRECTORY, applyGovernedCreate, createAuthorizationPort } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");

function tempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "gef-authz-"));
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
    runId: "run-authz",
    transactionId: "tx-authz",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    ...overrides,
  };
}

const allow = () => ({ ok: true, value: true });
/** The `decide` hook returns an AuthorizationDecision, not a kernel GateResult. */
const decideAllow = () => ({ authorized: true });
const deny = (reason) => ({ ok: false, error: { schemaVersion: 1, id: "test", category: "AUTHORIZATION", reasonCode: `gef.authorization.${reason}`, severity: "ERROR", summary: `denied: ${reason}`, retryability: "REQUIRES_NEW_AUTHORIZATION", recoverability: "NONE_REQUIRED", effectStatus: "NONE", terminal: "BLOCKED", causes: [], evidenceRefs: [], remediations: [], metadata: {} } });

function noEffect(root, label) {
  assert.equal(existsSync(join(root, ".gef")), false, `${label}: no governed artifact may exist`);
  const privateRoot = join(root, TRANSACTION_PRIVATE_DIRECTORY);
  if (existsSync(privateRoot)) {
    const probes = join(privateRoot, "probes");
    assert.equal(existsSync(probes), false, `${label}: no probe residue`);
  }
}

// ------------------------------------------------------- the production default

test("H5: the default authorization port consults the verified safety engine", async (t) => {
  const root = tempRoot(t);
  const port = createAuthorizationPort({ policyRef: "cli:init:managed-write:v1", runId: "run-authz", commandId: "gef.init.run", targetRef: root });
  const decision = await port.authorize({
    runId: "run-authz",
    authorizationRefs: ["cli:init:managed-write:v1"],
    plan: { authorizationRequirements: ["cli:init:managed-write:v1"], targetBinding: { targetRef: `target:${root}` } },
  });
  assert.equal(decision.ok, true, decision.ok ? "" : decision.error.summary);
});

test("H5: an unprovable authorization decision is a denial, never an allow", async (t) => {
  const root = tempRoot(t);
  const denying = createAuthorizationPort({
    policyRef: "cli:init:managed-write:v1",
    runId: "run-authz",
    commandId: "gef.init.run",
    targetRef: root,
    decide: () => ({ authorized: false, reason: "policy_unproven" }),
  });
  const denied = await denying.authorize({
    runId: "run-authz",
    authorizationRefs: ["cli:init:managed-write:v1"],
    plan: { authorizationRequirements: ["cli:init:managed-write:v1"], targetBinding: { targetRef: `target:${root}` } },
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.error.category, "AUTHORIZATION");

  const throwing = createAuthorizationPort({
    policyRef: "cli:init:managed-write:v1",
    runId: "run-authz",
    commandId: "gef.init.run",
    targetRef: root,
    decide: () => {
      throw new Error("decision capability unavailable");
    },
  });
  const failed = await throwing.authorize({
    runId: "run-authz",
    authorizationRefs: ["cli:init:managed-write:v1"],
    plan: { authorizationRequirements: ["cli:init:managed-write:v1"], targetBinding: { targetRef: `target:${root}` } },
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.error.reasonCode, "gef.authorization.decision_unavailable");
});

test("H5: the authorization binding rejects mismatched run, policy, requirement and target", async (t) => {
  const root = tempRoot(t);
  const base = { policyRef: "cli:init:managed-write:v1", runId: "run-authz", commandId: "gef.init.run", targetRef: root, decide: decideAllow };
  const good = { authorizationRefs: ["cli:init:managed-write:v1"], plan: { authorizationRequirements: ["cli:init:managed-write:v1"], targetBinding: { targetRef: `target:${root}` } } };

  assert.equal((await createAuthorizationPort(base).authorize({ runId: "run-authz", ...good })).ok, true);
  assert.equal((await createAuthorizationPort(base).authorize({ runId: "other-run", ...good })).error.reasonCode, "gef.authorization.run_mismatch");
  assert.equal((await createAuthorizationPort(base).authorize({ runId: "run-authz", ...good, authorizationRefs: [] })).error.reasonCode, "gef.authorization.policy_not_admitted");
  assert.equal(
    (await createAuthorizationPort(base).authorize({ runId: "run-authz", authorizationRefs: ["cli:init:managed-write:v1"], plan: { authorizationRequirements: [], targetBinding: { targetRef: `target:${root}` } } })).error.reasonCode,
    "gef.authorization.requirement_not_declared",
  );
  assert.equal(
    (await createAuthorizationPort(base).authorize({ runId: "run-authz", authorizationRefs: ["cli:init:managed-write:v1"], plan: { authorizationRequirements: ["cli:init:managed-write:v1"], targetBinding: { targetRef: "target:/somewhere/else" } } })).error.reasonCode,
    "gef.authorization.target_mismatch",
  );

  const revoked = await createAuthorizationPort({ ...base, isRevoked: () => true }).authorize({ runId: "run-authz", ...good });
  assert.equal(revoked.error.reasonCode, "gef.authorization.revoked");
});

// ------------------------------------------------- initial denial, no effect

test("H5: an initial authorization denial blocks before any effect and starts no transaction", async (t) => {
  const root = tempRoot(t);
  const applied = await applyGovernedCreate(request(root), { authorization: { authorize: () => deny("initial_denied") } });

  assert.equal(applied.ok, false);
  assert.equal(applied.outcome, "BLOCKED_BEFORE_EFFECT");
  assert.equal(applied.error.category, "AUTHORIZATION");
  noEffect(root, "initial denial");
  assert.equal(existsSync(join(root, JOURNAL_DIRECTORY)), false, "a transaction that never started must leave no journal");
});

// ----------------------------- revocation between staging and commit barrier

test("H5: authorization revoked before the commit barrier aborts with zero target effect", async (t) => {
  const root = tempRoot(t);
  let calls = 0;
  const authorization = {
    authorize: () => {
      calls += 1;
      // The kernel authorizes at the initial gate and again at the commit barrier. Approving only
      // the first call models an authorization that lapses while the transaction is staging.
      return calls === 1 ? allow() : deny("barrier_revoked");
    },
  };

  const applied = await applyGovernedCreate(request(root), { authorization });

  assert.equal(calls, 2, "the commit barrier must re-authorize");
  assert.equal(applied.ok, false);
  assert.equal(applied.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
  assert.equal(applied.error.category, "AUTHORIZATION");
  assert.ok(!existsSync(join(root, ".gef", "init-state.json")), "no artifact may be promoted");
  assert.equal(existsSync(join(root, TRANSACTION_PRIVATE_DIRECTORY, "tx-authz")), false, "staging must be cleaned up");

  // Abort evidence is still recorded for the transaction that did start.
  const journals = existsSync(join(root, JOURNAL_DIRECTORY)) ? readdirSync(join(root, JOURNAL_DIRECTORY)) : [];
  assert.equal(journals.length, 1, "the aborted transaction must leave journal evidence");
  const recorded = JSON.parse(readFileSync(join(root, JOURNAL_DIRECTORY, journals[0]), "utf8"));
  assert.equal(recorded.transactionId, "tx-authz");
});

test("H5: an approved transaction still applies, so the port is a gate and not a blocker", async (t) => {
  const root = tempRoot(t);
  let calls = 0;
  const applied = await applyGovernedCreate(request(root), {
    authorization: {
      authorize: () => {
        calls += 1;
        return allow();
      },
    },
  });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  assert.equal(applied.outcome, "APPLIED");
  assert.equal(calls, 2, "both the initial gate and the commit barrier authorize");
  assert.ok(existsSync(join(root, ".gef", "init-state.json")));
});
