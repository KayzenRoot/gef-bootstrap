# M43 S05 — Corrections
Status: FROZEN

**CRL43 Correction Loop Lens** correlates failed validation, finding severity, correction attempt, retest and final disposition. It measures correction count, reopened defects and avoidable churn without assigning blame.

**RCR43 Root-Cause Reference** stores a bounded taxonomy (`SPEC_GAP`, `IMPLEMENTATION`, `TEST`, `ENVIRONMENT`, `DEPENDENCY`, `TOOLING`, `UNKNOWN`) plus evidence references. UNKNOWN is preserved when evidence is insufficient.

Telemetry never converts a correction into success. M27/M24 remain assurance/evidence authorities.

Acceptance: loop correlation, bounded taxonomy, reopened-finding visibility, unknown preservation, no assurance authority.