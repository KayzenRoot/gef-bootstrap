# Repair failed proof without restarting accepted work

Treat the failing check as an invalidated proof node, not as permission to restart the whole execution.

- Capture exact failing head, command/job, error and changed inputs.
- Identify the smallest causal code/config/dependency surface.
- Determine which previously green proofs actually depend on that surface.
- Preserve unrelated green evidence.
- Change only the admitted causal surface.
- Run the cheapest proof capable of disproving the suspected cause, then the focused affected suite.
- Expand validation only along proven dependency edges.
- Before acceptance, run every broader regression/security check required by the Work Order/DoD.
- If the same failure repeats without a changed causal hypothesis, stop the loop and escalate diagnosis instead of rerunning blindly.

Report cause, repair, invalidated proofs, reused proofs, rerun proofs and remaining blockers.