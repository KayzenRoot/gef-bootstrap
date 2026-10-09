# GBS-V113-PARALLEL-001 — Evidence Bundle Candidato
Data: 2026-10-09. Work Order/Issue: [#432](https://github.com/KayzenRoot/gef-bootstrap/issues/432). [PR #433](https://github.com/KayzenRoot/gef-bootstrap/pull/433).
- Base SHA: `921493797728a43aadc9f7840c954ce7e3ebc416`.
- Código com correções de compatibilidade e lotes: `d5387f6e38722716a0dc3016866a7234dbb8adc7`. Esta evidência e orientação Jev são alterações posteriores; exigir novo CI no HEAD exato.
- Branch: `hotfix/1.1.3-parallel-modules`, destino: `main`.
- Candidato funcional 1.1.3 NÃO PUBLICADO. Versão dos manifests npm mantida em 1.1.2 para não quebrar matrizes de migração, até gate de release governado.
- Diff funcional: CLI opcional `gef parallel plan/issues/prompt`, DAG, slots até seis, conflitos path READ/WRITE, separação de worktrees, issue 1:1 deduplicada com read-back e rejeição de contrato obsoleto, `--batch N`, branch por módulo e Work Order, orientação Jev opcional. Sem bypass, sem auto-merge, sem promoção.
- Testes introduzidos: `tests/gef-parallel-patch.test.mjs` (inclui sete módulos, ciclos, dependências, path traversal, duplicidade de issues, lotes posteriores e issue stale). A evidência definitiva exige execução de CI/exact-head do commit final.
- CI observado no SHA d5387f6: V1.1 exact-head package candidate: SUCCESS; Repository validation: SUCCESS; CodeQL: SUCCESS; Gitleaks/Trivy/Dependency Review: SUCCESS; Upgrade and recovery Ubuntu e Windows: SUCCESS; regressões observadas: SUCCESS. macOS e outros checks ainda estavam pendentes no momento do registro.
- Bloqueio ativo: **SonarCloud Quality Gate FAILURE**, Reliability C e Security B no novo código, exigido A: [análise](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=433). Não afirmar correção sem anotações verificadas e reanálise.
- Limitação de execução local: ambiente desta conversa sem DNS para github.com, portanto não houve clone e testes locais aqui. Provas referidas são retornos reais do CI hospedado.
- GitHub issues requerem gh autenticado; corridas entre aplicadores simultâneos não são atomicamente travadas. Source declarações de paths e promotionSha exigem validação do executor/auditor no projeto.
- ADR-0011 de exceção ChatGPT para esta issue continua PROPOSED, sem promoção. Auditoria do executor: NOT_INDEPENDENT.
- Veredito provisório: **CORRECTION REQUIRED** (Sonar, checks exatos e auditoria independente); checkpoint delta segue PROPOSED. Não mergear/publicar/release até gates cumpridos.
