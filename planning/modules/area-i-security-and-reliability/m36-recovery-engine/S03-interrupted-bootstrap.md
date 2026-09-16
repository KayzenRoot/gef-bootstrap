# M36 S03 — Interrupted Bootstrap
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **IBD36 Interruption Boundary Detector** identifies last proven phase.
- **RSM36 Resume State Machine** supports SAFE_RESUME/ROLLBACK/RESTART/BLOCKED.
- **SCP36 Safe Continuation Proof** requires prerequisites still match.
- **DWR36 Duplicate Work Reducer** reuses valid completed phases without re-running mutations.
- **CTR36 Cancellation/Truncation Receipt** preserves why execution stopped.

Resume is never inferred from file presence alone. Candidate, policy, toolchain and journal bindings must still match. Changed context invalidates stale continuation proof.