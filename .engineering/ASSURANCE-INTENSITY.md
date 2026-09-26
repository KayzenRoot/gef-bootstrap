# Assurance & Design Intensity by Production Weight

Status: `ACTIVE_GUIDANCE`
Purpose: scale engineering depth with the frozen production weight without changing scope, denominator or completion credit.

## Governing rule
A higher-weight module receives proportionally stronger architecture exploration, first-class mechanism design, adversarial testing, observability/proof surfaces and semantic audit. Weight is not a license for decorative complexity: every added technology/mechanism must have a traceable obligation, measurable engineering value or risk-reduction purpose.

Risk/security policy can only raise the tier. It can never lower the assurance required by an owning security, policy, money, destructive-operation, signing, secrets or critical-integrity rule.

## Tiers
| Frozen weight | Intensity | Default emphasis |
|---|---|---|
| `<=14` | `STANDARD_PLUS` | Tight ownership boundary, deterministic core, explicit failure states, focused adversarial tests, platform matrix, full regression and semantic audit. |
| `15-17` | `ELEVATED` | STANDARD_PLUS plus deeper cross-module contracts, concurrency/staleness analysis, stronger replay/rollback or recovery proofs where applicable, and wider edge-case coverage. |
| `18-19` | `HIGH_ASSURANCE` | ELEVATED plus trust-anchor/tamper analysis, failure-injection or metamorphic/property-style testing where useful, broader proprietary-mechanism exploration, stronger evidence binding and correction-delta review. |
| `20` | `MAX_ASSURANCE` | HIGH_ASSURANCE plus explicit threat/failure model, maximum practical adversarial coverage, recovery/partial-effect analysis, cross-platform and dependency-boundary stress, and a dedicated semantic security/integrity pass before merge. |

## Technology-depth rule
Higher tiers should explore and freeze more first-class technologies/mechanisms only when they reduce ambiguity, repeated reasoning, defects, unsafe concurrency, recovery risk, token/latency cost or validation cost. Mechanism count is never a completion metric.

## Acceptance rule
All tiers still require exact-state evidence, zero unresolved CRITICAL/HIGH findings, current dependency audit, required platform checks, full regression and separate MODULE_DONE promotion. Higher tiers add assurance; they do not weaken or replace baseline gates.

## Current application
GBS-M19 has frozen weight `14`, therefore its default intensity is `STANDARD_PLUS`. Future modules automatically use their frozen Backlog weight, with risk/security overrides applied upward.

STOP CONDITION: `ASSURANCE_INTENSITY_ACTIVE_WEIGHT_SCALED`.
