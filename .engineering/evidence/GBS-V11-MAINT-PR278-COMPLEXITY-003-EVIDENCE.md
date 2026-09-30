# GBS-V11-MAINT-PR278-COMPLEXITY-003 — Source-bound candidate evidence

Release base `343c619f1cd39d63ad0a9baeecd8091fa7468873`, following the audited PR #321. Cumulative PR #278 Quality Gate remains FAILED (Security B, Reliability D and displayed 3.0% duplication) and branch merge remains conflicted. Initial problem classes: capsule validator complexity 62 and downstream proof closure 26 from provider diagnostic `109417416793`.

Ten extracted validators retain the original statement groups and predicate order; the top-level validator returns the first group's failure unchanged. Proof closure retains its original failure seeds, source growth pass followed by test growth pass and repeated iteration until both show no change. No public type, digest, external authority or frozen test is altered.

This checked-in candidate record does not predeclare CI success. The final exact-head PR review must attach full tests, provider Sonar evidence and explain any remaining security/complexity/merge blockers. WO-010 remains unadmitted.
