# MASTER — Next Labs Engineering Pipeline Pilot

Data de referência: 2026-09-28
Repositório piloto: [KayzenRoot/gef-bootstrap](https://github.com/KayzenRoot/gef-bootstrap)
Work Order: [GBS-MAINT-PLATFORM-001](../.engineering/work-orders/GBS-MAINT-PLATFORM-001.md)
Context Lock: [GBS-MAINT-PLATFORM-001](../.engineering/context-locks/GBS-MAINT-PLATFORM-001.md)
Evidence Bundle: [GBS-MAINT-PLATFORM-001](../.engineering/GBS-MAINT-PLATFORM-001-EVIDENCE.md)

## Resultado e limite

Este arquivo reconstrói o piloto Next Labs no repositório `KayzenRoot/gef-bootstrap`. A base verificada foi `main` em `dfe14590521aead09ab0d8360fefbaea3e230aff`. A proposta está publicada em [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307), com [lista de commits](https://github.com/KayzenRoot/gef-bootstrap/pull/307/commits), [checks do head](https://github.com/KayzenRoot/gef-bootstrap/pull/307/checks) e [reviews](https://github.com/KayzenRoot/gef-bootstrap/pull/307/reviews):

- Primeiro candidato verificado: `14769a9dc01411b71039ac4beb12a3014a0350bc`; os resultados vinculados a ele não valem para commits seguintes.
- Estado de integração: PR permanece aberto; não houve merge nem auto-merge.
- Regras administrativas: atualizadas uma vez e relidas pela API.
- Expansão para outros repositórios: **NÃO EXECUTADA**.
- Checkpoints históricos V1, inclusive 1088/1088: preservados.
- Linha `release/1.1`: fora do escopo.
- Revisões automáticas do Codex e `@codex review`: não habilitados nem executados.

Não considere um check verde como aceitação do produto. O estado de prontidão depende de CI do SHA corrente, análise dos revisores independentes, gates externos e ausência de regressões.

## Estado inicial confirmado

- `main` estava no SHA `dfe14590521aead09ab0d8360fefbaea3e230aff`; árvore `9dd4d05aef418a215ea12b6d9a65b8d1703ebab7`.
- A conta autenticada no conector e no navegador era KayzenRoot, com permissão administrativa no repositório. `gh auth status` no CLI não tinha uma sessão autenticada.
- Ruleset `Main Branch Protection` (ID `23566111`) cobria apenas `main`. Os quatro contextos obrigatórios agora são `Repository validation`, `Pipeline integrity`, `Gitleaks secrets` e `Trivy filesystem and configuration`.
- Pull request obrigatório, exigência de aprovação em zero, resolução de conversas, bloqueio de force push e exclusão foram mantidos. Nenhum bypass foi adicionado. [Configuração da ruleset](https://github.com/KayzenRoot/gef-bootstrap/settings/rules/23566111).
- Dependency Graph, alertas e atualizações de segurança do Dependabot estavam ativos. Dependency Review ainda não existia.
- As GitHub Apps de SonarQube Cloud, Socket e StepSecurity já tinham permissão para todos os repositórios da conta. Essa abrangência é anterior ao piloto e não foi ampliada; nenhuma permissão global foi alterada.
- Os workflows existentes já cobriam validação do repositório, integridade de Actions, Trivy, Gitleaks, CodeQL, Codecov e CI por módulos. Todas as referências `uses:` existentes estavam fixadas por SHA. Dependabot permanece como atualizador; Renovate não foi habilitado.
- CodeRabbit e Greptile já constavam como revisores externos. Plano, limite comercial e comportamento neste PR precisam ser confirmados pelas execuções atuais; não foram adicionados revisores de IA.

## Inventário e decisão

| COMPONENTE | STATUS | EVIDÊNCIA | CUSTO | OBSERVAÇÕES |
| --- | --- | --- | --- | --- |
| Branch protection | PASS | [Ruleset 23566111](https://github.com/KayzenRoot/gef-bootstrap/settings/rules/23566111); quatro checks SUCCESS na base listados no Evidence Bundle | Sem custo novo confirmado | Lida após atualização; sem bypass |
| Repository Validation | PASS | [Run 36429957262](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957262) na base | Custo de Actions não exposto pela sessão | Novo candidato substitui a compilação TypeScript duplicada por `npm run validate` |
| Pipeline Integrity | PASS | [Run 36429957306](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957306) na base | Custo de Actions não exposto | Também valida YAML e SHA no candidato |
| Gitleaks e Trivy | PASS | [Run 36429957225](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957225) na base | Sem assinatura própria confirmada | Check existente preservado |
| CodeQL | PASS | [Run 36429957513](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957513) na base | Custo faturado não disponível | Permanece condicional por filtros de caminhos |
| SonarQube Cloud | BLOCKED | [Projeto](https://sonarcloud.io/project/overview?id=KayzenRoot_gef-bootstrap); [Quality Gate do PR #307](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=307) aprovado, 0 novos issues | Plano da conta e elegibilidade gratuita da licença `UNLICENSED` não confirmados; nenhuma cobrança foi observada | Análise real concluída; primeira análise de main “Not Computed”; Sonar way e New Code “Previous version”; confirmar Free permanente |
| Socket Security | PASS | [Scan da base](https://socket.dev/dashboard/org/nexlabs/sbom/59dcf573-6288-4f6d-9341-487bb9d526e7); [relatório do PR](https://socket.dev/dashboard/org/nexlabs/sbom/5eedee81-4523-459c-9e89-7995b63ffc79) | Dashboard indicou `NexLabs Free`; nenhum plano pago ativado | Base: 29 dependências e 0 alertas; o PR não alterou dependências |
| StepSecurity app/telemetria | PASS | [Dashboard de Repository Validation](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782874) e [Free Security Pilot](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782940) | UI mostrou “Enterprise Free Trial, 13 days left”; nenhuma instalação ou ativação foi feita nesta execução. Community é gratuito para repositórios públicos com runners GitHub-hosted, sem cartão, segundo [pricing](https://www.stepsecurity.io/pricing); billing/transição da conta não foi confirmado | Aplicativo já abrangia todos os repositórios; este escopo não foi ampliado |
| Harden Runner | PASS | [Free Security Pilot](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782940): 4 destinos, 45 HTTPS, 5 Actions, 0 detecções. [CodeQL](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782838): 3 destinos, 40 HTTPS, 3 Actions, 0 detecções | Sem custo separado confirmado; monitorar o estado do trial | Somente `audit`, egress permitido. Um 404 de feature flags apareceu no log, sem impedir coleta. Uma amostra é insuficiente para baseline de anomalias |
| GitHub Dependency Review | PASS | [Run 36442782888](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782888) passou no PR real C1 | Action pública; custo de Actions não exposto | HIGH/CRITICAL; somente leitura, seguro para fork, sem comentário/escrita e sem regra de licença |
| OpenSSF Scorecard | NOT_VERIFIED | `.github/workflows/scorecard.yml`; a página Actions informou “This workflow does not exist” na branch default, pois o arquivo existe somente no branch do PR | Action pública; custo de Actions não disponível | `workflow_dispatch` não pode ser usado antes da integração; não fazer merge para contornar isso. Sem publicação na API pública; SARIF previsto somente no code scanning do repositório |
| Codecov | PASS | [Projeto](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap); [run 36442783038](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442783038) e comentário do bot no [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307) | Tier gratuito publicado para repositórios públicos ([pricing](https://about.codecov.io/pricing/)); billing da conta não foi consultado | C1 aceitou LCOV e bot confirmou linhas alteradas cobertas; relatório agregado antigo inclui 8.030 de 8.231 linhas em `tests/`, então não há threshold de cobertura de produto |
| Dependabot | PASS | [Configuração](https://github.com/KayzenRoot/gef-bootstrap/network/updates) | Serviço GitHub; custo faturado não disponível | Alertas, security updates e version updates ativos; nenhuma duplicação com Renovate |
| CodeRabbit | PASS | [Reviews](https://github.com/KayzenRoot/gef-bootstrap/pull/307/reviews): não gerou comentários acionáveis no C1; renovar no head atual | Revisão gratuita publicada para repositórios públicos ([pricing](https://www.coderabbit.ai/pricing)); nenhum add-on pago habilitado | Nenhum novo revisor adicionado |
| Greptile | BLOCKED | Portal da organização informa que o serviço encerra ao fim do trial; P2 anterior no MASTER foi corrigido; revisar head atual em [reviews](https://github.com/KayzenRoot/gef-bootstrap/pull/307/reviews) | Starter gratuito limita-se a 1 desenvolvedor ativo e 50 créditos/mês ([pricing](https://www.greptile.com/pricing)); a organização tem múltiplos colaboradores e quatro repos, sem migração gratuita segura verificada. O piloto não ativou plano pago nem alterou billing | Administrador precisa confirmar migração suportada sem afetar demais usuários/repos ou aceitar interrupção |
| SBOM, procedência e assinatura de release | NOT_APPLICABLE | Não existe neste Work Order artefato de distribuição a atestar | Sem custo novo | Não se fabricaram atestações nem artefatos |
| Rollout corporativo | PASS | [Plano de rollout](NEXT-LABS-ROLLOUT-READY-PLAN.md) | Sem custo novo | Projeto apenas preparado; nenhum outro repositório foi alterado |
| Adaptadores web/runtime | PASS | [Guia de adaptadores](NEXT-LABS-PRODUCT-ADAPTERS.md) | Sem instalação | Playwright, Chromatic, Vercel, Sentry e OpenTelemetry só para produtos elegíveis |

## Continuidade em planos gratuitos

O usuário acrescentou que todos os fluxos devem continuar depois do término dos trials, sempre em plano gratuito. Um plano Free anunciado pelo fornecedor não comprova o estado da conta atual nem seu downgrade.

| Serviço | Status | Verificação gratuita e pendência |
| --- | --- | --- |
| GitHub Actions, Dependabot e checks nativos | PASS | Workflows continuam nos recursos do GitHub; faturamento/minutos da conta não foram expostos, e nenhuma cobrança foi ativada pelo piloto. |
| Socket Security | PASS | Dashboard exibiu `NexLabs Free`; [plano publicado](https://socket.dev/pricing). |
| Codecov | PASS | Upload de LCOV funcionou; [plano gratuito para repositórios públicos](https://about.codecov.io/pricing/). Conta não alterada. |
| CodeRabbit | PASS | [Oferta gratuita para repositórios públicos](https://www.coderabbit.ai/pricing); nenhum recurso on-demand pago usado. |
| SonarQube Cloud | BLOCKED | Quality Gate funcionou, mas billing da conta não foi confirmado e a licença do projeto é `UNLICENSED`. Confirmar elegibilidade permanente conforme [planos oficiais](https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans). |
| StepSecurity | BLOCKED | Painel mostrou trial Enterprise ativo. Community é gratuito para repositórios públicos com runners GitHub-hosted ([pricing](https://www.stepsecurity.io/pricing)), mas o downgrade da conta não foi verificado; confirmar antes do fim do trial. |
| Greptile | BLOCKED | O portal informa que o serviço termina após o trial. Starter limita-se a 1 desenvolvedor ativo e 50 créditos ([pricing](https://www.greptile.com/pricing)); a conta atual é uma organização com múltiplos colaboradores e quatro repos. Migração sem impacto não verificada; o piloto não alterou billing. |

Nenhum cartão, trial adicional, crédito ou plano pago foi ativado. Os checks essenciais não dependem de Sonar, StepSecurity, Greptile ou revisores de IA como contexts obrigatórios. O pipeline GitHub pode continuar, mas a exigência de manter todos os aplicativos usados no piloto em Free ainda está **BLOCKED** até o administrador confirmar a elegibilidade/transição de Sonar e StepSecurity e resolver o Greptile.

## Workflows introduzidos ou ajustados

1. `dependency-review.yml`: revisa alterações de dependências em pull requests para `main`; falha em HIGH e CRITICAL; usa `pull_request`, permissões `contents: read`, não publica comentário e não impõe licenças sem política aceita.
2. `scorecard.yml`: auditoria semanal às segundas-feiras e execução manual; Action fixada por SHA; `publish_results: false`; SARIF limitado ao mecanismo de code scanning do repositório.
3. Harden Runner v2.21.1 foi fixado em `e14015d583714f6e62063499dc959a02595150a1`, explicitamente `egress-policy: audit`, nos jobs Linux relevantes de validação, segurança, CodeQL, Codecov e Scorecard. Não há bloqueio de egress nem endpoint privilegiado.
4. `repository-validation.yml` usa `npm run validate`, que combina o mesmo `tsc -b` usado em `typecheck` com a suíte de testes; o comando anterior executava `tsc -b` uma segunda vez via `npm test`.

As ações Dependency Review v5.0.0 (`a1d282b36b6f3519aa1f3fc636f609c47dddb294`) e Scorecard v2.4.4 (`2d1146689b8cda280b9bc96326124645441f03bc`) foram verificadas nas fontes oficiais e fixadas por commit. Actions já existentes continuam imutáveis.

## Tempo, custo e cobertura

Na base, os quatro workflows principais terminaram SUCCESS: Repository Validation 29 s, Pipeline Integrity 12 s, Free Security Pilot 20 s e CodeQL 131 s. A API não indicou fila mensurável; execução serial agregada observada: 192 segundos de runner; tempo de parede concorrente observado: 131 segundos. Isso é uma amostra, não uma média histórica nem um custo faturado. Não havia telemetria suficiente para frequência de falha, minutos mensais, custos monetários, cache hit rate ou tempos por suíte.

Em execução local, `npm ci` terminou em 17 s com 0 vulnerabilidades. Medição sequencial única do fluxo antigo: `npm run typecheck` 1,14 s e `npm test` 7,84 s (total 8,98 s). O fluxo novo `npm run validate` levou 8,50 s; ambos passaram os mesmos 1.153 testes e compilaram com `tsc -b`. O delta observado foi 0,48 s nesta amostra e pode ser ruído; nenhuma economia percentual ou faturada foi estimada. `npm audit --audit-level=high` terminou com 0 vulnerabilidades.

As quatro matrizes M41–M63 rodaram porque seus filtros incluem `.engineering/**`, que coincidiu com Work Order/Context Lock/Evidence deste piloto. Os tempos de jobs foram: M41–M47 62 s, M48–M54 64 s, M55–M61 102 s e M62–M63 68 s (296 s de runner no total; 28–73 s de parede, em paralelo). Evidências: [M41–M47](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782957), [M48–M54](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782793), [M55–M61](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782834), [M62–M63](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782745). Os filtros foram preservados porque ainda não há mapeamento comprovado de quais artefatos de governança podem ser excluídos sem perder validação relevante.

O Codecov recebeu LCOV em `3c4455a080055fb65fee7d7021b72c3d40c5ae52`: `tests/` domina o conjunto agregado. Não foi configurado threshold. CodeQL e Codecov mantêm seus filtros e não se tornam checks obrigatórios globais.

## Manutenção e recuperação

1. Leia este MASTER, o Work Order e o Context Lock antes de retomar. Compare `main` e o head do PR; qualquer mudança de SHA invalida evidência de CI e revisão anterior.
2. Consulte sempre [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307), seus [commits](https://github.com/KayzenRoot/gef-bootstrap/pull/307/commits) e [checks](https://github.com/KayzenRoot/gef-bootstrap/pull/307/checks) para o SHA corrente; não transfira resultados entre commits.
3. Corrija vulnerabilidades confirmadas; trate alertas incertos com triagem documentada. Não use exceção para esconder resultado nem mude regras da main sem Work Order e backup.
4. Se Harden Runner apontar tráfego inesperado, mantenha modo de auditoria, valide domínio, processo e job, documente justificativa e só proponha política de rede em outro escopo.
5. Se Dependency Review falhar, confirme o delta de dependências e a origem no advisory database; não bloqueie histórico preexistente por esta execução.
6. Se CodeQL/Codecov não rodarem por filtros, mantenha `NOT_VERIFIED` para aquele SHA, sem tornar o check obrigatório.
7. Não use Codex review nem auto-merge. A revisão independente e autorização para merge são gates separados.
8. Não promova o checkpoint de manutenção nem edite o checkpoint histórico da V1 antes da aceitação independente e do merge permitido.

## Decisão de promoção

Este MASTER é um registro de reconstrução, não autorização de rollout. O piloto só pode ser considerado completo quando os gates pendentes estiverem vinculados ao head exato e a revisão independente tiver sido tratada. A aplicação a qualquer outro repositório requer nova aprovação específica e preflight por repositório.
