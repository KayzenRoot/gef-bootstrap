# GBS-V11-MAINT-PR278-COMPLEXITY-005 — Source-bound candidate evidence

Exact admission release SHA: `3abf60731adaabd61bda97a62e48c005baf8b170`. Production main at admission: `e23311e77d79b84f3c70671072a22a6f8896d13d`. Cumulative PR #278 remains blocked by Sonar Security B, Reliability D and displayed new-code duplication 3.0% plus an unresolved branch merge conflict. Diagnostic source: provider-derived metadata-only Sonar job `109433079205`, three selected complexity findings 23/20/24 on the named files.

Changes are extraction-only: staging retains ordered artifact checks and manifest writes, case measurement retains read-only identity/ancestor traversal, telemetry retains exactly the existing metric families and failure reason precedence. All other source and release metadata are unchanged. This candidate record makes no CI, package integrity, Sonar closure, production acceptance or security-disposition claim. Owner exact-head audit must attach provider-bound results and classify all residual gates before merge.

WO-010 remains not admitted; no main or production tag change is authorized.
