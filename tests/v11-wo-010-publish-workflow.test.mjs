import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = readFileSync(resolve(ROOT, ".github/workflows/v11-publish.yml"), "utf8");
const RELEASE_ASSURANCE = readFileSync(resolve(ROOT, ".github/workflows/v11-release-assurance.yml"), "utf8");
const ARTIFACT_SMOKE = readFileSync(resolve(ROOT, "tests/v11-wo-010-artifact-smoke.mjs"), "utf8");

test("WO-010 manual branch dispatch verifies a candidate but only an exact pushed tag can publish", () => {
  assert.match(WORKFLOW, /push:\s*\n\s+tags:\s*\["v1\.1\.0"\]/);
  assert.match(WORKFLOW, /workflow_dispatch:/);
  assert.match(WORKFLOW, /if:\s*github\.ref == 'refs\/tags\/v1\.1\.0' \|\| \(github\.event_name == 'workflow_dispatch' && github\.ref_type == 'branch'\)/);
  assert.doesNotMatch(WORKFLOW, /^\s+pull_request:/m);
  assert.doesNotMatch(WORKFLOW, /^\s+branches:/m);
  assert.match(WORKFLOW, /Require manual branch dispatch to test this exact candidate[\s\S]*?test "\$GITHUB_REF_TYPE" = "branch"[\s\S]*?git rev-parse HEAD/);
  assert.match(WORKFLOW, /test "\$GITHUB_REF_TYPE" = "tag"/);
  assert.match(WORKFLOW, /test "\$GITHUB_REF_NAME" = "v1\.1\.0"/);
  assert.match(WORKFLOW, /git merge-base --is-ancestor/);
  const publishJob = WORKFLOW.split("\n  publish:")[1].split("\n  post-publish:")[0];
  const postPublishJob = WORKFLOW.split("\n  post-publish:")[1];
  assert.match(publishJob, /needs: \[verify, cross-platform-artifact-smoke\]/);
  assert.match(publishJob, /if: github\.event_name == 'push' && github\.ref == 'refs\/tags\/v1\.1\.0'/);
  assert.match(postPublishJob, /if: github\.event_name == 'push' && github\.ref == 'refs\/tags\/v1\.1\.0'/);
});

test("WO-010 publisher uses short-lived OIDC with least privilege and no publish token", () => {
  const jobs = WORKFLOW.split("  publish:")[1];
  assert.ok(jobs, "publish job must be present");
  const publishJob = jobs.split("\n  post-publish:")[0];
  assert.match(publishJob, /environment:\s*\n\s+name: npm-publish/);
  assert.match(publishJob, /id-token:\s*write/);
  assert.match(publishJob, /actions:\s*read/);
  assert.match(publishJob, /contents:\s*read/);
  assert.doesNotMatch(WORKFLOW.split("  verify:")[1].split("\n  publish:")[0], /id-token:\s*write/);
  assert.doesNotMatch(WORKFLOW.split("  post-publish:")[1], /id-token:\s*write/);
  assert.doesNotMatch(WORKFLOW, /NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]{20,}/);
  assert.match(WORKFLOW, /npm install --global npm@11\.5\.1/);
  assert.match(WORKFLOW, /test "\$\(npm --version\)" = "11\.5\.1"/);
  const publishJobSection = WORKFLOW.split("\n  publish:")[1].split("\n  post-publish:")[0];
  assert.equal((WORKFLOW.match(/id-token:\s*write/g) ?? []).length, 1, "only the publish job may request OIDC identity");
  assert.match(publishJobSection, /needs: \[verify, cross-platform-artifact-smoke\]/);
});

test("WO-010 publisher validates, inspects and smokes the exact tarball before publishing", () => {
  assert.match(WORKFLOW, /npm run build/);
  assert.match(WORKFLOW, /npm run validate/);
  assert.match(WORKFLOW, /npm audit --audit-level=high/);
  assert.match(WORKFLOW, /prepare-package\.mjs --pack/);
  assert.match(WORKFLOW, /tar -tzf/);
  assert.match(WORKFLOW, /const expectedFiles = \['LICENSE', 'README\.md', 'bin', 'dist', 'schemas', 'vendor'\]/);
  assert.match(WORKFLOW, /const expectedBundles = \['@gef-bootstrap\/contracts', '@gef-bootstrap\/kernel', '@gef-bootstrap\/preflight', '@koromix\/koffi-win32-x64', 'koffi'\]/);
  assert.match(WORKFLOW, /for \(const entry of entries\)/);
  assert.match(WORKFLOW, /archive path is outside the reviewed allowlist/);
  assert.match(WORKFLOW, /sensitiveFilename\.test\(normalized\)/);
  assert.match(WORKFLOW, /npm install --offline/);
  assert.doesNotMatch(WORKFLOW, /npm init -y --prefix/);
  assert.match(WORKFLOW, /cd "\$consumer"\r?\n\s+npm init -y\r?\n\s+npm install --offline/);
  assert.match(WORKFLOW, /cd "\$consumer"\r?\n\s+npm init -y\r?\n\s+npm install --no-audit --no-fund @gef-bootstrap\/cli@1\.1\.0/);
  assert.match(WORKFLOW, /actions\/upload-artifact@/);
  assert.match(WORKFLOW, /GBS-V11-WO-010-RELEASE-MANIFEST\.json/);
  assert.match(WORKFLOW, /provenance/);
  assert.match(WORKFLOW, /node "\$bin" --help/);
  assert.match(WORKFLOW, /node "\$bin" --version/);
  assert.match(WORKFLOW, /node "\$bin" doctor/);
  assert.match(WORKFLOW, /node "\$bin" status/);
  assert.match(WORKFLOW, /npm publish "\$tarball" --access public --provenance --ignore-scripts/);
  assert.match(WORKFLOW, /npm audit signatures @gef-bootstrap\/cli@1\.1\.0/);
});

test("WO-010 installs and exercises the same checksum-bound run artifact on Ubuntu, Windows and macOS", () => {
  const matrixJob = WORKFLOW.split("\n  cross-platform-artifact-smoke:")[1].split("\n  publish:")[0];
  assert.match(matrixJob, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(matrixJob, /actions\/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093/);
  assert.match(matrixJob, /name: gef-v1\.1\.0-package-\$\{\{ github\.run_id \}\}/);
  assert.match(matrixJob, /receipt\.sourceCommit !== process\.env\.EXPECTED_SOURCE_COMMIT/);
  assert.match(matrixJob, /receipt\.tarball\.sha256 !== actual/);
  assert.match(matrixJob, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(matrixJob, /node tests\/v11-wo-010-artifact-smoke\.mjs/);
  assert.match(ARTIFACT_SMOKE, /\["install", "--no-audit", "--no-fund", tarball\]/);
  assert.match(ARTIFACT_SMOKE, /\["uninstall", "--no-audit", "--no-fund", "@gef-bootstrap\/cli"\]/);
  assert.match(ARTIFACT_SMOKE, /doctor/);
  assert.match(ARTIFACT_SMOKE, /status/);
  assert.match(ARTIFACT_SMOKE, /upgrade.*--target/);
  assert.match(ARTIFACT_SMOKE, /applied\.document\.sourceVersion, "1\.0\.0"/);
  assert.match(ARTIFACT_SMOKE, /legacy\.stateBytes/);
  assert.doesNotMatch(matrixJob, /id-token:\s*write/);
});

test("WO-010 pre-merge assurance runs its one exact-head tarball on all three platforms", () => {
  const producer = RELEASE_ASSURANCE.split("\n  exact-head-package-candidate:")[1].split("\n  exact-head-package-platform-smoke:")[0];
  const matrixJob = RELEASE_ASSURANCE.split("\n  exact-head-package-platform-smoke:")[1].split("\n  release-assurance:")[0];
  assert.match(producer, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(producer, /test "\$\(git rev-parse HEAD\)" = "\$GEF_CANDIDATE_SHA"/);
  assert.match(producer, /prepare-package\.mjs --pack/);
  assert.match(producer, /sourceCommit/);
  assert.match(producer, /createHash\('sha256'\)/);
  assert.match(producer, /actions\/upload-artifact@/);
  assert.match(matrixJob, /needs: exact-head-package-candidate/);
  assert.match(matrixJob, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(matrixJob, /actions\/download-artifact@/);
  assert.match(matrixJob, /name: gef-v1\.1\.0-exact-head-package-\$\{\{ github\.run_id \}\}/);
  assert.match(matrixJob, /node tests\/v11-wo-010-artifact-smoke\.mjs/);
  assert.doesNotMatch(matrixJob, /id-token:\s*write/);
});

test("WO-010 publisher refuses private, renamed or wrong-version package metadata", () => {
  assert.match(WORKFLOW, /manifest\.name !== '@gef-bootstrap\/cli'/);
  assert.match(WORKFLOW, /manifest\.version !== '1\.1\.0'/);
  assert.match(WORKFLOW, /manifest\.private !== false/);
});
