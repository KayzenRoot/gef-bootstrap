# Optional agent skills — triage label roles

Status: **ADVISORY / NOT A GOVERNED STATE MACHINE**. This maps optional Matt Pocock skill terminology to proposed issue labels; it does not assert the labels currently exist or modify repo labels. Confirm the exact repository, owner `KayzenRoot` and existing labels before any `gh issue edit` / GitHub provider write.

| Optional skill role | Suggested GitHub label | Interpretation |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | Needs a human-authorized scope and initial classification |
| `needs-info` | `needs-info` | A factual blocker needs evidence or user input |
| `ready-for-agent` | `ready-for-agent` | Administrative triage ready, **not implementation-admitted** |
| `ready-for-human` | `ready-for-human` | Needs Owner-specific decision or hardware/access |
| `wontfix` | `wontfix` | Only after reason and explicit approved closure |

## Guardrails

- Labels are **metadata** and never override an admitted Work Order, Context Lock, canonical `PROJECT_STATE` or GitHub ruleset. In particular, `ready-for-agent` does not authorize code, release or a merge.
- Never infer labels exist from this mapping. Read GitHub label inventory first and use actual configured names; do not create/delete labels as part of an unrelated PR. If the label does not exist, report the gap and keep the canonical ticket body/status accurate.
- Never close an implementation Work Order as DONE based on a label, green CI or merged PR alone. The frozen DoD and canonical checkpoint/promotion rule decide.
- When triaging PRs, keep `CORRECTION_REQUIRED`, `BLOCKED`, `APPROVED_PREPARATION_ONLY`, independent review requirements and exact-head CI status explicit. Preserve original review evidence/history.
- A third-party skill's suggestion to “claim the first ready issue” is advisory only. Cross-check owner identity, dependencies, source hierarchy, issue parent, and execution authority, including SEC-02 S4 when applicable.

**STOP:** `TRIAGE_ROLES_ADVISORY_NOT_EXECUTION_AUTHORITY`.
