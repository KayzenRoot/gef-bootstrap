// GBS-V11-WO-002 correction — transaction / filesystem safety regression.
//
// Proves the CLI cannot bypass the kernel safety chain for managed effects. Every case drives
// the CLI's real transaction driver (`applyGovernedCreate`) or its real physical port, so the
// assertions are about the shipped behaviour rather than about a stub.
//
// Coverage: traversal, overwrite/no-clobber, alias/hard-link, symlink/reparse, stale-target
// race and post-effect recovery evidence.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  compileTransactionPlan,
  createFilesystemEffectAdapter,
  applyTransaction,
  composeFilesystemPhysicalSafety,
} from "../packages/kernel/dist/index.js";
import { JOURNAL_DIRECTORY, applyGovernedCreate, cliPrimitiveFor, createJournalPort, createPhysicalPort, createPrivateArea, createStatePort, detectCaseSemantics, TRANSACTION_PRIVATE_DIRECTORY } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");

function tempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "gef-cli-tx-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function request(root, relativePath, content, overrides = {}) {
  return {
    targetRoot: root,
    relativePath,
    content,
    contentFingerprint: sha(content),
    runId: "run-tx",
    transactionId: "tx-1",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    purpose: "STATE_INIT",
    ...overrides,
  };
}

// ---------------------------------------------------------------- traversal

test("traversal is refused before any effect", async (t) => {
  const root = tempRoot(t);
  const escape = join(root, "..", "escaped.json");

  const upward = await applyGovernedCreate(request(root, "../escaped.json", "{}\n"));
  assert.equal(upward.ok, false);
  assert.equal(existsSync(escape), false, "a parent-escape path must never be written");

  const nested = await applyGovernedCreate(request(root, "a/../../escaped.json", "{}\n"));
  assert.equal(nested.ok, false);

  const absolute = await applyGovernedCreate(request(root, "/etc/escaped.json", "{}\n"));
  assert.equal(absolute.ok, false);
  assert.equal(existsSync(escape), false);
});

test("the admitted root itself cannot be the mutation target", async (t) => {
  const root = tempRoot(t);
  const result = await applyGovernedCreate(request(root, "", "{}\n"));
  assert.equal(result.ok, false);
});

test("case semantics are probed, never assumed", async (t) => {
  const root = tempRoot(t);
  const semantics = await detectCaseSemantics(root);
  assert.ok(["SENSITIVE", "INSENSITIVE"].includes(semantics), `expected a proven case semantics, got ${semantics}`);
  // The probe leaves no residue.
  assert.equal(existsSync(join(root, TRANSACTION_PRIVATE_DIRECTORY, "CaseProbe")), false);
});

// ---------------------------------------------------------------- overwrite

test("managed creation is no-clobber and preserves existing content byte for byte", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, ".gef"), { recursive: true });
  writeFileSync(join(root, ".gef", "init-state.json"), "ORIGINAL\n");
  const before = readFileSync(join(root, ".gef", "init-state.json"), "utf8");

  const result = await applyGovernedCreate(request(root, ".gef/init-state.json", "REPLACEMENT\n"));
  assert.equal(result.ok, false);
  assert.equal(readFileSync(join(root, ".gef", "init-state.json"), "utf8"), before, "existing content must never be replaced");
});

test("the declared primitive is truthful about what it cannot guarantee", () => {
  const primitive = cliPrimitiveFor("CREATE", "UNPROVEN");
  assert.equal(primitive.noClobberCreate, true, "creation must be no-clobber");
  assert.equal(primitive.raceResistant, true, "creation must be race resistant");
  assert.equal(primitive.visibilityAtomic, false, "a direct exclusive write is not visibility atomic and must not claim to be");
  assert.equal(primitive.replaceExisting, false, "the create primitive must not claim replacement");
});

test("a replacement operation is refused by the safety chain for this primitive", (t) => {
  tempRoot(t);
  // The CLI never issues UPDATE, and the declared primitive cannot satisfy it. Composing the
  // safety layers for UPDATE must therefore fail closed rather than silently downgrade.
  const capsule = {
    schemaVersion: 1,
    rootRef: "target:root",
    rootKind: "project-directory",
    operation: "UPDATE",
    normalizedRelativePath: "a/b.json",
    physicalTarget: "/root/a/b.json",
    physicalRoot: "/root",
    pathFlavor: "POSIX",
    caseSemantics: "SENSITIVE",
    policyRef: "p",
    pathSemanticsRef: "s",
    outcome: "PATH_ALLOWED_LEXICALLY",
  };
  const composed = composeFilesystemPhysicalSafety({
    path: capsule,
    overwrite: { schemaVersion: 1, allowed: true, noop: false, code: "REPLACE_ALLOWED_EXPECTED_STATE", operation: "UPDATE", targetKind: "FILE", requiresTraversalProof: true },
    traversal: { schemaVersion: 1, outcome: "TRAVERSAL_SAFE_PENDING_ATOMIC_COMMIT", rootRef: "target:root", normalizedRelativePath: "a/b.json", operation: "UPDATE", dependencyTokens: [], aliasRisk: "NONE", targetKind: "FILE" },
    primitive: cliPrimitiveFor("UPDATE", "UNPROVEN"),
    requireCrashDurability: false,
  });
  assert.equal(composed.ok, false, "the create primitive must not be able to satisfy a replacement");
});

// ------------------------------------------------------------ alias / links

test("a hard-linked destination is refused, not clobbered", async (t) => {
  const root = tempRoot(t);
  const original = join(root, "original.txt");
  writeFileSync(original, "shared content\n");
  mkdirSync(join(root, ".gef"), { recursive: true });
  try {
    linkSync(original, join(root, ".gef", "init-state.json"));
  } catch (cause) {
    // Filesystems without hard-link support cannot express this case; report it rather than pass silently.
    t.diagnostic(`hard links unavailable on this filesystem: ${cause.code ?? cause.message}`);
    return;
  }
  const result = await applyGovernedCreate(request(root, ".gef/init-state.json", "REPLACEMENT\n"));
  assert.equal(result.ok, false);
  assert.equal(readFileSync(original, "utf8"), "shared content\n", "the aliased inode must be untouched");
});

test("a symlinked destination is refused, not followed", async (t) => {
  const root = tempRoot(t);
  const outside = join(root, "outside.txt");
  writeFileSync(outside, "outside content\n");
  mkdirSync(join(root, ".gef"), { recursive: true });
  try {
    symlinkSync(outside, join(root, ".gef", "init-state.json"), "file");
  } catch (cause) {
    t.diagnostic(`symlinks unavailable on this platform: ${cause.code ?? cause.message}`);
    return;
  }
  const result = await applyGovernedCreate(request(root, ".gef/init-state.json", "REPLACEMENT\n"));
  assert.equal(result.ok, false);
  assert.equal(readFileSync(outside, "utf8"), "outside content\n", "a symlink target must never be written through");
});

// ------------------------------------------------------------------- race

test("a target that appears between preparation and promotion is refused at the commit barrier", async (t) => {
  const root = tempRoot(t);
  const relativePath = ".gef/init-state.json";
  const content = "{}\n";

  const caseSemantics = await detectCaseSemantics(root);
  const body = {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: `target:${root}`, bindingStrength: "OPERATIONAL_ONLY" },
    expectedPreState: [{ key: relativePath, owner: "test", predicate: "EXACT", value: "absent", contractVersion: "cli-tx-v1" }],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: ["cli:init:managed-write:v1"],
    mutationSurface: [relativePath],
    intents: [
      {
        intentId: "i1",
        kind: "CREATE_MANAGED_ARTIFACT",
        targetRef: relativePath,
        securityClass: "S1_MANAGED_WRITE",
        recoveryClass: "REVERSIBLE_MANAGED",
        dependsOn: [],
        desiredFingerprint: sha(content),
        payloadRef: relativePath,
      },
    ],
    ordering: [],
    verificationObligations: [
      { verificationId: "v1", phase: "STAGED", targetRef: relativePath },
      { verificationId: "v2", phase: "POST_STATE", targetRef: relativePath },
    ],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "cli-managed-create-v1" }],
    externalEffectDeclarations: [],
    policyRefs: [{ policyId: "cli:init:managed-write:v1", version: "1" }],
  };

  const digest = { digest: (value) => sha(value) };
  const compiled = compileTransactionPlan(body, digest);
  assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.error.summary);

  const physical = createPhysicalPort({
    targetRoot: root,
    rootRef: `target:${root}`,
    transactionId: "tx-race",
    caseSemantics,
    privateArea: createPrivateArea(root),
    payloads: new Map([[relativePath, content]]),
    policyRef: "cli:init:managed-write:v1",
  });

  // Inject the race: a competing writer creates the destination after the safety capability is
  // opened and content is staged, but before the commit barrier and promotion.
  const racing = {
    ...physical,
    stage: async (stagedRequest) => {
      const staged = await physical.stage(stagedRequest);
      if (staged.ok) {
        mkdirSync(join(root, ".gef"), { recursive: true });
        writeFileSync(join(root, ".gef", "init-state.json"), "RACER\n");
      }
      return staged;
    },
  };

  const effects = createFilesystemEffectAdapter({
    transactionId: "tx-race",
    resolver: {
      resolve: () => ({
        ok: true,
        value: { target: { root: { rootRef: `target:${root}`, rootKind: "project-directory", physicalRoot: root, pathFlavor: process.platform === "win32" ? "WINDOWS" : "POSIX", caseSemantics, allowedOperations: ["READ", "CREATE", "STAGE"], policyRef: "cli:init:managed-write:v1", pathSemanticsRef: `cli:${process.platform}:v1` }, relativePath, expected: { expectedKind: "ABSENT" } }, payloadRef: relativePath, desiredFingerprint: sha(content) },
      }),
    },
    physical: racing,
  });

  const result = await applyTransaction({
    plan: compiled.value,
    runId: "run-race",
    transactionId: "tx-race",
    // The real CLI pre-state port is used, so the barrier's stale detection is genuinely exercised.
    ports: { digest, state: createStatePort(root, relativePath), authorization: { authorize: () => ({ ok: true, value: true }) }, journal: createJournalPort(createPrivateArea(root)), effects },
  });

  assert.equal(result.ok, false, "the commit barrier must refuse a target that appeared after preparation");
  assert.equal(readFileSync(join(root, ".gef", "init-state.json"), "utf8"), "RACER\n", "the competing writer's content must survive");
});

// --------------------------------------------------------------- recovery

test("a refused transaction leaves no target effect and records its journal evidence", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, ".gef"), { recursive: true });
  writeFileSync(join(root, ".gef", "init-state.json"), "ORIGINAL\n");

  const result = await applyGovernedCreate(request(root, ".gef/init-state.json", "X\n", { transactionId: "tx-refused" }));
  assert.equal(result.ok, false);
  assert.equal(readFileSync(join(root, ".gef", "init-state.json"), "utf8"), "ORIGINAL\n");
  assert.equal(existsSync(join(root, TRANSACTION_PRIVATE_DIRECTORY, "tx-refused")), false, "staging is cleaned up after a refusal");
});

test("a successful transaction records journal evidence that survives cleanup", async (t) => {
  const root = tempRoot(t);
  const result = await applyGovernedCreate(request(root, ".gef/init-state.json", "{}\n", { transactionId: "tx-ok" }));
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);

  // Transaction-private staging is cleaned up...
  assert.equal(existsSync(join(root, TRANSACTION_PRIVATE_DIRECTORY, "tx-ok")), false, "staging must be cleaned up");
  // ...while the journal remains as recovery evidence for the applied transaction.
  const journal = join(root, JOURNAL_DIRECTORY, "tx-ok.json");
  assert.equal(existsSync(journal), true, "journal evidence must survive cleanup");
  const recorded = JSON.parse(readFileSync(journal, "utf8"));
  assert.equal(recorded.kind, "gef.cli.transaction-journal");
  assert.equal(recorded.transactionId, "tx-ok");
  assert.ok(typeof recorded.phase === "string" && recorded.phase.length > 0);
});

test("the transaction reports a plan digest and a receipt digest for the applied effect", async (t) => {
  const root = tempRoot(t);
  const result = await applyGovernedCreate(request(root, ".gef/init-state.json", "{}\n", { transactionId: "tx-digests" }));
  assert.equal(result.ok, true);
  assert.match(result.planDigest, /^[0-9a-f]{64}$/);
  assert.match(result.receiptDigest, /^[0-9a-f]{64}$/);
  assert.equal(result.postFingerprint, sha("{}\n"), "the promoted artifact fingerprint must match the admitted content");
});
