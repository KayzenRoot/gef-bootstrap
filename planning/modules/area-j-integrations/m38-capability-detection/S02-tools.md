# M38 S02 — Tools
Status: FROZEN
Assurance: HIGH_ASSURANCE

## Mechanisms
- **TDR38 Tool Detection Registry** normalized tool identity/version/source.
- **TPR38 Tool Probe Receipt** binds observation to environment snapshot.
- **TCR38 Tool Capability Resolver** derives capabilities from verified evidence, not names.
- **TVG38 Tool Version Gate** supports semver/range policy and unknown versions.
- **TSG38 Tool Shadowing Guard** detects conflicting/path-shadowed tool identities.

Probe adapters may inspect environments; the decision core remains pure. Tool presence never implies permission to execute it.