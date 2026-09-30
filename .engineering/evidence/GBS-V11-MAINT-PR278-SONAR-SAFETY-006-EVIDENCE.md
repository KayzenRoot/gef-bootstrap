# GBS-V11-MAINT-PR278-SONAR-SAFETY-006 — Candidate evidence

Admission base: `08bd9f18ca3993ff450785a1aeeeaf3c71fef50f`. Production main remains `e23311e77d79b84f3c70671072a22a6f8896d13d`. PR #278 is ancestry-reconciled but its cumulative Sonar result at admission is still FAIL (Security B, Reliability D, duplication 3.1%). Diagnostic job `109459863174` supplied the exact current annotation metadata.

The package change removes shell and PATH command resolution for npm by executing an absolute npm CLI script through the active Node executable. Transaction cleanup removes values proven unused after prior decomposition. Telemetry continues to use the already-admitted English locale comparator; digest payload construction still excludes only the digest property.

No CI, security or Sonar success is predeclared. No cumulative Quality Gate closure, Codecov closure, production acceptance or WO-010 admission is claimed by this source record.
