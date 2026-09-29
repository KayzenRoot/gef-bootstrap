# GBS-V11-MAINT-PR278-RELIABILITY-004 — Candidate source evidence

Exact admission base `d4fcf02d6bd1e44e005389b2aed0f5e3dd708549`, current production ref at admission `e23311e77d79b84f3c70671072a22a6f8896d13d`. The cumulative release-to-main PR #278 Sonar provider reported FAIL (Security B, Reliability D, duplication displayed 3.0%) and the GitHub PR was not mergeable. Read-only job 109433079205 listed 50 annotation metadata entries; the two source fixes target its named no-op loop and implicit metric comparator.

The physical stage check retains the original read-back and fingerprint verification. A no-op `void` iteration never evaluated any obligation predicate, so its removal does not alter authorization; governing engine obligations remain unchanged. The metric comparator `compareKeys` was already used for schema keys; metric IDs are admitted uppercase ASCII with fixed two-digit suffixes. Report digest exclusions remain equivalent for the ordinary plain report-body object.

No tests, CodeQL disposition, provider gate resolution, code duplication reduction or merge conflict closure are predeclared. Exact-head checks and Sonar must be retrieved and recorded by owner audit on the candidate PR. WO-010 is not admitted and publication remains blocked.
