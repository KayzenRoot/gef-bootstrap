# Proposed V1.2 Security Delta

**State:** `PROPOSED / NOT_CANONICAL`

## Security invariants

1. Existing fail-closed behavior remains mandatory.
2. Unknown capability, proof lineage, dependency or provider state does not become PASS by convenience.
3. Required repository checks may not be weakened to admit V1.2.
4. Secrets, credentials and private keys are never stored in evidence receipts.
5. Tool output is untrusted input until normalized and validated.
6. External tool versions/integrity must be freshly verified when implementation is admitted.
7. Paid/commercial services require explicit owner approval before becoming required dependencies.

## Web App/API reference profile

The reference profile shall cover, as applicable:
- authentication/authorization boundaries;
- input/schema validation;
- dependency and secret scanning;
- API/browser negative-path tests;
- least-privilege configuration;
- security headers/origin/session handling when present;
- reproducible build/deploy evidence;
- no hidden production credentials in test fixtures.

Exact framework-specific controls are profile-adapter details, not universal core assumptions.

## High-risk specialist gate

Production-ready claims require qualified specialist review for:
- real-asset mainnet smart contracts;
- custody/signing-critical paths;
- financial value movement or critical ledger state;
- materially privileged upgrade/admin paths;
- irreversible high-impact operations.

The gate is additive:
repository checks + GEF/Codex evidence + owner audit + specialist review where triggered.

## Web3 EVM priority pack

The EVM pack is not core-release-blocking.

Before production-ready status it must separately prove:
- deterministic contract build/test;
- static analysis;
- invariant/property evidence where applicable;
- privilege/upgrade surface inventory;
- asset/custody classification;
- specialist gate when owner trigger conditions apply.

## Data/privacy

Operations feedback and telemetry must define:
- allowed fields;
- redaction;
- retention;
- source provenance;
- opt-in/activation boundary;
- tenant/project isolation where relevant.

No universal production telemetry collection is implied by core V1.2.

