# GEF V1.2 — SaaS + Web3 cross-domain assurance and remaining blind spots

STATUS: research candidate, not approved Scope, production deployment, installed provider, or legal/compliance certification. Reuse SAAS-FINANCE-FACTORY.md, WEB3-DATA-SECURITY.md, WEB3-FACTORY-PROFILE.md and existing GEF risk/proof/forecast engines. Codex only writes any implementation/test/CI code after an admitted future Work Order.

## A. The most dangerous SaaS + Web3 integration gaps
1. Two ledgers are not automatically one truth: distinguish approved private accounting ledger from public blockchain contract state and third-party PSP statement. Pending, submitted, included, sufficiently confirmed, finalized, failed and reorged are different states. Design a causal mapping with tenant, business event ID, chain ID, contract/tx/log identity, token precision and reconciliation checkpoint. Token transfer success alone does not prove customer subscription was lawfully paid, fiat settlement happened or app access may be granted.
2. Eliminate duplicate value: separate idempotency keys at user command, provider event, ledger posting and blockchain log. Transaction retries, delayed webhooks, indexer replays, bridge attestations and reorgs must not double-credit or double-debit. Corrections use documented compensating entries and never rewrite accepted transaction provenance. Negative fixture: fiat PSP capture succeeds, local app crashes, duplicate chain mint instruction and reorg happen, then eventual reconciliation returns one authorized credit and no tenant crossover.
3. Money precision and asset catalog: fiat and token denominations need independently pinned unit scales, contract/chain identity and deliberate rounding rules. Never equate similarly named tokens on different chains, or trust symbol/ticker metadata as authoritative. FX/oracle feeds introduce timestamp, freshness, manipulation and decimal-conversion risks. Compare business rules to per-asset invariant corpus.
4. Onchain privacy is limited: public wallet addresses, logs, events, timestamps, transaction graph and even ciphertext/commitment timing may reveal relationships. Personal data, invoices, legal identities and raw audit exports remain offchain by default; user approves the minimal onchain commitment/proof necessary for product functionality. Confidential compute must state who can decrypt, metadata visibility, keys, audit assumptions, cost and supported chains.
5. Key, approval and deployment boundaries: customer wallet signing and server treasury/deployer/admin signing are independent roles. Prefer noncustodial design if owner requirements permit. Any true custody/trading/payout product requires explicit risk/legal review, segmented signer authority, transaction policy, threshold/multisig/recovery and separately approved production deployment gate. No background Codex step moves real funds.
6. Data privacy versus audit retention: immutable ledger append and blockchain publication create tension with user erasure and retention rights. Minimize at collection, store personal records offchain with encrypted identities and explicit retention/cryptographic erasure limits, keep only required anonymized accounting/legal proofs and determine obligations with qualified specialists. A hash of identifiable personal data is not automatically anonymous.
7. Provider and chain failure plan: PSP/webhook unavailability, compromised RPC/indexer, wrong chain, chain halt/reorg, KMS outage and lost signer each require documented recovery. Do not substitute multiple paid vendors for a tested disaster recovery objective. Model and test feasible manual exception queue and replay source of truth.
8. Threat chain and insider control: cross-tenant employee/support access, stale SSO roles, payout override, invoice editing, compromised CI signer, malicious dependency, frontend approval phishing and upgrade admin compromise require separate negative tests and clear approval workflow. A successful smart-contract scanner pass never substitutes full SaaS authorization checks.

## B. Conditional verified technology pilots and their honest boundaries
- Basic subscriptions: existing owner-chosen PSP test sandbox, PostgreSQL transactions, signed webhook handler, transaction outbox/inbox and per-tenant authorization first. No independent ledger service for simple license-only SaaS unless actual balances justify it.
- Money movement at scale: measure dedicated TigerBeetle (double entry, strict serializability and unique transfers) or current accepted append-only Postgres ledger against the actual transaction rate and ops budget. Source: https://docs.tigerbeetle.com/concepts/safety/ .
- Complex long-running financial workflows: Temporal SDK with explicitly idempotent payment side effects when timeout/recovery complexity and real benchmarks justify self-hosted operations. Source: https://docs.temporal.io/temporal .
- Multi-tenant B2B auth: PostgreSQL RLS with correct privilege/connection-pool boundaries; consider OpenFGA for complex organization/delegation graph. Neither alone replaces controller-level tenant checks. Sources: https://www.postgresql.org/docs/current/ddl-rowsecurity.html and https://openfga.dev/docs/use-cases/multi-tenant-saas .
- Privacy-first Web3: begin with offchain KMS/HSM-backed authenticated encryption and data minimization. Use Noir ZK only if a clear approved claim can be proven while leaving useful private inputs hidden; document public-input leakage and the true proof verifier/security model. Zama FHEVM only after a synthetic, costed experiment supports the required host chain and decryption ACL trust assumptions. Sources https://noir-lang.org/docs/ and https://docs.zama.org/protocol/protocol .
- High-risk confidential processing: AWS Nitro Enclaves or another approved attested TEE can protect selected workloads in an isolated environment, but needs supported instance, KMS attestation, runtime-specific CI and priced EC2 compute. It does not turn a whole public chain private. Source https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html .
- Private signing: risk-specific MPC/threshold, multisig/HSM and key-custody operational exercises, with exact trust and recovery boundaries. NIST describes threshold operations without reconstructing original key; method selection is distinct from UI auth. Source https://csrc.nist.gov/Projects/threshold-cryptography .
- Cryptographic agility: inventory algorithm/key usage and phase in supported offchain PQ migration experiments if long-lived data warrants it. NIST FIPS 203/204/205 do not make existing deployed chain wallet signatures post-quantum automatically. Source https://csrc.nist.gov/News/2024/postquantum-cryptography-fips-approved .

## C. Cross-profile GEF enhancements (planning IDs only)
XF01 FINANCIAL CONSISTENCY GRAPH: extend existing Proof Graph across invoices -> PSP provider events -> ledger postings -> optional chain events -> final app entitlements with integrity and exact source receipts.
XF02 DATA EXPOSURE BOUNDARY SENTINEL: label raw PII, pseudonymous/metadata, encrypted user records, public hashes, public wallet graph, support logs and AI prompt material; detect disallowed data crossing GitHub/chat/CI/RPC/onchain boundaries.
XF03 CROSS-PLANE CHAOS LAB: deterministic disposable simulations across duplicate/out-of-order PSP and RPC events, multi-tenant race, wallet denied approval, finality reorg, DB restart, KMS denied decrypt and delayed recovery. Use no real assets or customer data in these experiments.
XF04 RISK-QUALIFIED CRYPTO SELECTOR: prioritize KMS envelope and verified storage access before advanced FHE/ZK/TEE; only propose advanced options for a specific approved privacy functional requirement and measure proving latency/fees/hardware/metadata leakage.
XF05 FINANCIAL GATEWAY COST OPTIMIZER: compare actual accepted checkout flow, provider fees, recovery burden, tenant auth and support load against the smallest sufficient solution. Do not install TigerBeetle, Temporal, FHE and MPC on every app.
XF06 AUDIT AND INCIDENT READINESS: immutable-by-reference signed evidence, redacted event trace, independently reviewed privileged operations, tested backup/restore, customer communications and current regulation triggers assigned to actual owner or specialist.
XF07 CUSTOMER TRUST UX: clear source-linked invoices, current usage/limits, authorized wallet signing preview, human-readable fees/finality/error/retry, no hidden approve action and accessible recovery/help.
XF08 DOMAIN-COHORT METRICS: approved financial journeys and qualified security proofs per Codex-hour, material misses in seeded fraud/data/exfiltration corpus, p95 billing reconvergence and project-specific total operating cost, not one misleading score across unrelated Web2/Web3 product classes.

## D. Most material still-underexplored startup application areas
- Identity lifecycle and enterprise buyer requirements: passkeys, MFA, SSO/OIDC/SAML and SCIM only when customers demand them; session invalidation, privileged support impersonation, role changes and tenant transfers; establish real org-authorization contract.
- Distribution and revenue operations: product onboarding, failed-payment recovery, trial-to-paid and retention instrumentation with consent; customer account/finance self-service and billing support to avoid costly manual tickets.
- Financial compliance and localization: country/transaction-specific tax documents, applicable Pix/marketplace/custody rules, invoices, refund law, accounting policy and data residency. The GEF flags obligations for qualified legal/accounting review, it does not declare legal compliance. In Brazil the Banco Central publishes Res. 520/2025 amended by Res. 589/2026 for qualifying virtual-asset service providers; applicability depends on actual activity and effective date (some amendments 2026-10-01 and others 2027-01-01).
- Customer trust and continuity: explicit RPO/RTO, encrypted backup with restore drill, status page/on-call, customer incident notifications and breach notification decision routing.
- Integrations and extensibility: stable versioned public APIs/SDKs, OAuth scopes, rate limits, webhook signatures, marketplace/plugin vetting and breaking change migration before ecosystem lock-in.
- Security for AI-assisted finance apps: prompt injection, external tool permissions, financial data exfiltration through retrieval/tools, evaluation of agent transaction boundaries and explicit human authorization for money-moving actions. These are conditional to target app AI functionality.
- Inclusive UX and internationalization: accessible payment/wallet consent, locale-specific date/time/currency, low-bandwidth/mobile experience, financial literacy and support recovery across failure states.
- Fraud, anti-abuse and account recovery: transaction disputes, synthetic collusion, automated account creation/trial abuse, compromised device and recovery abuse, with privacy-preserving triage; real regulatory KYC/AML only when professionally scoped.

## E. Objective work proposal and boundaries
Future WO-000: classify target type simple SaaS subscription / usage AI SaaS / marketplace / regulated financial services / Web3 finance / mixed. Freeze the minimal first release and real local toolchain/CI cost. Validate source and current V1.1 release lineage before new implementation.
Conditional domain work: admit a small subscription app proving duplicate webhook+tenant/rounding/cancel; then an optional usage AI app demonstrating quota and COGS; only if owner needs Web3 finance admit local-chain/offchain ledger reconciliation and key/data protection; custody/mainnet is separately gated after professional review.
No release merely for new tool count. Reject an optimization with uncaught HIGH/CRITICAL seeded bug or increased data exposure. Release DoD includes end-to-end real app, exact-head CI/security, attack-boundary and restore proof, profile-specific cost, owner-approved UX and honest progress/ETA.

## Source verification anchors (as of 2026-09-29, recheck at admission)
https://docs.stripe.com/webhooks
https://www.postgresql.org/docs/current/ddl-rowsecurity.html
https://openfga.dev/docs/use-cases/multi-tenant-saas
https://docs.tigerbeetle.com/concepts/safety/
https://docs.temporal.io/temporal
https://docs.zama.org/protocol/protocol
https://noir-lang.org/docs/
https://csrc.nist.gov/Projects/threshold-cryptography
https://csrc.nist.gov/News/2024/postquantum-cryptography-fips-approved
https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html
https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=589&tipo=Resolu%C3%A7%C3%A3o+BCB
https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis
https://www.pcisecuritystandards.org/faqs/1578/

STOP: CROSS_DOMAIN_RESEARCH_RECORDED_ONLY.
