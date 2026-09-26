# M38 S01 — Executors
Status: FROZEN
Assurance: HIGH_ASSURANCE

## Mechanisms
- **EDR38 Executor Detection Registry** stable executor identities and versions.
- **EPR38 Executor Probe Receipt** injected observations, no ambient probing in pure core.
- **ETR38 Executor Trust Rating** TRUSTED/RESTRICTED/UNVERIFIED/UNAVAILABLE.
- **ECM38 Executor Compatibility Matrix** maps required contracts to observed executor features.
- **EFD38 Executor Feature Drift** invalidates stale capability receipts.

Detection never grants authority. Spoofed names/version strings are insufficient; evidence provenance is required. Absence is a supported state.