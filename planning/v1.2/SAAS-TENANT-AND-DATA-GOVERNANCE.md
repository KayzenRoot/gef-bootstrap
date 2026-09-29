# GEF V1.2 — SaaS Tenant Isolation, Privacy and Customer-Trust Profile

STATUS: FUTURE RESEARCH CANDIDATE. No app/runtime/CI or customer data changed. This bridges SaaS-FINANCE-FACTORY.md, WEB3-DATA-SECURITY.md and existing GEF Security, Threat/Proof Graph, release and telemetry contracts. Actual regulatory certification is not implied.

## 1. Threat model
A SaaS stores information for multiple customers and often has organization administrators, support employees, payments, external contractors and integration tokens. Attacks can occur through API IDOR/BOLA, exports, search, background queues, tenant-unscoped cache keys, vector search, object storage, websocket subscriptions, logs, BI/analytics queries, report generation and restore. Database RLS helps but is not a whole-app security boundary by itself.

## 2. Proposed future mechanisms
TENANT01 Identity and Auth Factory: approved session and organization model, invitation acceptance, MFA/passkeys when threat model warrants, scoped API keys/service accounts and session revocation, enterprise SSO/SCIM only when customer requirements demand them. Never assume wallet ownership automatically authorizes SaaS organization admin. Use signed nonce, domain, chain, expiration/replay binding for owner-approved Web3 wallet login.
TENANT02 Defense-in-Depth Isolation Sentinel: authorization at API function/resource/field and data-layer row/object, ORM/repository query policy, websocket tenant scope, search and vector retrieval, Redis partition/keys and file/object paths. Use PostgreSQL RLS where suitable with non-bypass application DB role, owner bypass explicit tests and FORCE RLS if appropriate; decide database-per-tenant where contractual isolation or scale justifies extra maintenance. Official https://www.postgresql.org/docs/18/ddl-rowsecurity.html and OWASP ASVS 5 https://github.com/OWASP/ASVS/blob/master/5.0/en/0x17-V8-Authorization.md .
TENANT03 Data-Lifecycle Guardian: per-data-class collection purpose/retention, deletion or anonymization, export, opt-in consent version, tenant transfer and legal hold where appropriate. Offchain PII required in most Web3 integrations; never store irreversible sensitive data on public chain. Backups, indexes, analytics and logs need documented lifecycle and deletion limitations.
TENANT04 Confidential Access and Key Version Engine: encryption in transit/at rest as floor, field-level envelope encryption where approved, centralized KMS/HSM/managed secret store with strict key permissions and periodic restoration/rotation proof; local dev uses disposable keys. Cloud KMS is optional provider profile rather than generic paid dependency.
TENANT05 Backup and Restore Assurance: backup snapshots and point-in-time restore for supported DB, immutable offline/off-account copy if threat requires, disaster recovery runbooks, verified restore to isolated environment, define owner-approved RPO/RTO and game/Web3 chain-vs-private ledger reconciliation. A backup file existing != verified restorable.
TENANT06 Security Incident Controller: immutable-by-reference sanitized audit events, alert thresholds and escalation to an operator, remediation issue/incident timeline, breach notification/legal escalation determination by qualified owner, prevent sensitive payload in CI/GitHub logs and traces; link one confirmed defect to minimized repeatable regression fixture.
TENANT07 Vendor/Connector Boundary: apply least-scope tokens, webhook signatures, strict tenant-to-external-account mapping, per-provider secrets, provider API timeouts/retries and no cross-tenant leakage through shared webhooks or worker queues. When provider outage occurs, fail according to approved product behavior rather than unsafe fallback authorization.
TENANT08 Enterprise Evidence Packet: prepare customer-appropriate security questionnaire information, SBOM/provenance, application security test results, access review, data mapping, encryption key custody diagrams, subprocessors/vendor register and disaster recovery test receipts. Do not claim SOC2/ISO27001/PCI compliance from automated controls alone; outside independent attestation is separate.

## 3. Representative adversarial tests
- Tenant A user guesses tenant B invoice/ledger transaction ID through API, export, generated report, queue and websocket.
- Superuser app DB role unintentionally bypasses RLS in application path; test negative through normal pool and admin-only maintenance.
- Tenant A usage/AI context leaks into tenant B vector retrieval, cache and telemetry; test exact isolation across application services.
- Invite/role escalation, old session after role change, compromised long-lived API key and deleted user access stale in queue.
- Refunds/credits/split payouts cannot be initiated across tenants even if payment processor event is valid.
- All sensitive fields redacted in traces, LLM context, CI logs and support views; reidentification via public blockchain event metadata studied separately.
- Restore corrupted or wrong tenant snapshot in disposable env must fail; restore valid backup under configured RPO/RTO test should pass.
- App-specific security floor must honor independently reviewed HIGH/CRITICAL blockers; no staging-only tests counted as production completed.

## 4. Lean implementation and quality budget
New small single-tenant SaaS does not need a multi-region tenant management platform. Multi-tenant SaaS defaults to small reproducible account/resource/field isolation contract plus approved data and export matrix; enterprise SSO, per-tenant encryption keys and isolated DB deployment only by real demand/risk.
CI uses fast tenant negative tests on affected API/query surfaces, broad data boundary tests on auth/infra changes, exact-head release gates. Independent audit may be required by risk classification. A one-click self-serve sign-up without a billing/tenant/role threat model does not count as done.

## 5. Sources, costs and regulation handoff
PostgreSQL RLS official doc above; ANPD security guidance for small processing agents https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte . PCI SSC confirms outsourced checkout can still entail merchant-page security and SAQ A ASV scans in PCI DSS 4.x: https://www.pcisecuritystandards.org/faqs/1604/ .
Before claiming conformant regulation/privacy certifications, check current jurisdiction/customer and consult qualified specialists. Candidate cost model: hosting/encryption/managed auth/vendor pricing, customer count, tenancy shape, backup retention, tests and independent review. Free open-source availability does not equal zero maintenance/security cost.

STOP: SAAS_TENANT_DATA_RESEARCH_ONLY.
