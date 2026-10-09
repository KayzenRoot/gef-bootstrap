import test from "node:test";
import assert from "node:assert/strict";
import { assertWo012ProductionAcceptedRelease, assertWo012ReleaseStateIfApplicable, isLegalPostFoundationV11State, isWo012ProductionAcceptedCheckpoint, laterV11WorkOrderOrdinal, wo012CandidateReleaseStatus, wo012CurrentPatchCheckpoint, wo012CurrentPatchCheckpointMd, wo012PostMergeCheckpoint, wo012PostMergeCheckpointMd, wo012ProductionAcceptedCheckpoint } from "./helpers/v11-context-lock-refresh-assertions.mjs";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const json = (path) => JSON.parse(read(path));

test("WO-012 preserves immutable v1.1.1 history and recognizes the exact v1.1.2 release state", () => {
  const canonical = json(".engineering/CHECKPOINT.json");
  const human = read(".engineering/CHECKPOINT.md");
  const states = [
    [canonical, human],
    [wo012CurrentPatchCheckpoint(canonical), `${human}\n${wo012CurrentPatchCheckpointMd}`],
  ];

  for (const [checkpoint, checkpointMd] of states) {
    const v11 = checkpoint.v11;
    assert.equal(assertWo012ReleaseStateIfApplicable(checkpoint, checkpointMd), true);
    if (isWo012ProductionAcceptedCheckpoint(checkpoint)) {
      assertWo012ProductionAcceptedRelease(checkpoint, checkpointMd);
    } else {
      assert.equal(v11.stableRelease.version, "1.1.0");
      assert.equal(v11.stableRelease.tag, "v1.1.0");
    }
    assert.equal(v11.patchHistory.find((entry) => entry.version === "1.1.1")?.status, "PUBLISHED_POST_PUBLISH_VERIFICATION_FAILED");
    const historical = v11.patchHistory.find((entry) => entry.version === "1.1.1");
    assert.equal(historical.tag, "v1.1.1");
    assert.equal(historical.tagTarget, "1dc030f1358eab0347043a3d54c7fc311c7c2123");
    assert.equal(historical.npmPackage, "@gef-bootstrap/cli@1.1.1");
    assert.equal(historical.immutable, true);
    assert.equal(historical.postPublishVerification, "ARTIFACT_DOWNLOAD_FAILED");

    const candidate = v11.candidateRelease;
    assert.equal(candidate.version, "1.1.2");
    assert.equal(candidate.status, wo012CandidateReleaseStatus(checkpoint));
    assert.equal(candidate.workOrder, "GBS-V11-WO-012");
    assert.equal(candidate.issue, 361);
    assert.equal(candidate.baseMainSha, "5a32a607ccf2055fab722f3d5d452791c6aae3e6");
    assert.equal(candidate.branch, "hotfix/v1.1.2-release-state-preflight");
    assert.equal(candidate.pullRequest, 362);
    if (isWo012ProductionAcceptedCheckpoint(checkpoint)) {
      assert.equal(candidate.tag, "v1.1.2");
      assert.equal(candidate.npmPublished, true);
      assertWo012ProductionAcceptedRelease(checkpoint, checkpointMd);
    } else {
      assert.equal(candidate.tag, null);
      assert.equal(candidate.npmPublished, false);
      assert.equal(candidate.registrySmoke, "NOT_RUN");
    }
    assert.match(checkpointMd, /V1\.1\.1.*PUBLISHED_POST_PUBLISH_VERIFICATION_FAILED/);
  }
});

test("Patch 1.1.3 candidate updates current identity without rewriting historical release evidence", () => {
  const workspace = json("package.json");
  const cli = json("packages/cli/package.json");
  const lock = json("package-lock.json");
  assert.equal(workspace.version, "1.1.3");
  assert.equal(cli.name, "@gef-bootstrap/cli");
  assert.equal(cli.version, "1.1.3");
  assert.equal(cli.repository.url, "https://github.com/KayzenRoot/gef-bootstrap.git");
  assert.equal(lock.version, "1.1.3");
  assert.equal(lock.packages[""].version, "1.1.3");
  assert.equal(lock.packages["packages/cli"].version, "1.1.3");
  assert.match(read("packages/cli/src/main.ts"), /FALLBACK_PRODUCT_VERSION = "1\.1\.3"/);
  assert.match(read("packages/cli/src/schemas.ts"), /\["1\.1\.1", "1\.1\.2", "1\.1\.3"\]\.includes\(state\["productVersion"\]\)/);

  const matrix = json("packages/cli/schemas/gef-cli-upgrade-compatibility-matrix.json");
  assert.ok(matrix.compatibility.some((row) => row.from === "1.1.1" && row.to === "1.1.2" && row.evidenceState === "VERIFIED"));
  assert.ok(matrix.compatibility.some((row) => row.from === "1.1.0" && row.to === "1.1.2" && row.evidenceState === "VERIFIED"));
  assert.ok(matrix.compatibility.some((row) => row.from === "1.1.2" && row.to === "1.1.3" && row.evidenceState === "VERIFIED"));
});

test("WO-012 operator documentation identifies production-accepted v1.1.2 and preserves earlier release history", () => {
  const changelog = read("CHANGELOG.md");
  const installation = read("docs/INSTALLATION.md");
  const quickstart = read("docs/QUICKSTART.md");
  const runbook = read("docs/V1.1-OPERATIONS-RUNBOOK.md");
  const packageReadme = read("packages/cli/README.md");
  assert.match(changelog, /## \[1\.1\.2\] - hotfix in progress/);
  assert.match(changelog, /V1\.1\.1.*published/si);
  for (const text of [installation, quickstart, runbook, packageReadme]) {
    assert.match(text, /1\.1\.1/);
    assert.match(text, /1\.1\.2/);
  }
  assert.match(installation, /@gef-bootstrap\/cli@1\.1\.2/);
  assert.match(installation, /1\.1\.2.*current production-accepted V1\.1 package/i);
  assert.doesNotMatch(installation, /1\.1\.2 package is not available until published/i);
  assert.match(runbook, /1\.1\.2.*current production-accepted package/i);
  assert.doesNotMatch(runbook, /V1\.1\.2 remains a candidate/i);
});

test("WO-012 adds exact v1.1.2 release, assurance and read-only post-publish recovery paths", () => {
  const publisher = read(".github/workflows/v11-publish.yml");
  const assurance = read(".github/workflows/v11-release-assurance.yml");
  const windowsHarness = read(".github/scripts/run-v11-unprivileged-validation.ps1");
  const recovery = read(".github/workflows/v11-wo012-post-publish-recovery.yml");
  assert.match(publisher, /tags:\s*\["v1\.1\.0",\s*"v1\.1\.1",\s*"v1\.1\.2"\]/);
  assert.match(publisher, /verify-1-1-2:[\s\S]*?cross-platform-artifact-smoke-1-1-2:[\s\S]*?publish-1-1-2:[\s\S]*?post-publish-1-1-2:/);
  assert.match(publisher, /manifest\.version !== '1\.1\.2'/);
  assert.match(publisher, /npm publish "\$tarball" --access public --provenance --ignore-scripts/);
  assert.match(assurance, /1\.1\.2\) work_order=012/);
  assert.match(assurance, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(windowsHarness, /"1\.1\.2"/);
  assert.match(recovery, /gh run download "\$RELEASE_RUN_ID" --repo "\$GITHUB_REPOSITORY"/);
  assert.match(recovery, /@gef-bootstrap\/cli@1\.1\.2/);
  assert.match(recovery, /dist\.integrity/);
  assert.match(recovery, /dist\.signatures/);
  assert.match(recovery, /dist\.attestations/);
  assert.match(recovery, /gh run download "\$RELEASE_RUN_ID" --repo "\$GITHUB_REPOSITORY"/);
  assert.match(recovery, /permissions:\s*\r?\n\s+actions: read\r?\n\s+contents: read/);
  assert.match(recovery, /@gef-bootstrap\/cli@1\.1\.2/);
  assert.match(read(".github/scripts/run-v11-wo012-artifact-smoke.mjs"), /expectedProductVersion, "1\.1\.2"/);
  assert.match(read(".github/workflows/v11-publish.yml"), /tags: \["v1\.1\.0", "v1\.1\.1", "v1\.1\.2"\]/);
  assert.doesNotMatch(recovery, /npm publish|id-token:\s*write/);
});

test("WO-012 checkpoint assertions preserve the admitted history and exact later-state bounds", () => {
  const checkpoint = json(".engineering/CHECKPOINT.json");
  const current = wo012CurrentPatchCheckpoint(checkpoint);
  const postMerge = wo012PostMergeCheckpoint(checkpoint);
  const other = structuredClone(checkpoint);
  other.v11.status = "GBS_V11_WO_011_ADMITTED";

  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_WO_012_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT" } }), 12);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_WO_012_ADMITTED" } }), 12);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_WO_011_ADMITTED" } }), 11);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT" } }), 10);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY" } }), 8);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_WO_009_ADMISSION_NEXT" } }), 8);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_WO_003_ADMITTED" } }), 3);
  assert.equal(laterV11WorkOrderOrdinal({ v11: { status: "GBS_V11_FOUNDATION_PROMOTED" } }), null);
  assert.equal(isLegalPostFoundationV11State({ v11: { status: "GBS_V11_FOUNDATION_PROMOTED" } }), true);
  assert.equal(isLegalPostFoundationV11State({ v11: { status: "GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY" } }), true);
  assert.equal(isLegalPostFoundationV11State({ v11: { status: "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_WO_009_ADMISSION_NEXT" } }), true);
  assert.equal(isLegalPostFoundationV11State({ v11: { status: "GBS_V11_WO_003_ADMITTED" } }), true);
  assert.equal(isLegalPostFoundationV11State({ v11: { status: "UNRELATED" } }), false);

  assert.equal(assertWo012ReleaseStateIfApplicable(current, wo012CurrentPatchCheckpointMd), true);
  assert.equal(assertWo012ReleaseStateIfApplicable(checkpoint, read(".engineering/CHECKPOINT.md")), true);
  assert.equal(assertWo012ReleaseStateIfApplicable(postMerge, wo012PostMergeCheckpointMd), true);
  assert.equal(assertWo012ReleaseStateIfApplicable(other, ""), false);
});

test("WO-012 recognizes only the exact production-accepted state with its immutable release facts", () => {
  const accepted = wo012ProductionAcceptedCheckpoint(json(".engineering/CHECKPOINT.json"));
  const acceptedMd = "Current V1.1 release position\nV1.1.2 PRODUCTION_ACCEPTED\n@gef-bootstrap/cli@1.1.2\nGBS_V11_1_1_2_PRODUCTION_ACCEPTED\nV1.1.0 historical production acceptance";

  assert.equal(isWo012ProductionAcceptedCheckpoint(accepted), true);
  assert.equal(laterV11WorkOrderOrdinal(accepted), 12);
  assert.equal(isLegalPostFoundationV11State(accepted), true);
  assert.equal(wo012CandidateReleaseStatus(accepted), "PRODUCTION_ACCEPTED");
  assert.equal(assertWo012ReleaseStateIfApplicable(accepted, acceptedMd), true);

  const wrongReleaseTarget = structuredClone(accepted);
  wrongReleaseTarget.v11.stableRelease.tagTarget = "1dc030f1358eab0347043a3d54c7fc311c7c2123";
  assert.throws(() => assertWo012ProductionAcceptedRelease(wrongReleaseTarget, acceptedMd));

  const unrelated = structuredClone(accepted);
  unrelated.v11.status = "GBS_V11_1_1_2_PRODUCTION_ACCEPTED_APPROVED";
  assert.equal(isWo012ProductionAcceptedCheckpoint(unrelated), false);
  assert.equal(laterV11WorkOrderOrdinal(unrelated), null);
  assert.equal(isLegalPostFoundationV11State(unrelated), false);
  assert.equal(assertWo012ReleaseStateIfApplicable(unrelated, ""), false);
});
