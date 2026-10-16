# ADR-0012 — Fast Delivery, documentação por marco e execução proporcional ao risco

- **Work ID:** `GBS-GOV-FAST-001`
- **Decision ID:** `D-0065`
- **Owner decision:** 2026-10-16, expressamente extensível ao desenvolvimento da **V1.2 deste próprio repositório**, não somente a projetos novos.
- **Status:** `PROPOSED_PENDING_PROTECTED_MERGE`. Só passa a `EFFECTIVE_ON_MAIN` após a integração protegida desta PR, revisão objetiva do HEAD e verificações mandatórias.
- **Observed base:** `main@6a81d4db846c4ee7180cea4159d7682296d7c283`.
- **Supersedes narrowly:** as cláusulas de exclusividade de autor Codex, a obrigação de atualização documental a cada resposta, os ciclos de PR somente de planejamento por microetapa e a interpretação de testes amplos repetidos durante desenvolvimento em ADR-0008/D-0063, nos roteiros AGENTS/workflow e nas orientações de intensidade. Não altera o produto, o escopo congelado, requisitos, proteções ou aceitação histórica.

## Problema e objetivo

A V1.2 contabiliza 3/10 U12 aceitos e a implementação funcional da GBS-V12-WO-003 ainda não foi iniciada. Houve esforço documental e de autorização desproporcional ao código entregue. O objetivo é maximizar **código funcional aprovado por ciclo**, não volume de documentos/checks. Nenhum ganho de tempo numérico é alegado sem medição.

## Decisão: quem faz o quê

- **Codex:** executor prioritário de **código novo de produto e mudanças complexas**, com testes locais necessários para seu próprio código e Evidence Bundle compacto na PR de implementação. Não é um gargalo obrigatório para simples trabalho de documentação, revisão ou QA.
- **ChatGPT + GitHub:** planejamento inicial, documentação canônica por marcos, triagem de bugs, auditoria de diffs/CI, execução/coordenação dos testes disponíveis no GitHub e pequenas correções pontuais de testes, scripts, CI e bugs simples *quando de risco compatível, dentro do escopo admitido e objetivamente validáveis pela CI*. Não declarar que executou testes locais quando apenas leu logs. Desviar correções extensas, de alto risco ou que exigem ambiente local para Codex.
- **Owner:** define o escopo e autoriza ações S4, release, exceções sensíveis e aceitação quando exigida; revisão de ChatGPT sob instrução do Owner permanece `NOT_INDEPENDENT`.
- GitHub Actions prova resultados mecânicos; não substitui julgamento semântico.

## Regra: documentação somente por marco

1. **Antes de implementar**, usar o Source Pack e decisões existentes; criar **um** plano/Work Order suficientemente específico por incremento funcional, reaproveitando materiais já aprovados.
2. Depois do planejamento, a documentação fica estável. **Não** abrir PR, editar checkpoint, recalcular fingerprints, produzir PDF ou reescrever Work Order **por resposta, por teste ou por microcorreção**.
3. Atualizar fontes canônicas somente se mudar obrigação/escopo, decisão, contrato/arquitetura, segurança, operação pública ou houver **marco real de aceitação**. Um único delta mínimo e verificável deve atualizar documentos relacionados depois da auditoria.
4. Evidência rotineira vive nos links de PR, CI e comentários concisos; não precisa gerar documento extra sem necessidade de release, recuperação ou prova.
5. Uma PR funcional coesa por incremento; corrigir no mesmo PR; não abrir sequência de PRs exclusivamente de autorização quando já houver autoridade e contrato válidos.
6. Só invalidar Context Locks e provas quando a mudança afetar suas dependências *normativas*. Atualização de Git cache, novo comentário, evidência administrativa ou texto irrelevante não é motivo automático para novo planejamento.

## Testes proporcionais ao risco, sem falsos PASS

| Etapa | Verificação mínima proporcional |
| --- | --- |
| Documentação pura sem efeito de contrato | Verificação de links/estrutura/diff e **checks obrigatórios do GitHub**; sem bateria local de testes de produto só para documentar. |
| LOW, código simples isolado | Tipo/build ou teste afetado conforme natureza da mudança; comportamento/regressão pertinente. |
| STANDARD, código funcional | Unitário e integração afetada, typecheck/build quando aplicável; regressão dos contratos impactados. |
| ELEVATED | STANDARD + regressão transversal, recuperação/concorrência/segurança/portabilidade quando impactadas. |
| HIGH_ASSURANCE | Provas fortes, revisão especialista independente quando exigida e todos os gates de produção pertinentes. |

**Iteração:** rodar os testes direcionados depois de cada delta relevante; corrigir falhas no mesmo PR; não repetir `npm run validate` ou matrizes completas a cada comentário/commit sem alteração de dependência. **Gate final:** executar os quatro checks mandatórios da branch e todos os testes de aceitação/release/segurança exigidos pelo Test & Benchmark Plan, DoD e Deployment para o risco e a claim. Nenhum teste exigido deixa de ser obrigatório por este ADR. Só alterar workflows/políticas de CI por PR de implementação próprio, após esta decisão efetiva, sem neutralizar status checks.

## Aplicação imediata à V1.2 do GEF Bootstrap

- **Escopo explicitamente abrangido:** `KayzenRoot/gef-bootstrap`, linha `V1.2`, todas as U12 ainda abertas, começando pela atual `GBS-V12-WO-003` (U12-03 Marathon e U12-05 Delta Assurance).
- **Preservar tudo que já está pronto:** WO-003 e seu Context Lock aprovado, Issue #462, 14 padrões de escrita, código prévio, DoD e plano de testes. **Não** criar outra rodada de planejamento e **não** converter V1.2 3/10 em 5/10 antes de prova.
- Após este ADR entrar em `main`, revalidar *somente* impactos de autoridade/fingerprint sobre o lock WO-003. Se stale material, produzir um delta mínimo de rebind no mesmo incremento, sem inventar uma missão nova. Codex executa as duas funcionalidades; ChatGPT conduz QA, testes de CI, auditoria, correções simples e documentação somente nos marcos.
- Os demais U12 seguem a mesma prática, sem dispensar Work Order admissível, integração, evidência ou segurança; não iniciar sucessor dependente antes da aceitação.
- Separar publicação **1.1.3** da conclusão da **V1.2**. A release npm continua bloqueada pelos 21 alertas históricos Gitleaks `UNKNOWN` da Issue #439 e demais gates de publicação. Não omitir scanner, suprimir alertas indiscriminadamente ou publicar versão não verificada.

## Limites, entrega e STOP

**In scope:** só as 6 fontes textuais de governança nesta PR mais este ADR. **Out of scope:** produto, fixtures, testes, scripts executáveis, workflows, rulesets, SECURITY/DoD/Test Plan/Deployment congelados, alteração de checkpoint, tags e npm. Não criar nova política contra essas fontes por silêncio. A interpretação de execução incremental aqui é complementar às obrigações finais congeladas.

**Evidence/acceptance:** diff restrito e auditável; identificação exata base/head; CI e os quatro checks do ruleset aprovados no HEAD; nenhum HIGH/CRITICAL; owner audit `NOT_INDEPENDENT`; merge protegido. Mudança constitucional de ator explicitada aqui e no Constitution Lock, preservando demais grupos. Após merge, registrar marco de adoção uma única vez no checkpoint governado, sem atualização por resposta.

**STOP:** `GBS_GOV_FAST_001_PROPOSAL_PR_PENDING_EXACT_HEAD_AUDIT_AND_PROTECTED_MERGE`.
