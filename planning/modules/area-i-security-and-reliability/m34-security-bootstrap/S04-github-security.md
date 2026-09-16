# M34 S04 — GitHub Security
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **GPR34 GitHub Permission Reducer** computes minimum requested permissions.
- **WTR34 Workflow Trust Registry** classifies trusted/untrusted triggers.
- **RBG34 Ref Binding Gate** prevents mutable-ref evidence substitution.
- **FPG34 Fork/PR Guard** denies privileged paths for untrusted forks.
- **APG34 Action Pinning Gate** requires immutable action identities where policy demands.
- **GSR34 GitHub Security Receipt** binds policy, candidate and observed configuration.

M31 remains GitHub governance authority; M34 supplies security findings. No module may silently rewrite repository policy. Final state requires deterministic receipts and explicit conflict/unknown handling.