# GBS-V11-MAINT-PR278-SONAR-001 — Admission evidence

Bound branch base: `bdd827ff6bba22eef3d66f276a618c80e19fc587`. Main production unchanged: `e23311e77d79b84f3c70671072a22a6f8896d13d`. PR #278's cumulative Sonar check at the release base is `109414953860` with `50` inline annotations and FAILED Quality Gate (Security C, Reliability D, duplication displayed 3.0%). Its PR is `dirty` relative to main. This diagnostic does not alter scanner results, branch ancestry or security dispositions.

The new job uses read-only provider queries. If the requested Sonar check is not available, stale or in flight, log `NOT_VERIFIED` and leave the release blocker open. If available, preserve the exact run and metadata-only paths/rules/lines in the job log for subsequent bounded remediation. Job/check IDs created after this commit must be recorded in the owner's exact-head PR audit; no CI result is claimed in this file.

No product, source, release tag, runtime integration or publication is changed.
