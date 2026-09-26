# M35 S02 — Confirmation Levels
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **CLM35 Confirmation Level Matrix**: AUTO, POLICY_AUTHORIZED, EXPLICIT, DUAL_EVIDENCE, FORBIDDEN.
- **ACB35 Approval Context Binding** binds actor, action, target, candidate and expiry.
- **SAR35 Stale Approval Rejection** invalidates changed targets/candidates.
- **CAG35 Confirmation Aggregation Gate** uses maximum required level.
- **EAG35 Emergency Action Guard** never invents emergency authority.

Autonomy may remove unnecessary prompts but cannot erase explicit safety requirements. Approval is capability-scoped, non-transferable and cannot authorize a different action.