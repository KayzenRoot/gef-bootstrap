# V1.2 — Operator Response Contract, Progress and Forecasting

Status: OWNER-REQUESTED PROPOSAL; NOT EFFECTIVE in GEF 1.1; no new capability or accuracy claim. Planning only. Future admission must extend M20 Response Contract, M21 Progress Engine, M22 Estimation Engine, M23 Project Status Engine and existing M43/M45/M63 telemetry. Never fork them into a second source of truth.

## Owner outcome
Every substantive development response, including reviews, resumed work, next Work Orders and blocked work, shows a consistent compact evidence-backed progress panel in Brazilian Portuguese. No manual request for project status should be needed. Full detail is available only for decisions, audit or explicit request, avoiding long repetitive status dumps.

## Default response structure (the startup profile)
0. HEADER: project/release/workstream; as-of UTC timestamp plus configured owner time zone; exact evidence HEAD if available; state badge (PLANNING | ACTIVE | REVIEW | CORRECTION_REQUIRED | BLOCKED | APPROVED | RELEASED). Distinguish project status from report confidence.
1. EXECUTIVE DELTA (maximum 3 short facts): what has genuinely changed since previous checkpoint and exact evidence references.
2. PROGRESS PANEL: accepted earned/denominator points and percent by version AND active milestone; accepted, pending, in review and blocked Work Orders; approved vs not yet admitted future scope; no inferred “lines coded = percent”. Show remaining weighted work where denominator is frozen. If denominator unsettled, PERCENTAGE: NOT_ESTABLISHED and explain why. Separate production evidence from planning documents, candidate PRs, historical acceptance and raw task completion.
3. QUALITY/CI: counts of open known CRITICAL/HIGH/MEDIUM/LOW grouped by release and provenance, last exact-head required checks passed/total (skips and missing never PASS), regression/test status, security finding owner and reproduction links, CI cost/time only if observable.
4. FORECAST: remaining estimated active executor hours or interval, scenario dates (optimistic/base/conservative where empirically supported), observation count, confidence and which work/risks are included. Show BOTH execution effort and calendar elapsed time only if valid capacity and scheduling assumptions are known. Present user time zone. If not based, explicit ETA: NOT_YET_BASELINED, sample requirement, next measurement, no invented month/day.
5. NEXT LEGAL ACTION: current Work Order stable ID, issue/PR, Codex executor handoff (if admitted), exact STOP CONDITION and top blocker or dependency. If awaiting owner design decision, ask only the one or small batch of questions that unblocks it.
6. OPTIONAL DETAILS only when useful: links to evidence/CI/runbook, workstream backlog summary, corrected bugs, changed architecture and delta from previous review. Always finish with no false “done.”

## Progress and uncertainty source rules
- Authority precedence: current exact Git state and immutable evidence -> checkpoint -> Decisions/ADRs -> Scope -> DoD -> architecture/requirements -> issue/PR/CI corroboration. Memory/chat and executor “Completed” are nonauthoritative.
- M21 computes numerator/denominator from proven accepted weighted units; no double count across versions, repeated tests or overlapping child/parent modules. Denominator or scope changes create a separately reported epoch/change-control event. Legacy V1 1088/1088 is NOT V1.1 or V1.2 percentage.
- Work in progress is distinct from earned credit; drafts, code written and open green CI do NOT earn approved checkpoint progress.
- M23 determines status/readiness/blockers; conditional approvals and missing mandatory proof are clearly distinguished.
- M22 handles estimate forecasts only, NEVER computes product progress or approves evidence. Bind estimates to correct exact project lineage, work class and denominator epoch. Work weights are not elapsed time.
- Insufficient baseline: inherited M22 requires at least 3 independent valid temporal samples to escape NOT_YET_BASELINED. Three samples permit at most cautious, wide empirical intervals; mark low confidence when variance/skew/novelty demand it. No date if critical path/resources/calendar capacity ungrounded.
- Once sufficient baseline exists, estimate remaining work by comparable throughput plus change/unknown-work reserve, active critical-path dependency and current correction risk. Return a bounded interval or scenario assumptions, not a naked guarantee. Record median/p90 only when sample and method support them; never imply mathematical confidence from arbitrary tiny data.
- Planning-time complexity estimation may be labeled QUALITATIVE or HYPOTHESIS and never masquerade as empirical ETA.
- Recalculate on new accepted evidence, reopened defects, added Scope, velocity/drift change, source conflict or valid updated capacity. Display STALE when bound input/HEAD changes.
- User-facing progress is project/release specific; for multiple projects show separate panels with their own evidence and observation windows, not a misleading blended total.
- If external tool unavailable, clearly show DATA_UNAVAILABLE and last verified timestamp. Never mix historical GitHub issue counts into current accepted progress.

## Machine-readable proposed payload (illustrative contract, not implemented)
```json
{
  "schemaVersion": "v1.2-candidate",
  "projectId": "example",
  "release": "v1.2",
  "asOf": "2026-09-29T21:40:00Z",
  "evidence": {"baseSha": null, "candidateHeadSha": null, "checkpointDigest": null, "verified": false},
  "status": "PLANNING",
  "progress": {"earnedWeight": null, "denominatorWeight": null, "percentage": null, "state": "NOT_ESTABLISHED"},
  "workOrders": {"approved": null, "pending": null, "blocked": null, "notAdmitted": null},
  "quality": {"critical": null, "high": null, "medium": null, "low": null, "requiredChecksPassed": null, "requiredChecksTotal": null},
  "forecast": {"status": "NOT_YET_BASELINED", "validIndependentTemporalSamples": 0, "activeHoursInterval": null, "calendarDateInterval": null, "confidence": "INSUFFICIENT_EVIDENCE", "assumptions": []},
  "delta": [], "currentWoId": null, "blockers": [], "nextLegalAction": "Complete admissible baseline"
}
```
Null means not established/verified, NEVER 0. Keep no-go fields for redacted financial/secrets. Exact JSON schema/enum selected only during admitted M20/M21/M22/M23 extension. All numbers must carry provenance and version epoch.

## Two user-facing response density modes
COMPACT DEFAULT, always in every substantive construction response:
```
📍 PROJETO / RELEASE | estado | evidência (SHA e data)
📊 PROGRESSO  32/48 pontos aceitos (66.7%) | 16 pontos restantes  [example only]
🧱 EXECUÇÃO  3 WOs aprovadas | 1 em revisão | 2 pendentes       [example only]
🛡️ QUALIDADE  0 HIGH/CRITICAL conhecidas | checks 8/9          [example only]
🕒 ETA  NÃO CALIBRADA: faltam medições comparáveis           [example only]
🔄 DESDE A ÚLTIMA RESPOSTA  <one evidence-bound delta>
🎯 PRÓXIMA AÇÃO  <WO ID> <PR link> <stop condition>
```
AUDIT DETAIL ON DEMAND or at milestone promotion: per-area breakdown, work graph, requirements/DoD proof table, exact job/runs, failed/flake changes, risk and independent review receipts, calibration/forecast assumptions, checkpoint delta proposal. No repeated source-pack essays in default mode.

## Source-backed delivery and verification tests
A. M21 rollup numerator equals exact attested unit weights and never exceeds denominator; duplicate/invalidated child credit removes only affected units.
B. Changing HEAD/checkpoint/Scope must mark dependent reports stale, block incorrect extrapolation and preserve historical receipts.
C. M22 sample count 0/1/2 returns NOT_YET_BASELINED; three independent valid samples allow bounded attempt but confidence depends on data.
D. Missing CI checks, stale Sonar result, absent Codecov upload, failed security job and CodeQL historical branch findings are not greened by description.
E. V1 complete does not imply V1.1 complete; candidate V1.2 docs do not imply implementation percent or schedule.
F. Compare two sequential responses on same project: delta must derive from actual Git/checkpoint change; unchanged state means no fictional progress.
G. Validate pt-BR reading on mobile and desktop; compact core metrics in first screen, accessible status not expressed by color alone.
H. Failed external connector gracefully returns DATA_UNAVAILABLE plus oldest verified timestamp and legal next action, not invented live status.

## Future implementation ownership
ChatGPT defines canonical response semantics, layout, proof rules and audit. Codex alone implements M20-M23/M43/M45/M63 extensions and tests under admitted future WO with current Context Lock. Installation profile activates this reporting only after verified implementation and accepted rollout.