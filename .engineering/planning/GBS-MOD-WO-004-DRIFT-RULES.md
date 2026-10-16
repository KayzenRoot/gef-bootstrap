## 2026-10-14 post-PR451 architecture-rule source addendum

**Real current main:** `e71120266c40235089444c9c0122280c5da4e5bd`; protected [PR #451](https://github.com/KayzenRoot/gef-bootstrap/pull/451) merged, and the two canonical CHECKPOINT blobs are now `686a2e3f7da1b541f9a4ee10a4d9432358105e0a` and `4a653772c31dffee869a9bac17345241cfc6db03`. Original `main@e0356f1de5dae2351d8701a76c736a22832929c2`, old Work Order blob `119a2cf93a76d771d018ae6a9c26656684d4f1f6` and `STATE_CONFLICT` creation-time sentences below are preserved for historical audit **but superseded** by this current source addendum. Current Work Order blob is `653793d4b139b9a408f1b944427f6d88baf4ccc9`. Canonical WO-002 has governance effectivity but no implementation lock or Codex; that predecessor's Evidence Bundle is NOT implemented or promoted.

**Actual effectivity remains zero:** ARD-C01–ARD-C05 and ARD-B06 are *candidate* rules only, no production checker registered or tests executed, no change to `.engineering/ARCHITECTURE.md`, `.github/**`, packages, tests, frozen SECURITY, approvals, provider settings, release, or main checkpoint. Continue blocking when current source conflicts or when requested check/rule exceeds separately Owner-admitted permissions. Issue #398 A1–A7 preserved but **NOT EXECUTED**. #427/#429 integrations only if separately admitted and actual consumers verified; ADR-0008 code actor unchanged. Historical #439 21 UNKNOWN remain release blocker. The former "don't launch until #451 merges" condition is historically satisfied; all *other* independent scope/lock/actor/specialist gates still apply.

**STOP:** `WO004_ARCHITECTURE_RULE_CATALOG_CURRENT_SOURCE_ONLY_NO_RUNTIME`.

---

# GBS-MOD-WO-004 — Structural Rule Catalog, Proof and Negative Matrix

**STATUS: PROPOSED / INFORMATIONAL / NOT_EFFECTIVE.** Work Order #398, program #393.
**Source:** `main@e0356f1de5dae2351d8701a76c736a22832929c2`; proposed Work Order `.engineering/work-orders/GBS-MOD-WO-004.md` blob `119a2cf93a76d771d018ae6a9c26656684d4f1f6`.
**No rule is activated by this file.** No implementation, CI change, ruleset modification, plugin installation, Codex run, merge or checkpoint promotion. The current paired checkpoint remains in `STATE_CONFLICT` pending a separately authorized #451 correction.

## 1. Canonical rule candidate catalog, NOT a registered schema

Source: frozen `.engineering/ARCHITECTURE.md` SHA `5c2b44db3805dbd5329dc99a8a9b774360c4136a`, dependency rules around lines 251–268. These are examples of disallowed *architectural dependency directions*, which a future specifically governed classification must ground to actual package identities. The canonical source has precedence over these draft names.

| Candidate ID (planning label only) | Forbidden conceptual edge | Special guard |
| --- | --- | --- |
| ARD-C01 | semantic **core** importing GitHub-specific implementation/models | Identify which packages are *core* and which symbols are GitHub-specific before enforcing |
| ARD-C02 | semantic **core** importing CLI implementation | Identify runtime-vs-type-only import semantics and boundary; no invented package edge |
| ARD-C03 | kernel importing model/ChatGPT-vendor-specific implementation | Vendor markers cannot be detected reliably from package names alone; explicit rule map |
| ARD-C04 | canonical schema depending on adapter implementation | Source schema ownership and exports map necessary |
| ARD-C05 | assurance verdict/semantic decision depending on UI rendering | Distinguish public type declarations from runtime/UI renderer |
| ARD-B06 | semantic decisions reconstructed from operational SQLite/cache | Not reducible to an import edge. Requires authorized contract/behavioral fixtures |

The preferred direction `interface/adapter/operator → orchestration → domain contract/policy → primitive/canonical model` is design guidance; do not fail all edges against this heuristic. Rule candidates ARD-C01–C05 become enforceable only after Owner approval identifies *exact actual* packages/symbols, import scope, severity, rule source SHA, exceptions and false-positive tests. ARD-B06 belongs to separate behavioral evidence; cannot be implemented by scanning package names.

## 2. Existing ownership and reuse, proved by repository blob reads

- M09 `packages/source-pack/src/public.ts` blob `e4ae465e2445f4728192e4adc6940a4452a861b9`: exports `resolveAuthority`, `computeDriftShockwave`, `RequiredState` and `IntegrityState`. Reuse source authority/applicability. A new drift checker only produces observations.
- WO-001 M04 `packages/preflight/src/change-impact.ts` blob `5aff784c3f68e295a9b6a98ef4086d324a69fb54`: `normalizeChangePath`, `classifyChangeImpact`. Adopt existing risk escalation and deterministic changed-path classification; no risk downgrading.
- M14 `packages/task-context-compiler/src/s07-tiered-context-lock.ts` blob `2e03843a8bf24582e50f1a58add82598e69f8ab0`: existing source requirements and tiered lock, no independent contextual admission.
- Contracts `packages/contracts/src/work-order.ts` blob `9a665ae1a4dff817349d48d799dfaa105eb5aff8`: `parseWorkOrderContract`, path-pattern contracts. Rule file is not a way to override Work Order WRITE_ALLOWED.
- M27 `packages/assurance-pipeline/src/gef-gate.ts` blob `aaafa732305f20c4738429a8b6e29879d2156819`: immutable Gate obligations; no direct workflow or branch-protection edits.

Existing `tsconfig.json` and package-local project references are **not complete source import graphs**. Before authoring code, enumerate actual imports/exports, workspace package.json, TypeScript module/path aliases, normalized repo paths and platform-specific filesystem case/symlink policy at the new exact source SHA. Do not claim “the repository currently violates X” without that proof.

## 3. Prospective deterministic witness envelope, not an active type

```text
StructuralRule:
  ruleId, authorityDomain=ARCHITECTURE, canonicalSourceRef
  canonicalSourceBlobSha, exactBaseSha, exactHeadSha
  affectedPackageIds, forbiddenDirectedEdges
  applicableImportKinds, transitiveScope, explicitExceptions
  ownerDecisionId, severityFloor, sourceFingerprint
StructuralObservation:
  sourceRepo, sourceSha, ruleFingerprint, importSite
  fromPackageId, toPackageId, resolvedPath, importKind
  resolutionState: VERIFIED | UNKNOWN | CONFLICT
  disposition: VIOLATION | ALLOWED | BLOCKED | STALE
  reasonCodes, evidenceRefs, boundedRemediationProposal
  mayDeleteFiles=false, mayModifyRuleset=false, mayPromote=false
DerivedDocumentBinding:
  canonicalSourceBlobSha, derivedArtifactBlobSha
  producingRuleId, dependencyEdges, observedSourceSha
  currentness: CURRENT | STALE | UNKNOWN | CONFLICT
```

No new schema ID has been registered with #427 and no compatibility policy created. Unexpected fields, missing rule owner or fingerprint mismatch on any purported verifier block acceptance. Derived outputs cannot make canonical Source Pack effective by being newer. Evidence/observations do not grant Owner or independent review approval.

## 4. Minimal, risk-preserving algorithm proposal

1. Read effective Authority Sources and validate paired project state. Check exact repo/base/head, admitted implementation WO+Context Lock, rule source SHA and declared generated/vendor roots. If missing/conflicted, STOP with source reason; never green by absence.
2. Build actual import graph using a parser/module resolver that supports the admitted project's syntax and package export boundary. Each edge must bind from/to *actual* owned paths and a precise import location. Canonical-package owner unknown -> UNKNOWN, not allowed.
3. Apply only separately approved rule IDs and explicit source-bound exemptions to normalized edges. Evaluate direct and transitive scope only when the policy demands it. Never allow a renamed/moved symlink/Windows case alias to bypass applicable rule.
4. Build source→derived dependency closure from immutable source fingerprints. If authority changed, mark affected derived artifacts STALE, preserving unaffected proof when their exact dependencies remain unchanged.
5. Output a versioned candidate report with bounded sanitized observations and explicit UNKNOWN/ST​ALE/FAIL rather than throwing away failures. Route to existing GEF Gate, whose required checks cannot be narrowed by this tool.
6. Preserve exact result bytes/identity and independent Owner review gates. The checker must never silently rewrite the frozen source or run cleanup/deletion.

## 5. Negative/positive matrix tied to Issue #398 A1–A7

| ID | Test input | Expected |
| --- | --- | --- |
| A1-direct | Source-bound forbidden edge with resolvable import site | Deterministic VIOLATION with exact rule, package and import |
| A2-valid | Known allowed edge and clean controlled package fixture | PASS/ALLOWED only with complete graph |
| A3-alias | Alias / case-fold / symlink / path traversal / rename / type-only import | VIOLATION if prohibited and proven, otherwise UNKNOWN; never bypass |
| A3-transitive | A→B→C and scoped rule disallows A→C transitive closure | VIOLATION with derivation; otherwise don't invent a transitive rule |
| A4-source-shift | Frozen Architecture blob changed, dependent generated guide unchanged | STALE with affected dependent list |
| A4-unrelated | Unrelated decision source changed, rule dependency graph disjoint | Preserve valid proof, don't blanket invalidate |
| A5-doc-only | Unrelated doc changed with proved disjoint dependency closure | Skip unnecessary broad graph pass, still all required risk checks |
| A6-generated-positive | Declared owned generated output, no disguised first-party source | Explicit approved exclusion |
| A6-generated-negative | First-party source renamed to excluded-looking directory | Not automatically excluded; BLOCK/VIOLATION |
| A7-unknown | Missing canonical authority, unclear owner, truncated graph, unsupported parser | UNKNOWN/BLOCKED, never PASS or delete |
| A7-no-auto-clean | Unused/likely dead source without VERIFIED_DEAD + separate admitted change | No deletion |
| Cross-risk | Structural checker suggests skipping Gitleaks/ruleset context | Refused; GEF Gate stays authoritative |
| Exact-head | HEAD changes between graph scan and results | STALE; repeat affected proof |
| Missing-registered-schema | #427 proposed but not promoted | Do not require a fictional registered schema or accept an unsupported version |
| Application contract | #429 public API change with no admitted compatibility engine | UNKNOWN/NOT_VERIFIED, not automatically compatible |

Untrusted source content and LLM prose can never assert the relevant canonical package owner or override the effective Architecture/Security by recency.

## 6. Implementation gates not satisfied today

**Planning-only artifact acceptance**: 3 exact files, 0 implementation paths; planning-only Context Lock with exact two document SHAs, pinned frozen Source Pack hashes, JSON parse, all deny flags true, hosted exact-HEAD checks and Owner audit `NOT_INDEPENDENT`.

**Later Codex executable Work Order**: a distinct effective approved rule catalog from exact current main, real source owner/import graph and allowed file/globs, accepted change-risk class and required Security/S4 for workflow/CI changes, source-matched Context Lock, A1–A7 fixtures, cross-OS when needed, full GEF Gate, independent specialist where mandated, separate merge/release/promotion gates. Do not launch until #451 correction and current checkpoint parity are actually resolved via **separately authorized** protected merge.

**STOP:** `GBS_MOD_WO_004_RULE_CATALOG_PLANNED_NOT_EFFECTIVE`.
