# GBS-V113-PARALLEL-001 — Work Order e Context Lock

**Estado:** OWNER_DIRECTED_EXCEPTION / IMPLEMENTATION_CANDIDATE / NOT_APPROVED / NOT_RELEASED
**Owner directive:** 2026-10-09, executar diretamente nesta conversa via conta GitHub KayzenRoot, em português brasileiro; consolidar implementação antes da bateria completa de testes.
**Issue:** #432. **Related planned larger module:** #397 (continua PLANNED_NOT_ADMITTED).
**Base imutável de planejamento:** main@921493797728a43aadc9f7840c954ce7e3ebc416.
**Branch isolada:** hotfix/1.1.3-parallel-modules.
**Versão anterior aceita:** @gef-bootstrap/cli@1.1.2.
**Versão candidata:** 1.1.3, apenas se todos os critérios forem satisfeitos.
**Sources:** .engineering/CHECKPOINT.md e .json, .engineering/SOURCE-HIERARCHY.md, .engineering/DECISIONS-LEDGER.md, ADR-0008, AGENTS.md, Requirements, Scope, Architecture, Security, DoD, CLI package e #432.

## Exceção de executor solicitada pelo proprietário

ADR-0008-D1 e D6 atribuem a autoria de código/testes ao Codex. Em 2026-10-09 o proprietário solicitou **especificamente para este patch** autoria de código, testes e documentação pelo ChatGPT usando GitHub. A decisão solicitada não revoga ADR-0008 para outros Work Orders e não autoriza alterações destrutivas, publicação, merge, bypass de CI ou promoção canônica. O registro de exceção permanece **PROPOSTO para auditoria e promoção**, e não altera o texto da ADR existente nem a verdade canônica. O executor deve identificar o conflito normativo objetivamente na auditoria; até a decisão formal, a publicação fica bloqueada.

## OBJECTIVE

Preparar módulos aprovados para execução por até seis agentes Codex simultâneos, com issue 1:1, isolamento declarado, um PR por módulo, dependências e conflito de paths verificados conservadoramente.

## SCOPE / OUT OF SCOPE

Somente comandos opt-in gef parallel plan/issues/prompt, manifesto versionado, checagem de dependências/ciclos, conflito de paths, criação de issues com apply explícito/deduplicação/readback, geração de prompt de primeira leva, testes e documentação de instalação. Corrigir erros concretos diretamente ligados a esse percurso. Fora do escopo: runtime autônomo de agentes, revisão da arquitetura global, reestruturação de módulos, auto-merge, release/publish automático, dependências pagas e implementação integral de #397.

## REQUIREMENTS / ARCHITECTURE RULES / CONSTRAINTS

- CLI bin existente preservado; novo mecanismo em arquivo isolado e distribuído pelo pack.
- Nenhum write no projeto durante plan ou prompt; somente issues --apply pode criar no GitHub autenticado.
- Nenhum shell concatenado; falhar se gh, auth, inventário ou permissão estiver indisponível.
- Dependência não PROMOTED fica fora de todos os lotes; proof SHA declarada não substitui checkpoint.
- Paths glob ambíguos, IDs duplicados, ciclos, predecessores desconhecidos ou conflito de acesso bloqueiam.
- Branch/worktree/PR/evidence por agente; arquivos globais compartilhados em lote isolado.
- Não mudar checkpoint canônico antes de prova e auditoria. Português brasileiro em docs e review.

## ACCEPTANCE CRITERIA

A1: subcomando presente no tarball instalado; A2: JSON manifesto validado determinísticamente; A3: até 6 independentes por lote; A4: bloqueio de overlapping write/write e read/write; A5: falha em DAG inválido/unknown; A6: issue por módulo sem duplicação deliberada; A7: gh indisponível bloqueia; A8: prompt sem execução inventada; A9: sem auto-merge ou promoção; A10: CI/head e smoke de instalação, bundle e compatibilidade.

## TESTS / DELIVERABLES

node --test tests/gef-parallel-patch.test.mjs; npm run build; npm run typecheck; npm run validate; npm audit --audit-level=high; pack e smoke do CLI instalado; GitHub Actions exatas no PR. Entregar código/testes/docs/versionamento candidato/PR/Evidence Bundle/Checkpoint Delta PROPOSTO. Testar após terminar a implementação, exceto preflight de segurança que seja imprescindível para evitar ampliar falhas.

## REVIEW FORMAT / STOP CONDITION

Veredito em português brasileiro: APPROVED / CORRECTION REQUIRED / BLOCKED; HEAD e baseline SHAs, CI, regressões, segurança, instalação, evidências e riscos. Auditoria pelo próprio ChatGPT é NOT_INDEPENDENT. Não declarar publicação ou prontidão para produção sem prova real.

STOP CONDITION: GBS_V113_PARALLEL_001_IMPLEMENTATION_READY_FOR_EXACT_HEAD_AUDIT.
