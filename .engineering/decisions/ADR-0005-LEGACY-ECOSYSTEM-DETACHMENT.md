# ADR-0005 — Legacy Ecosystem Detachment and Reserved Adapter Slots

Status: APPROVED
Decision: D-0061
Release line: V1.1

## Context
Before V1.1 completion, the product owner requires the Bootstrap to stop carrying product-specific contracts for two previously modeled optional ecosystem integrations. The next integration design will be rebuilt in separate governed increments.

Keeping old product identities in code, planning or active documentation would create accidental compatibility assumptions and could cause a future integration to inherit obsolete protocol, context or authority semantics.

## Decision
1. M39 becomes **Reserved External Adapter Slot**.
2. M40 becomes **Reserved Context Adapter Slot**.
3. Product-specific runtime exports are removed from the shared security/reliability package.
4. The neutral Generic Adapter API and generic optional routing semantics remain.
5. Current-tree planning, requirements, architecture, gates, tests and active release documentation use neutral ecosystem language.
6. No future external ecosystem inherits the removed contracts automatically.
7. Reuse of either reserved slot requires a new decision, explicit identity/protocol/schema contract, compatibility matrix, security review, tests and Work Order.
8. Stable V1.0 release objects and immutable Git history are not rewritten. The detachment governs the V1.1 current tree and future releases.

## Compatibility
The removed integrations were OPTIONAL_ADAPTER surfaces with zero production-denominator credit. Core GEF behavior, Generic Adapter API behavior, UGAS optional integration, production weighting and V1.0 production acceptance remain unchanged.

## Verification
V1.1 includes a current-tree detachment guard that fails if the retired product-specific tokens or paths reappear before a superseding governed decision deliberately changes the rule.

## Consequences
The Bootstrap has a clean neutral extension boundary for the upcoming redesign. Integration-specific semantics will be introduced only when their new architecture is defined and admitted.

STOP CONDITION: `V1_1_LEGACY_ECOSYSTEM_BINDINGS_DETACHED`
