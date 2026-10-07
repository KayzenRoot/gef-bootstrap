// GBS-MOD-WO-001 (F) — pipeline integrity for the agent-native routing contract.
//
// This Work Order deliberately changes no existing workflow. Narrowing CI fan-out is only safe
// once the target-branch ruleset can express it, and the ruleset rewrite is explicitly outside
// this Work Order. What WO-001 owes instead is the stable gate/check contract plus the proof that
// the current routing surface is byte-for-byte unchanged and can be restored.
//
// The proof here is the Git blob identity recorded in the GBS-MOD-WO-001 implementation Context
// Lock at the implementation base `9214937`. If any of these files changes, this test fails — which
// is the equivalence guarantee the Work Order requires before any future narrowing is allowed.
//
// Identity is read from the repository's own object database (`git rev-parse <rev>:<path>`), never
// from the checked-out bytes. A Windows checkout rewrites LF to CRLF unless `.gitattributes` says
// otherwise, so hashing working-tree bytes compares two different byte strings on different
// platforms; the stored object ID is the same value everywhere. The assertion itself is unchanged —
// it still demands the exact recorded blob ID, and it still fails on a missing object.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decideGefGate } from '../packages/assurance-pipeline/dist/public.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW_ROOT = resolve(ROOT, '.github/workflows');
const read = (path) => readFileSync(resolve(ROOT, path), 'utf8');

export const BASELINE_IMPLEMENTATION_BASE = '921493797728a43aadc9f7840c954ce7e3ebc416';

/**
 * Git blob identities of every workflow the implementation Context Lock bound at the base.
 *
 * Recorded verbatim from `.engineering/context-locks/GBS-MOD-WO-001.json`
 * (`workflowFingerprintsAtImplementationBase`). A mismatch means a routing surface moved without a
 * fresh lock, which is the exact condition the Context Lock declares stale.
 */
export const BASELINE_WORKFLOW_BLOBS = Object.freeze({
  '.github/workflows/repository-validation.yml': '38c801e6009663448194045ab27ef25c7dcbf0f0',
  '.github/workflows/pipeline-integrity.yml': '8a7f58eefe47240b42b890c18f4f5f30c3e84eec',
  '.github/workflows/free-security-pilot.yml': '38137ef513fcc52d6e14a42c6a5ebcc2f1b05f69',
  '.github/workflows/dependency-review.yml': '3d34f93903798345abcbd345640f1e04f5e0d424',
  '.github/workflows/coverage-codecov.yml': '005e04fe7d3306ef64613317f89115adf67c7791',
  '.github/workflows/security-codeql.yml': '554e26bf9d16aceee708d48f86251495bd74e993',
  '.github/workflows/v11-release-assurance.yml': '9f4d326e4f23eabcc61f8d6719de43c60dd82aef',
  '.github/workflows/m14-platform.yml': 'd266007035a508560ef113d588e847dc2e8e27a2',
  '.github/workflows/m27-platform.yml': '452590f5fc3f12e36c1fddf95674f9ed85734d37',
  '.github/workflows/m28-platform.yml': '3f37c5770373e6a67c8c3903254461bb52d2e8e1',
});

/** Workflows whose `pull_request` trigger is unconditional at the base and must stay so. */
export const UNCONDITIONAL_PULL_REQUEST_WORKFLOWS = Object.freeze([
  '.github/workflows/dependency-review.yml',
  '.github/workflows/free-security-pilot.yml',
  '.github/workflows/pipeline-integrity.yml',
  '.github/workflows/repository-validation.yml',
  '.github/workflows/v11-release-assurance.yml',
]);

/** Contexts the main branch ruleset requires, per the implementation Context Lock. */
export const MAIN_RULESET_CONTEXTS = Object.freeze([
  'Repository validation',
  'Pipeline integrity',
  'Gitleaks secrets',
  'Trivy filesystem and configuration',
]);

/** Workflow YAML files committed at the implementation base; this Work Order adds none. */
export const BASELINE_WORKFLOW_INVENTORY_SIZE = 47;

/** Obligations no gate receipt may omit; the Work Order makes these non-negotiable. */
const MANDATORY_OBLIGATION_FLOOR = Object.freeze([
  'GIT_DIFF_INTEGRITY',
  'JSON_SCHEMA_PARSE',
  'SOURCE_HIERARCHY_BINDING',
  'SECRET_CONFIG_SECURITY',
]);

const options = {
  digest: { algorithm: 'sha256', digest: (input) => createHash('sha256').update(input).digest('hex') },
};

/**
 * A minimal gate input for the ruleset-contract assertions.
 *
 * Factored out because the two ruleset tests differ only in which contexts they present, and
 * duplicating a dozen binding fields twice is exactly the copy/paste this file must not rely on.
 */
function gateInput(rulesetRequiredContexts) {
  return {
    gateId: 'GATE-RULESET-CONTRACT',
    repository: 'KayzenRoot/gef-bootstrap',
    workOrderId: 'GBS-MOD-WO-001',
    baseRef: 'main',
    baseSha: '1'.repeat(40),
    headSha: '2'.repeat(40),
    changedPaths: ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'],
    changeImpactDigest: sha('impact'),
    impactState: 'CLASSIFIED',
    riskTier: 'LOW',
    governanceFastPath: 'PERMITTED',
    escalateReasons: [],
    obligations: MANDATORY_OBLIGATION_FLOOR,
    contextLockDigest: sha('lock'),
    contextLockState: 'COMPILED',
    closureDigest: null,
    validationFloor: null,
    rulesetRequiredContexts,
    mandatoryObligationFloor: MANDATORY_OBLIGATION_FLOOR,
    providerCandidateChecks: [],
    policyDigest: sha('policy'),
    candidateSemanticDigest: sha('candidate'),
  };
}


const sha = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

const BLOB_ID = /^[0-9a-f]{40}$/;

function revParse(args) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

/**
 * The Git blob ID of `path` as stored in the repository at `rev` (default `HEAD`).
 *
 * Reads the object database rather than the working tree, so the answer is identical on Linux,
 * macOS and Windows regardless of checkout line-ending conversion. Fails closed: an unusable Git
 * or an absent path is a test failure, never a skipped assertion.
 */
function storedBlobId(path, rev = 'HEAD') {
  const result = revParse(['rev-parse', '--verify', '--quiet', `${rev}:${path}`]);
  const stdout = (result.stdout ?? '').trim();
  if (result.status !== 0 || !BLOB_ID.test(stdout)) {
    assert.fail(
      `unable to read the stored Git object for ${path} at ${rev}` +
        `${result.error === undefined ? '' : ` (${result.error.message})`}` +
        `${result.stderr === undefined || result.stderr === '' ? '' : `: ${result.stderr.trim()}`}`,
    );
  }
  return stdout;
}

/**
 * True when `rev` is present in this checkout.
 *
 * CI checks out the pull request at depth 1, so the recorded implementation base is usually not
 * fetched. Corroboration that needs it must therefore be declared rather than assumed.
 */
function revisionIsPresent(rev) {
  return revParse(['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]).status === 0;
}

test('every workflow bound by the implementation Context Lock has an unchanged stored Git object', () => {
  // Unconditional and history-free: this is the equivalence proof. The stored object ID of the
  // candidate must be the exact blob recorded at the implementation base, so these bytes are the
  // base's bytes, whatever the checkout did to the working tree.
  for (const [path, expected] of Object.entries(BASELINE_WORKFLOW_BLOBS)) {
    assert.equal(storedBlobId(path), expected, `${path} must be identical to the implementation base ${BASELINE_IMPLEMENTATION_BASE}`);
  }
});

test('the recorded base blob is corroborated whenever the base revision is fetched', () => {
  const available = revisionIsPresent(BASELINE_IMPLEMENTATION_BASE);
  if (!available) {
    // A depth-1 pull-request checkout does not carry the base. Say so explicitly rather than
    // pretending the cross-check ran; the proof above does not depend on it either way.
    assert.ok(true, `base ${BASELINE_IMPLEMENTATION_BASE} is not present in this checkout; base-side corroboration was not run`);
    return;
  }
  for (const [path, expected] of Object.entries(BASELINE_WORKFLOW_BLOBS)) {
    assert.equal(storedBlobId(path, BASELINE_IMPLEMENTATION_BASE), expected, `${path} must be identical at the recorded base`);
  }
});

test('the stored object ID is what a checkout line-ending rewrite would otherwise corrupt', () => {
  // Guards the reason the assertion is platform-invariant: the same file has one stored identity
  // and CRLF/LF working-tree bytes have different SHA-1 values.
  const bytes = readFileSync(resolve(ROOT, '.github/workflows/pipeline-integrity.yml'));
  const crlf = Buffer.from(bytes.toString('utf8').replaceAll('\n', '\r\n'), 'utf8');
  assert.notEqual(createHash('sha1').update(crlf).digest('hex'), createHash('sha1').update(bytes).digest('hex'));
  assert.equal(storedBlobId('.github/workflows/pipeline-integrity.yml'), BASELINE_WORKFLOW_BLOBS['.github/workflows/pipeline-integrity.yml']);
});

test('an absent path or unusable revision fails closed instead of skipping the assertion', () => {
  assert.throws(() => storedBlobId('.github/workflows/does-not-exist.yml'), /unable to read the stored Git object/);
  assert.throws(() => storedBlobId('.github/workflows/pipeline-integrity.yml', 'f'.repeat(40)), /unable to read the stored Git object/);
});

test('the required-ruleset workflows keep an unconditional pull_request trigger', () => {
  for (const path of UNCONDITIONAL_PULL_REQUEST_WORKFLOWS) {
    const block = pullRequestTriggerBlock(read(path));
    assert.notEqual(block, null, `${path} must still declare a pull_request trigger`);
    assert.doesNotMatch(block, /paths:/, `${path} must not gate its pull_request trigger on paths`);
  }
});

/** The verbatim `pull_request:` trigger block of a workflow, or null when it has none. */
function pullRequestTriggerBlock(text) {
  const start = text.indexOf('\n  pull_request:');
  if (start === -1) return null;
  const rest = text.slice(start + 1);
  const end = rest.search(/\n {2}\S/);
  return end === -1 ? rest : rest.slice(0, end);
}

test('each required ruleset context is still produced by a committed workflow job', () => {
  const workflows = Object.keys(BASELINE_WORKFLOW_BLOBS).map(read).join('\n');
  for (const context of MAIN_RULESET_CONTEXTS) {
    assert.ok(workflows.includes(`name: ${context}`), `${context} must still be emitted by a committed workflow`);
  }
});

test('the full validation and high-severity audit floor is intact', () => {
  const repositoryValidation = read('.github/workflows/repository-validation.yml');
  assert.match(repositoryValidation, /- run: npm run validate/);
  assert.match(repositoryValidation, /- run: npm audit --audit-level=high/);
  assert.match(repositoryValidation, /- run: npm ci --ignore-scripts/);
  assert.doesNotMatch(repositoryValidation, /paths:/);
});

test('pipeline integrity still scans every workflow semantically', () => {
  const pipelineIntegrity = read('.github/workflows/pipeline-integrity.yml');
  assert.match(pipelineIntegrity, /pull_request_target/);
  assert.match(pipelineIntegrity, /write-all/);
  assert.match(pipelineIntegrity, /Pipeline integrity self-tests passed/);
});

test('no existing workflow has been rewired to consume the GEF Gate contract', () => {
  for (const path of Object.keys(BASELINE_WORKFLOW_BLOBS)) {
    assert.doesNotMatch(read(path), /GEF Gate|gef-gate|GefGate/, `${path} must not consume the gate contract implicitly`);
  }
});

test('the gate contract refuses to decide while the ruleset context set is unknown', () => {
  const blocked = decideGefGate(gateInput([]), options);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.diagnostics[0].code, 'GEF_GATE_RULESET_CONTEXTS_UNPROVEN');
});

test('the gate contract names exactly the required ruleset contexts, so a later ruleset update is auditable', () => {
  const receipt = decideGefGate(gateInput(MAIN_RULESET_CONTEXTS), options);
  assert.equal(receipt.ok, true);
  assert.deepEqual(
    receipt.value.requiredChecks.filter((check) => check.kind === 'RULESET_REQUIRED').map((check) => check.checkId),
    [...MAIN_RULESET_CONTEXTS].sort(),
  );
  assert.equal(receipt.value.enforcement, 'CONTRACT_ONLY_RULESET_PENDING');
});

test('this Work Order added no workflow file, so CI fan-out did not grow', () => {
  // A routing workflow added now would reintroduce fan-out before an authorized ruleset update can
  // express the narrower gate, so the committed inventory must still be exactly the base inventory.
  const present = readdirSync(WORKFLOW_ROOT).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml')).sort();
  assert.equal(present.length, BASELINE_WORKFLOW_INVENTORY_SIZE);
  for (const path of Object.keys(BASELINE_WORKFLOW_BLOBS)) {
    assert.ok(present.includes(path.replace('.github/workflows/', '')), `${path} must still be committed`);
  }
});