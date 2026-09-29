# V1.2 — Product Discovery Interview and Interactive Planning

Status: owner-requested future startup default; PLANNING CANDIDATE only. Extend M09 Source Pack, M10 Planning Workspace, M11 Decisions, M12 Scope/DoD, M14 Context, M15 Execution Pack and M17/M18 checkpoint/resume. No new source-of-truth parallel to existing canonical pack.

## Core requirement
On first initialization for a NEW_PROJECT, bootstrap starts an adaptive *interview* in pt-BR before implementing code. Ask concise batches, show why material questions matter, capture source-backed answers, distinguish DECIDED / ASSUMED / UNRESOLVED / NON_APPLICABLE and never ask an answered question twice. On an EXISTING_PROJECT, inspect actual repo/README/checkpoint/ADRs/test baseline first and ask only material gaps; do not reimpose all Source Pack or rewrite existing plans without owner request. The user can answer in plain speech, skip/return, paste screenshots/reference links, select options, or choose fast guided mode.

## Interview stages: progressive disclosure
### Stage 0. Discovery and source check
Determine new vs brownfield, Git repository and project identity, user goal, prior decisions/current checkpoint, known technology constraints, supported time zone, security class and any deadline. Detect dangerous irreversibility and escalate independently. Avoid default assumptions that conflict with existing approved source.

### Stage 1. Product brief: one compact batch (5–7 questions)
1. What product are we building in one sentence, and which user/business problem does it solve?
2. Who are the primary users, their devices, language(s) and access conditions?
3. What three end-to-end outcomes MUST work for the first objectively complete release?
4. Which workflows or features are IMPORTANT but not NECESSARY; which are explicitly excluded?
5. What existing apps/screens or websites are useful references, and what should this product do differently?
6. What integrations, data, permissions, payments, compliance, reliability and security constraints exist?
7. What deployment environment/budget, target platforms and success measurement apply?
Ask FOLLOW-UP only where answer determines architecture/security or blocks scope/DoD. If user doesn't know, present 2–3 justified options with tradeoffs without inventing approval. Record provenance and confidence; an unchecked inferred preference is ASSUMED, not DECIDED.

### Stage 2. Product behavior and scope
Build persona and prioritized journey map, user stories by actor, failure/empty/offline/loading/permissions states, architecture boundary hypotheses, external dependencies and support/compliance needs. Convert responses into atomic NECESSARY/IMPORTANT/FUTURE/OUT_OF_SCOPE items. Link each NECESSARY feature to acceptance criterion and planned proof. Run a pre-mortem: where could the app break or be unsafe? Identify unknowns requiring one extra question or research. Create explicit DoD with functional, reliability, design, accessibility, performance, security, installation/recovery and deployment evidence gates when applicable.

### Stage 3. Visual direction interview (6–8 concise questions)
1. Should the look feel minimal, editorial, playful, enterprise, immersive, gaming, etc.? Two specific references if available.
2. Desktop-first, mobile-first or responsive equal priority? Typical screen sizes and main input method?
3. Brand assets/logo/colors/typeface already approved, or shall we define design tokens?
4. Primary navigation style and top 3 screens or workflows users should encounter first?
5. Data density and interaction complexity: simple one-task screens versus dense dashboard?
6. Accessibility targets: WCAG 2.2 AA as default for web where feasible, keyboard, contrast and reduced motion; any specific needs?
7. Desired microinteractions, media/assets and animation budget, including performance on budget devices?
8. Dark/light mode, internationalization and required UI states (loading, empty, error, success, offline) and preferences?
Do not copy third-party proprietary UI pixel-for-pixel; references are inspiration only.

### Stage 4. Options and visual plan approval
Prepare 1–3 distinctly described visual directions where appropriate; produce low-fidelity wireflow/sitemap and a high-fidelity sample of key screen after owner preferences. Provide component inventory/design-token map: typography scale, spacing, color semantic aliases, surfaces, elevation, radii, responsive breakpoints, focus/hover/disabled/error states, icons and content style. Show mobile/desktop states; allow owner approval/change request in ONE coherent decision gate before expensive UI implementation. If design is already governed in a brownfield project, inspect and preserve it; do not force a redesign.

### Stage 5. Architecture and Work Order compilation
Write or update proper Source Pack in mandated hierarchy. Requirements, UI/UX, Architecture, Security, Deployment, Test Plan, Data/API contracts, Backlog, DoD, ADR/Decision and checkpoint in dependency order before code. Show owner short tradeoff matrix for only blocking decisions; freeze approved options, classify open ones, build critical path and Marathon Work Order with per-wave contracts/acceptance tests. Codex alone authors implementation/tests/CI/migrations once admitted.

## Interview accelerator (less interrogation, better outcomes)
- Adaptive question DAG: select only questions with high impact on product/architecture/assurance. E.g. no payments questions for an app explicitly without money; authentication/security questions do apply when personal data is in scope.
- Return typed summaries after each batch, not whole transcript; ask for correction of the summary. Project facts, exact owner quotes only where useful, and approved decisions receive stable IDs/provenance/time. Preserve previously answered facts across continuation with checksum and source.
- Default mode: GUIDED, 5–7 questions/batch, 2–4 rounds depending on complexity. FAST mode: user supplies brief/screenshots/reference apps; GEF asks only blocking questions and makes explicitly marked reversible assumptions; no silent assumption for irreversible/security/product decisions. DEEP mode: complex compliance/high assurance with dedicated threat, data and resilience interviews.
- If urgent product delivery, plan smallest COMPLETE vertical slice consistent with owner-approved complete-target Scope and DoD; don't redefine full product as arbitrary MVP. Important features remain version controlled and excluded only with owner approval.
- Use sample application flows and realistic personas to detect hidden requirements. Avoid making decisions based on generic market stereotypes.
- Context lock invalidation: changes to product mission, primary users, Scope, DoD, Architecture or approved design tokens mark downstream seeds STALE and require affected replanning; not a blanket restart if only copy/text changes.

## Question/answer canonicalization (illustrative)
```yaml
question_id: PROD-01
source: owner-interview-2026-xx-xx
question: What problem does the product solve?
answer: <literal approved owner's answer>
state: DECIDED # or ASSUMED/UNRESOLVED/NON_APPLICABLE
authority: owner
affected_sources: [PROJECT-OVERVIEW, REQUIREMENTS, SCOPE]
downstream_dependencies: [USER-JOURNEY-01, WO-001]
last_confirmed_checkpoint: <digest or null>
```
This is a proposal for an interview capsule, not an alternate canonical project definition.

## Acceptance/test cases
- Existing repo with complete approved Scope -> no repetitive questioning or overwrite.
- New repo with unclear platform -> targeted platform questions before recommending tools or deployment.
- Same prompt after interrupted interview -> only unanswered material questions; previous answers verified against current source fingerprint.
- Missing brand/UI preference -> compare visual options, do not guess permanent colors, do not code first.
- Contradictory owner answer -> identify conflict and request decision; never overwrite frozen ADR silently.
- Auth/money/personal-data app -> enhanced security/threat and independent proof obligations; FAST mode cannot waive them.
- Owner changes a noncritical UI color -> invalidate affected design snapshots only, not all backend acceptance proof.
- From a 1-line idea produce interview notes, journey map, acceptance-linked scope, approved wireflow and an implementable Codex Work Order without needing manual file assembly.
