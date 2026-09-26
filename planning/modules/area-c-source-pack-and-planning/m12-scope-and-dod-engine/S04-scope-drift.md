# GBS-M12-S04 — Scope Drift

Status: `FROZEN`
Module: `GBS-M12 Scope & DoD Engine`
Session: `S04`
Risk: `STANDARD`

## Objective
Freeze deterministic detection of scope expansion, scope erosion and classification drift relative to an explicitly bound baseline, without granting M12 authority to mutate or approve canonical Scope.

## Baseline model
A scope snapshot contains a stable `baselineId`, authoritative source references, and stable item records. Each item has `itemId`, work classification and optional authorization references for changes. Snapshot projections are sorted deterministically and immutable.

## Drift classes
- `AUTHORIZED_ADDITION` — a newly present NECESSARY item carrying explicit canonical authorization reference(s);
- `UNAUTHORIZED_EXPANSION` — a new current-scope obligation without authorization, including pulled-forward IMPORTANT/FUTURE work;
- `REQUIRED_SCOPE_REMOVAL` — a baseline NECESSARY item removed;
- `REQUIRED_DOWNCLASSIFICATION` — baseline NECESSARY changed to IMPORTANT/FUTURE/OUT_OF_SCOPE;
- `UNAUTHORIZED_UPCLASSIFICATION` — non-NECESSARY changed to NECESSARY without authorization;
- `OUT_OF_SCOPE_PRESENCE` — an OUT_OF_SCOPE item appears in the candidate active surface;
- `AUTHORIZED_RECLASSIFICATION` — classification change backed by explicit canonical authorization;
- `UNCHANGED` is omitted from findings.

A finding carries severity (`BLOCKING` or `ADVISORY`), affected item ID, before/after classification, rationale code and authorization references.

## Fail-closed rules
1. Removing or downclassifying NECESSARY work is blocking unless the canonical baseline itself is governedly replaced outside this helper.
2. Adding/upclassifying to NECESSARY without authorization is blocking.
3. Pulling IMPORTANT/FUTURE work into the current active surface without explicit approval is scope expansion and blocking for the proposed delta.
4. OUT_OF_SCOPE presence is blocking.
5. Authorized changes are reported, not hidden; authorization makes them non-blocking, not invisible.
6. Unknown/malformed baseline or candidate data fails validation rather than assuming no drift.
7. Snapshot IDs/fingerprints bind comparison context; mismatched or absent baseline identity must be visible.

## Scope Drift Sentinel
The implementation will expose a pure `detectScopeDrift` operation returning:
- deterministic findings;
- `blocking` boolean;
- added/removed/reclassified IDs;
- baseline/candidate identifiers;
- `authorityNotice: DETECTION_ONLY`.

The sentinel is detection-only. It does not write Scope, create ADRs, approve changes, update backlog weights, award progress or promote checkpoints.

## Canonical denominator protection
The frozen production denominator remains 61 release-blocking modules / weight 1088. M12 may detect attempts to change governed obligation sets, but recalibration is outside this module. No API in M12 accepts a denominator and returns a rewritten denominator.

## Brownfield and future integration
Scope drift is expected in existing projects, but it must be explicit. Future M13/M14/M16 may consume M12 findings during GEF adoption/task compilation/policy gates. M17 can later bind checkpoint state. M24/M25 can attach evidence/proof graph. M44 can persist audit events. Those consumers do not move their ownership into M12.

## Technology candidates
- **RFC 6902 JSON Patch**: IMPORTANT for portable machine-readable deltas, but semantic scope findings remain primary because raw patch is insufficient.
- **Structural diff with AST/JSON Pointer provenance**: IMPORTANT for larger policy documents.
- **Merkleized snapshot trees**: FUTURE for efficient partial invalidation/proof binding under M25/M37.
- **Datalog/graph query**: FUTURE for transitive scope-impact analysis when dependency graph ownership exists.
- **Incremental computation (content-addressed memoization)**: FUTURE for large workspaces, gated by measurable ROI.
- **Temporal policy ledger**: FUTURE for historical scope evolution under M44, never as recency authority.
- **Mutation testing of drift rules**: IMPORTANT for M53/M54 to prove failure-sensitive tests.

## Acceptance
Tests must detect unauthorized additions, required removals/downclassification, unauthorized upclassification, OUT_OF_SCOPE presence, authorized non-hidden changes, deterministic ordering and unchanged denominator/ownership boundaries.

## Module freeze summary
S01-S04 together define one coherent M12 surface: classify work, map classifications to admission posture, evaluate a supplied DoD criterion set, and detect scope/criterion drift. The module is pure/deterministic and does not mutate canonical state.

No known HIGH/CRITICAL planning finding.

STOP CONDITION: `GBS_M12_S04_FROZEN_MODULE_PLANNING_COMPLETE`.
