# GEF Executor Router

This repository is governed by GEF Bootstrap. This file is a **router**, not a project
encyclopedia: it preserves the actor, authority and safety essentials and sends you to the
canonical source that owns the fact you need. It never overrides `.engineering/SOURCE-HIERARCHY.md`,
a frozen canonical source, an admitted Work Order or its Context Lock.

## Start here, in this order

1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json` — current promoted state.
2. `.engineering/SOURCE-HIERARCHY.md` — which source owns which fact, and conflict behaviour.
3. The admitted Work Order and its Context Lock — the only execution contract you may act on.
4. `.engineering/DEFINITION-OF-DONE.md` — what "done" means before you claim it.

## Route by trigger

| Trigger | Read |
| --- | --- |
| Implementing any admitted increment | `.engineering/work-orders/<ID>.md`, `.engineering/context-locks/<ID>.json`, `packages/contracts` work-order contract |
| Changing architecture, contracts or package boundaries | `.engineering/ARCHITECTURE.md` |
| Changing security, secrets, permissions, supply chain or release gates | `.engineering/SECURITY.md` |
| Changing completion, credit or promotion claims | `.engineering/DEFINITION-OF-DONE.md`, `.engineering/BACKLOG.md` |
| Choosing validation, proof or benchmark scope | `.engineering/TEST-BENCHMARK-PLAN.md` |
| Changing a decision, ADR or supersession | `.engineering/DECISIONS-LEDGER.md`, `.engineering/DECISIONS-SUPERSESSION-MAP.md` |
| CI, workflows, rulesets or release mechanics | `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md`, `.engineering/DEPLOYMENT.md` |
| Work beneath `packages/` | `packages/AGENTS.md` |
| Tests beneath `tests/` | `tests/AGENTS.md` |

## Authority

- Authority is domain-specific. Newer text does not override a frozen source in another domain.
- Frozen Scope, Requirements, Architecture, Security, Test Plan and DoD outrank convenience, model
  confidence and this file.
- If authority is missing, stale or conflicted, fail closed. Never invent a requirement to keep
  moving, and never convert UNKNOWN or ambiguity into ALLOW or DONE.
- Derived receipts, indexes and capsules accelerate retrieval; they never supersede canonical truth.

## Actors and GitHub-first handoff (ADR-0008 / D-0063)

Codex is the sole author of implementation, tests, CI and migrations. ChatGPT prepares approved
governance documents and issue-backed Work Orders, coordinates GitHub and performs objective
review. A planning document or an unadmitted issue never authorizes implementation. All GitHub
writes in this repository use the owner account `KayzenRoot`; never request or wait for collaborator
review and never switch connected accounts. The owner records the exact-head semantic audit and
must not label it independent.

## Execution discipline

- Compile the minimum sufficient authoritative context, then build a dependency-ordered work DAG
  and follow the semantic critical path.
- Validate progressively: cheap and static checks first, focused tests for changed surfaces
  second, broad regression only at governed integration boundaries.
- Reuse passing evidence while its exact dependencies hold. On failure, repair the smallest
  invalidated node and its dependents; do not restart a valid plan.
- Keep a negative-search ledger. Diagnose before rerunning; never loop on an unchanged command.
- Never weaken tests, TypeScript strictness, security controls, exact-state bindings or
  fail-closed behaviour to make a check green, and never claim completion from model confidence.

## Safety

- No force push, history rewrite or destructive cleanup without the specific governed S4 path.
- No secrets in code, logs, fixtures, prompts or receipts.
- GitHub and provider automation are acceleration and evidence layers; runtime product correctness
  must not depend on GitHub. The product must stay operable when the repository is private and
  automation is disabled.
- Preserve branch protection and required checks. Never bypass a failing or pending check, never
  self-approve, and never promote a canonical checkpoint without the governed promotion path.

## Fresh-context construction routing

Chat history and conversational summaries are informational; they never establish progress,
approvals, branch state or authority. After a new chat or a major handoff: verify repository,
account, branch and exact HEAD; read the checkpoint pair, the active Work Order and Context Lock,
source hierarchy, current evidence and required checks; reconcile with the M18 resume rules, where
stale bindings, conflicts, orphan work or unresolved blockers stop execution; report through the
M20 response contract; then state one canonical next necessary action, or `NONE`/`UNKNOWN` with the
blocking evidence. Never select a successor from chat history or skip an admitted Work Order.

## Completion

A green test is evidence, not completion, and a merged PR is not `MODULE_DONE`. Completion needs the
project DoD, an exact-head owner audit, an evidence bundle and governed checkpoint promotion.

## GBS-GOV-FAST-001 — adoção de ADR-0012 na V1.2 (condicionada à integração)
A instrução Owner de 2026-10-16 aplica-se **a esta própria V1.2**. Após merge protegido da proposta ADR-0012/D-0065, leia esse ADR como supersessão **limitada** da regra de ator Codex-only acima: Codex prioriza código novo/complexo; ChatGPT pode cuidar de documentação, testes e CI via GitHub, triagem e pequenas correções técnicas com escopo e riscos validados. Não modificar fonte canônica a cada resposta. Atualizar documentação apenas por contrato/decisão/release/aceitação material; evidências menores vivem na PR/CI. Na GBS-V12-WO-003, preservar lock e WOs, revalidar somente drift normativo e avançar para código Marathon + Delta Assurance. **Não** dispensar branch protection, os quatro status checks, obrigação do Test Plan/DoD/release ou review independente quando obrigatório. A PR #467 foi integrada à `main` (squash `f0dcc60622f9f41368443f84caf409ed91b8c0cf`); ADR-0012/D-0065 é a autoridade corrente no domínio de atores e Fast Delivery.

## D-0066 — executor ChatGPT exclusivamente na WO-003 (emenda pendente)
A decisão explícita do Owner de 2026-10-16 permite ChatGPT como executor alternativo de U12-03 e U12-05 **somente depois** de merge protegido da emenda e Context Lock efetivo. Manter 14 padrões de escrita, teste ELEVATED, controle de risco, ausência de HIGH/CRITICAL, revisão do HEAD e nenhuma autopromoção de checkpoint ou publicação. Fora desse domínio, aplicar ADR-0012 e contratos específicos, sem extrapolar esta exceção.
