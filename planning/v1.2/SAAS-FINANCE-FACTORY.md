# GEF V1.2 — SaaS Finance Factory (proposal)

STATUS: FUTURE RESEARCH ONLY, subject to approved Scope/DoD after released V1.1. Not implemented, installed or selected by this file. No payment, customer data or accounting operations authorized. Reuse GEF M09–M15, M20–M28, M34–M38, M43–M45 and M63; Codex alone implements any future application code/tests/CI/migrations.

## 1. SaaS financial risk classification and interview
Detect SaaS by explicit product mission and verified architecture, not a dependency name. Distinguish: SUBSCRIPTION_SAAS (sells access); USAGE_SAAS (metered API/AI/GPU); MARKETPLACE_SPLIT (splits payments between sellers and platform); MONEY_MOVEMENT_FINTECH (holds/transfers customer value); WEB3_SAAS (onchain + fiat). A marketplace, custody platform or financial service needs a stronger risk/security/regulatory profile than ordinary subscriptions.
Adaptive interview 5–7 unanswered high-impact questions per round:
1. Who pays, in which currency/jurisdiction, for subscriptions, seats, consumption, credits or transaction percentages?
2. Which plans, trials, upgrades/downgrades, overages, limits/entitlements, dunning/cancellation and refunds are required?
3. Does our system merely bill through a processor or hold, split, transfer or settle other people's money? Which payment providers, PIX/card/boleto or regional equivalents?
4. What are accepted invoicing, revenue recognition, tax-document and accounting/reporting responsibilities? Qualified accounting/legal review required by applicable geography/business.
5. Which retention/data residency, tenant boundaries, chargeback/fraud and customer identity/KYC/AML requirements actually apply?
6. Which budgets matter: LLM/GPU cost, hosting, support, provider payment fees, tax and target contribution margin per customer?
7. What does owner require for accounting audit, error recovery, owner-only privileged corrections and incident/reconciliation alerts?
No financial infrastructure is installed before approved responses; nonpayment apps get no finance profile.

## 2. Proposed first-party mechanisms
SAAS-01 Billing and Entitlement Compiler: convert approved plan/seat/usage/proration/trial/grace/refund contract into versioned provider-neutral entitlements; no temporary webhook success automatically extends permanent privileges. An entitlement check must bind plan version, usage window, payment/credit state and explicit grace semantics. Compare provider integrations: Stripe Billing where supported; self-hosted Lago or OpenMeter for high-complexity metering. Install exactly one primary monetization engine unless independently justified.
SAAS-02 Immutable Financial Ledger Guardian: for balance/split/credit/escrow use append-only, balanced ledger postings, currency-minor-unit or decimal fixed precision, atomic idempotent financial transaction, immutable original plus compensating reversals, reconciliation with external settlements. Formance Ledger is an open-source candidate; using a separate ledger microservice for a small seat-only SaaS is OPTIONAL and may be wasteful. Existing approved finance/accounting package wins when proven. Every ledger posting MUST be causally linked to one external or approved internal event and release source.
SAAS-03 Usage Meter Integrity: count usage events using stable event IDs, event-time windows, dedup and late-arrival policy, declared unit precision, billable vs complimentary units, customer ownership, quota reservation, overage warnings and hard enforcement for expensive AI/GPU. Compare OpenMeter vs Lago for actual product and API/version compatibility. Cross-check accepted usage against raw evidence without logging user prompts/secret content.
SAAS-04 Payment Workflow Reliability: outbox/inbox pattern for provider webhooks, verify provider signatures with raw body and replay window, unique provider event ID, durable retry/backoff, dead-letter human triage, no “exactly once network delivery” claim. Temporal is a candidate for complex long-lived refunds/fulfillment; transactional DB + background queue is enough for simpler workloads. A payment success event must not double-create credit or grant cross-tenant access.
SAAS-05 Reconciliation and Dispute Engine: compare provider captured/refunded/charged-back/settled movements to internal ledger and payout statements on schedule, handle fees, foreign exchange, partial refunds and settlement delays; create an exception ledger and owner-audited compensating actions, never silently mutate history. Financial daily close is an explicit operator acceptance when applicable.
SAAS-06 Profitability Engine: report MRR, ARR, net and gross retention, churn, CAC/LTV when measured, receivables/aging, gross/contribution margin, payment provider fees, tax handling assumptions, AI tokens/GPU/storage/support cost by customer/tenant and per-plan overage risk. Distinguish booked revenue, collected cash and internal estimates; reject fabricated data and incompatible cohorts.
SAAS-07 Financial Fraud and Abuse Sentinel: monitor free-trial cycling, card testing patterns, stolen sessions, suspicious refunds, entitlement abuse, duplicated usage, merchant chargeback and affiliate fraud where appropriate. Only owner-approved privacy-respecting telemetry and provider-managed payment security; anomaly score alone cannot unilaterally seize funds or deny a customer.
SAAS-08 Fiscal and Compliance Router: flag regional duties requiring specialist input, not an automated legal/accounting verdict. Brazil requires evaluating actual applicable NFS-e, consumer, tax, LGPD, payments and potentially Banco Central/CVM based on activity. SaaS subscriptions are not automatically regulated custody; smart-contract financial activity may be. Keep provider/invoice integration conditional and attach exact official sources at future admission.

## 3. Concrete optional technology candidates and evidence
- Lago: open-source self-hostable monetization/usage/subscription API; current docs and license/maintenance/premium features must be rechecked before adoption. Source https://github.com/getlago/lago .
- OpenMeter: self-hostable usage metering and entitlements; current API v1/v2 differs from Konnect API v3, so avoid assuming plug-and-play interchangeable SaaS cloud interface. Source https://openmeter.io/docs/api and https://openmeter.io/docs/billing/entitlements/entitlement .
- Formance Ledger: open-source append-only postings / double-entry for money-moving apps; production support of standalone vs official operator differs and must be validated against real hosting budget. Source https://github.com/formancehq/ledger .
- Temporal: durable workflow orchestration; self-hosting introduces operational cost. Use for proven long-lived business orchestration rather than all webhooks by default. Source https://docs.temporal.io/ .
- Payment providers: choose only among owner-approved country-eligible Stripe, Mercado Pago, Pagar.me and other available provider options at future install; independently verify current regional payment methods/fees, compliance, SDK and webhook docs. Never assert all have identical feature coverage.

## 4. Minimum assurance
- Unit/property: round-trip plan changes, credit arithmetic with fixed precision, proration/leap/daylight/currency and no negative balance or duplicated charge; replay exact test seed.
- Integration: provider mock and sandbox webhook duplicates, reorder, replay, tampered signature, late success after cancel, failed payout, partial refund and provider outage.
- Tenancy: no cross-customer access to invoices, transactions, saved payments, usage metrics or admin correction, verified both API and database levels.
- Operations: dispute, double-credit, reconciliation mismatch, statement data import drift, dead-letter queue visibility, privilege checks and recovery.
- Security: outsource actual card collection/tokenization to PCI-validated provider where possible; outsourcing does not eliminate merchant webpage/security duties. PCI SSC guidance https://www.pcisecuritystandards.org/faqs/1604/ .
- Release: exact-head financial end-to-end in provider sandbox; no real-money test from unattended Codex run; separate approval for externally billable production action and regulatory specialist where needed.
- Observability/telemetry: never log full cards, private customer data, credentials or financial secrets.
- CI optimization: only relevant finance suites on impacted feature, but payments/ledger/security changed surfaces trigger forced domain regression; HIGH_ASSURANCE final exact-head never skipped.

## 5. Comparative app pilots and admission
Pilot A small subscription SaaS: user registers, chooses plan, sandbox payment, sees feature entitlement, upgrades/cancels/refunds and receives accurate invoice/access state under duplicated/reordered webhooks.
Pilot B AI usage SaaS: feature quotas, delayed/replayed metering, hard resource cutoff, tenant boundaries and measured per-request margin.
Pilot C only if owner needs marketplace/fintech: balances/splits/payouts, balanced ledger, partial refunds/chargebacks, daily reconciliation, privacy and independent risk review.
Compare released V1.1 versus admitted future v1.2 on identical accepted application scope: time-to-first-usable-charge, accepted financial journeys/executor-hour, defect escape, errors per transaction, provider/CI cost and customer data exposures. Benchmark feasibility before adding a second costly financial engine.
STOP: SAAS_FINANCE_RESEARCH_RECORDED_NO_INSTALL_NO_IMPLEMENTATION.
