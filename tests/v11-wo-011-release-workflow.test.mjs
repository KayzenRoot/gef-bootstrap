import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const publisher = read(".github/workflows/v11-publish.yml");
const assurance = read(".github/workflows/v11-release-assurance.yml");
const smoke = read("tests/v11-wo-010-artifact-smoke.mjs");
const windowsHarness = read(".github/scripts/run-v11-unprivileged-validation.ps1");
const recovery = read(".github/workflows/v11-wo011-post-publish-recovery.yml");

test("WO-011 preserves the v1.1.0 publisher and the tag-only v1.1.1 release path", () => {
  assert.match(publisher, /tags:\s*\["v1\.1\.0",\s*"v1\.1\.1",\s*"v1\.1\.2"\]/);
  assert.match(publisher, /if: github\.event_name == 'push' && github\.ref == 'refs\/tags\/v1\.1\.0'/);
  assert.match(publisher, /if: github\.event_name == 'push' && github\.ref == 'refs\/tags\/v1\.1\.1'/);
  assert.match(publisher, /verify-1-1-1:[\s\S]*?cross-platform-artifact-smoke-1-1-1:[\s\S]*?publish-1-1-1:[\s\S]*?post-publish-1-1-1:/);
  const releaseJob = publisher.split("  verify-1-1-1:")[1].split("  cross-platform-artifact-smoke-1-1-1:")[0];
  assert.match(releaseJob, /git merge-base --is-ancestor/);
  assert.match(releaseJob, /manifest\.version !== '1\.1\.1'/);
  assert.match(releaseJob, /npm run validate/);
  assert.match(releaseJob, /npm audit --audit-level=high/);
  assert.match(releaseJob, /GBS-V11-WO-011-RELEASE-MANIFEST\.json/);
  assert.match(releaseJob, /receipt\.tarball\.sha256/);
  assert.match(releaseJob, /package\/node_modules/);
  assert.doesNotMatch(releaseJob, /NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]{20,}/);
});

test("WO-011 tests the same checksum-bound release tarball on Ubuntu, Windows and macOS before OIDC", () => {
  const matrix = publisher.split("  cross-platform-artifact-smoke-1-1-1:")[1].split("  publish-1-1-1:")[0];
  const publish = publisher.split("  publish-1-1-1:")[1].split("  post-publish-1-1-1:")[0];
  const postPublish = publisher.split("  post-publish-1-1-1:")[1];
  assert.match(matrix, /needs: verify-1-1-1/);
  assert.match(matrix, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(matrix, /actions\/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093/);
  assert.match(matrix, /GEF_EXPECTED_PRODUCT_VERSION: "1\.1\.1"/);
  assert.match(matrix, /tests\/v11-wo-010-artifact-smoke\.mjs/);
  assert.match(matrix, /run-v11-unprivileged-validation\.ps1 -ReleaseArtifactSmoke/);
  assert.match(publish, /needs: \[verify-1-1-1, cross-platform-artifact-smoke-1-1-1\]/);
  assert.match(publish, /environment:\s*\n\s+name: npm-publish/);
  assert.match(publish, /id-token:\s*write/);
  assert.match(publish, /npm publish "\$tarball" --access public --provenance --ignore-scripts/);
  assert.match(publish, /Refusing to overwrite immutable @gef-bootstrap\/cli@1\.1\.1/);
  assert.doesNotMatch(publish, /NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]{20,}/);
  assert.equal((publisher.match(/id-token:\s*write/g) ?? []).length, 3, "only the three version-specific publish jobs may request OIDC");
  assert.ok(postPublish.includes("npm view @gef-bootstrap/cli@1.1.1 dist.signatures"));
  assert.match(postPublish, /fetch\("https:\/\/registry\.npmjs\.org\/-\/npm\/v1\/keys"\)/);
  assert.match(postPublish, /createPublicKey/);
  assert.match(postPublish, /verify\("sha256"/);
  assert.doesNotMatch(postPublish, /npm audit signatures/);
  assert.ok(postPublish.includes('gh run download "$GITHUB_RUN_ID" --repo "$GITHUB_REPOSITORY"'));
  assert.match(postPublish, /published_integrity" = "\$expected_integrity"/);
  assert.match(postPublish, /npm ci --ignore-scripts --no-audit --no-fund/);
  assert.match(postPublish, /"version": "1\.1\.1"/);
});

test("WO-011 exact-head assurance binds package version and receipt across all operating systems", () => {
  const candidate = assurance.split("  exact-head-package-candidate:")[1].split("  exact-head-package-platform-smoke:")[0];
  const matrix = assurance.split("  exact-head-package-platform-smoke:")[1].split("  release-assurance:")[0];
  assert.match(candidate, /package_version: \$\{\{ steps\.package\.outputs\.package_version \}\}/);
  assert.match(candidate, /1\.1\.0\) work_order=010/);
  assert.match(candidate, /1\.1\.1\) work_order=011/);
  assert.match(candidate, /1\.1\.2\) work_order=012/);
  assert.match(candidate, /packageJson\.version !== expectedVersion/);
  assert.match(candidate, /gef-v\$\{\{ steps\.package\.outputs\.package_version \}\}-exact-head-package/);
  assert.match(matrix, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(matrix, /GEF_EXPECTED_PRODUCT_VERSION: \$\{\{ needs\.exact-head-package-candidate\.outputs\.package_version \}\}/);
  assert.match(smoke, /receipt\.version, expectedProductVersion/);
  assert.match(smoke, /applied\.document\.targetVersion, expectedProductVersion/);
  assert.match(windowsHarness, /GEF_EXPECTED_PRODUCT_VERSION -notin @\("1\.1\.0", "1\.1\.1", "1\.1\.2"\)/);
  assert.ok(windowsHarness.includes("tags/v1\\.1\\.[0-2]"));
  assert.match(windowsHarness, /\["GEF_EXPECTED_PRODUCT_VERSION"\] = \$env:GEF_EXPECTED_PRODUCT_VERSION/);
});

test("WO-012 adds tag-bound 1.1.2 publishing and read-only post-publish verification", () => {
  const verify = publisher.split("  verify-1-1-2:")[1].split("  cross-platform-artifact-smoke-1-1-2:")[0];
  const smoke = publisher.split("  cross-platform-artifact-smoke-1-1-2:")[1].split("  publish-1-1-2:")[0];
  const publish = publisher.split("  publish-1-1-2:")[1].split("  post-publish-1-1-2:")[0];
  const postPublish = publisher.split("  post-publish-1-1-2:")[1];
  assert.match(verify, /refs\/tags\/v1\.1\.2/);
  assert.match(verify, /merge-base --is-ancestor/);
  assert.match(verify, /manifest\.version !== '1\.1\.2'/);
  assert.match(verify, /GBS-V11-WO-012-RELEASE-MANIFEST\.json/);
  assert.match(smoke, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(smoke, /run-v11-wo012-artifact-smoke\.mjs/);
  assert.match(publish, /needs: \[verify-1-1-2, cross-platform-artifact-smoke-1-1-2\]/);
  assert.match(publish, /id-token:\s*write/);
  assert.match(publish, /npm publish "\$tarball" --access public --provenance --ignore-scripts/);
  assert.match(publish, /Refusing to overwrite immutable @gef-bootstrap\/cli@1\.1\.2/);
  assert.match(postPublish, /npm view @gef-bootstrap\/cli@1\.1\.2 dist\.integrity/);
  assert.match(postPublish, /dist\.signatures/);
  assert.match(postPublish, /dist\.attestations/);
  assert.match(postPublish, /https:\/\/slsa\.dev\/provenance\/v1/);
  assert.doesNotMatch(postPublish, /npm audit signatures|npm publish/);
  assert.ok(postPublish.includes('gh run download "$GITHUB_RUN_ID" --repo "$GITHUB_REPOSITORY"'));
});

test("WO-011 recovery verifies the immutable published CLI without traversing unpublished bundled packages", () => {
  assert.match(recovery, /RELEASE_RUN_ID: "36904947907"/);
  assert.ok(recovery.includes('gh run download "$RELEASE_RUN_ID" --repo "$GITHUB_REPOSITORY"'));
  assert.match(recovery, /receipt\.tarball/);
  assert.match(recovery, /dist\.integrity/);
  assert.match(recovery, /dist\.signatures/);
  assert.match(recovery, /registry\.npmjs\.org\/-\/npm\/v1\/keys/);
  assert.match(recovery, /createPublicKey/);
  assert.match(recovery, /verify\("sha256"/);
  assert.match(recovery, /dist\.attestations/);
  assert.doesNotMatch(recovery, /npm audit signatures/);
  assert.match(recovery, /doctor --target/);
  assert.match(recovery, /status --target/);
  assert.match(recovery, /GBS_V11_WO_011_REGISTRY_SMOKE_VERIFIED/);
});
