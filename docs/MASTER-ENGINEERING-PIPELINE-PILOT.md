# MASTER — Next Labs Engineering Pipeline Pilot

Data de referência: 2026-09-28
Repositório piloto: [KayzenRoot/gef-bootstrap](https://github.com/KayzenRoot/gef-bootstrap)
Work Order: [GBS-MAINT-PLATFORM-001](../.engineering/work-orders/GBS-MAINT-PLATFORM-001.md)
Context Lock: [GBS-MAINT-PLATFORM-001](../.engineering/context-locks/GBS-MAINT-PLATFORM-001.md)
Evidence Bundle: [GBS-MAINT-PLATFORM-001](../.engineering/GBS-MAINT-PLATFORM-001-EVIDENCE.md)

## Resultado e limite

Este arquivo reconstrói o piloto Next Labs no repositório `KayzenRoot/gef-bootstrap`. A execução original partiu de `main` em `dfe14590521aead09ab0d8360fefbaea3e230aff`; o estado corrente de `main` foi relido em `73ab68f3f33f894027fb7a04c2696b02b839060a` depois dos PRs #307 e #308.

- Primeiro candidato verificado: `14769a9dc01411b71039ac4beb12a3014a0350bc`; os resultados vinculados a ele não valem para commits seguintes.
- Integração do piloto em `main`: [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307) foi integrado em `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`; [PR #308](https://github.com/KayzenRoot/gef-bootstrap/pull/308) foi integrado em `73ab68f3f33f894027fb7a04c2696b02b839060a`.
- Forward-port separado para `release/1.1`: [PR #309](https://github.com/KayzenRoot/gef-bootstrap/pull/309) foi integrado em `44c6618ece1593365fb6c7f559d13c7166e7df26`; os nove workflows pós-merge aplicáveis passaram.
- O PR de sincronização do checkpoint pós-merge, [#310](https://github.com/KayzenRoot/gef-bootstrap/pull/310), continua aberto e falha no Repository Validation e nas quatro matrizes de regressão, com as mesmas oito asserções antigas de checkpoint. Ele não foi integrado; a atualização das expectativas dos testes requer escopo próprio, pois este Work Order proíbe alterar testes.
- Scorecard foi verificado em `main` no SHA `73ab68f3f33f894027fb7a04c2696b02b839060a`: [run 36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871), com scan e SARIF do repositório concluídos e publicação na API pública desativada.
- Estado final do piloto nesta reconciliação: `PILOT_FAILED_VALIDATION`, devido às regressões de checkpoint no PR #310; os checks pós-merge do pipeline em #309 permanecem verdes no SHA `44c6618…`.
- Regras administrativas: atualizadas uma vez e relidas pela API.
- Expansão para outros repositórios: **NÃO EXECUTADA**.
- Checkpoints históricos V1, inclusive 1088/1088: preservados.
- Linha `release/1.1`: fora do escopo do Work Order de plataforma #001; o forward-port ocorreu depois sob Work Order separado, PR #309.
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
| SonarQube Cloud | PASS | [Projeto](https://sonarcloud.io/project/overview?id=KayzenRoot_gef-bootstrap); [Quality Gate do PR #307](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=307) aprovado, 0 novos issues; captura mostra conta no plano Free | A documentação oficial permite análise ilimitada de projetos públicos e limita a organização a cinco membros ([planos](https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans)); o repositório é público. Elegibilidade inferida do plano e visibilidade, sem restrição de licença documentada. O trial Team oferecido não foi iniciado | Análise real concluída; primeira análise de main “Not Computed”; Sonar way e New Code “Previous version”; check informativo, não obrigatório |
| Socket Security | PASS | [Scan da base](https://socket.dev/dashboard/org/nexlabs/sbom/59dcf573-6288-4f6d-9341-487bb9d526e7); [relatório do PR](https://socket.dev/dashboard/org/nexlabs/sbom/5eedee81-4523-459c-9e89-7995b63ffc79) | Dashboard indicou `NexLabs Free`; nenhum plano pago ativado | Base: 29 dependências e 0 alertas; o PR não alterou dependências |
| StepSecurity app/telemetria | PASS | [Dashboard de Repository Validation](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782874) e [Free Security Pilot](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782940) | UI mostrou “Enterprise Free Trial, 13 days left”; nenhuma instalação ou ativação foi feita nesta execução. Community é gratuito para repositórios públicos com runners GitHub-hosted, sem cartão, segundo [pricing](https://www.stepsecurity.io/pricing); billing/transição da conta não foi confirmado | Aplicativo já abrangia todos os repositórios; este escopo não foi ampliado |
| Harden Runner | PASS | [Free Security Pilot](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782940): 4 destinos, 45 HTTPS, 5 Actions, 0 detecções. [CodeQL](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782838): 3 destinos, 40 HTTPS, 3 Actions, 0 detecções | Sem custo separado confirmado; monitorar o estado do trial | Somente `audit`, egress permitido. Um 404 de feature flags apareceu no log, sem impedir coleta. Uma amostra é insuficiente para baseline de anomalias |
| GitHub Dependency Review | PASS | [Run 36442782888](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782888) passou no PR real C1 | Action pública; custo de Actions não exposto | HIGH/CRITICAL; somente leitura, seguro para fork, sem comentário/escrita e sem regra de licença |
| OpenSSF Scorecard | PASS | [Run 36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871) em `main` SHA `73ab68f3f33f894027fb7a04c2696b02b839060a`; scan e upload SARIF no code scanning concluídos | Action pública; custo de Actions não disponível | Publicação na API pública Scorecard desativada; sinais de maturidade triados no adendo de estado corrente; sem requisito de branch |
| Codecov | PASS | [Projeto](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap); [run 36442783038](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442783038) e comentário do bot no [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307) | Painel da [organização Codecov](https://app.codecov.io/plan/gh/KayzenRoot) mostra Developer Free e 0/250 uploads em 30 dias; [pricing](https://about.codecov.io/pricing/) | C1 aceitou LCOV e bot confirmou linhas alteradas cobertas; relatório agregado antigo inclui 8.030 de 8.231 linhas em `tests/`, então não há threshold de cobertura de produto |
| Dependabot | PASS | [Configuração](https://github.com/KayzenRoot/gef-bootstrap/network/updates) | Serviço GitHub; custo faturado não disponível | Alertas, security updates e version updates ativos; nenhuma duplicação com Renovate |
| CodeRabbit | BLOCKED | [Reviews](https://github.com/KayzenRoot/gef-bootstrap/pull/307/reviews): não gerou comentários acionáveis no C1; a revisão não é gate | A conta mostra trial Advanced ativo, com 14 dias restantes na captura atual. O usuário autorizou cancelar, mas a política da interface exige o clique manual do proprietário; ainda não há evidência de cancelamento concluído. | Opcional e não obrigatório; não habilitar cobrança por uso nem plano pago |
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
| Codecov | PASS | Upload de LCOV funcionou e o painel mostra Developer Free, 0/250 uploads em 30 dias ([conta](https://app.codecov.io/plan/gh/KayzenRoot), [pricing](https://about.codecov.io/pricing/)). |
| CodeRabbit | BLOCKED | A conta ainda mostra o trial Advanced ativo e o botão “Cancel subscription”. O usuário autorizou o cancelamento, mas a etapa financeira final precisa ser feita pelo proprietário. A tela informa que o cancelamento leva a Free em 12 de outubro de 2026 e retém histórico/configurações; até o clique e confirmação, a continuidade Free não está concluída. A política pública oferece revisão Free para repositórios públicos ([pricing](https://www.coderabbit.ai/pricing)), mas isso não substitui a confirmação da conta. |
| SonarQube Cloud | PASS | A captura da organização mostra o plano Free; [a política oficial](https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans) permite análise ilimitada de projetos públicos e limita a organização a cinco membros. `gef-bootstrap` é público; elegibilidade inferida desses critérios, sem restrição de licença documentada. O trial Team oferecido não foi iniciado. |
| StepSecurity | BLOCKED | Painel mostrou trial Enterprise ativo. Community é gratuito para repositórios públicos com runners GitHub-hosted ([pricing](https://www.stepsecurity.io/pricing)), mas o downgrade da conta não foi verificado; confirmar antes do fim do trial. |
| Greptile | BLOCKED | O portal informa que o serviço termina após o trial. Starter limita-se a 1 desenvolvedor ativo e 50 créditos ([pricing](https://www.greptile.com/pricing)); a conta atual é uma organização com múltiplos colaboradores e quatro repos. Migração sem impacto não verificada; o piloto não alterou billing. |

Nenhuma assinatura paga, forma de pagamento, crédito ou extensão de trial foi ativada por este piloto. Os checks essenciais não dependem de Sonar, StepSecurity, Greptile ou CodeRabbit como contexts obrigatórios. O pipeline GitHub continua independente, mas a continuidade gratuita de todos os apps opcionais segue **BLOCKED** até confirmar StepSecurity/Greptile e concluir a ação de cancelamento do CodeRabbit.

## Workflows introduzidos ou ajustados

1. `dependency-review.yml`: revisa alterações de dependências em pull requests para `main`; falha em HIGH e CRITICAL; usa `pull_request`, permissões `contents: read`, não publica comentário e não impõe licenças sem política aceita.
2. `scorecard.yml`: auditoria semanal às segundas-feiras e execução manual via `workflow_dispatch`; a execução manual pode selecionar uma branch, mas o arquivo do workflow deve existir na branch padrão; Action fixada por SHA; `publish_results: false`; SARIF limitado ao mecanismo de code scanning do repositório. O evento `push` de C4 foi removido após o Action rejeitar execução em branch de PR; `pull_request` não é usado. O run de `main` 36485873871 concluiu com sucesso.
3. Harden Runner v2.21.1 foi fixado em `e14015d583714f6e62063499dc959a02595150a1`, explicitamente `egress-policy: audit`, nos jobs Linux relevantes de validação, segurança, CodeQL, Codecov e Scorecard. Não há bloqueio de egress nem endpoint privilegiado.
4. `repository-validation.yml` usa `npm run validate`, que combina o mesmo `tsc -b` usado em `typecheck` com a suíte de testes; o comando anterior executava `tsc -b` uma segunda vez via `npm test`.

As ações Dependency Review v5.0.0 (`a1d282b36b6f3519aa1f3fc636f609c47dddb294`) e Scorecard v2.4.4 (`2d1146689b8cda280b9bc96326124645441f03bc`) foram verificadas nas fontes oficiais e fixadas por commit. Actions já existentes continuam imutáveis.

## Tempo, custo e cobertura

Na base, os quatro workflows principais terminaram SUCCESS: Repository Validation 29 s, Pipeline Integrity 12 s, Free Security Pilot 20 s e CodeQL 131 s. A API não indicou fila mensurável; execução serial agregada observada: 192 segundos de runner; tempo de parede concorrente observado: 131 segundos. Isso é uma amostra, não uma média histórica nem um custo faturado. Não havia telemetria suficiente para frequência de falha, minutos mensais, custos monetários, cache hit rate ou tempos por suíte.

Em execução local, `npm ci` terminou em 17 s com 0 vulnerabilidades. Medição sequencial única do fluxo antigo: `npm run typecheck` 1,14 s e `npm test` 7,84 s (total 8,98 s). O fluxo novo `npm run validate` levou 8,50 s; ambos passaram os mesmos 1.153 testes e compilaram com `tsc -b`. O delta observado foi 0,48 s nesta amostra e pode ser ruído; nenhuma economia percentual ou faturada foi estimada. `npm audit --audit-level=high` terminou com 0 vulnerabilidades.

As quatro matrizes M41–M63 rodaram porque seus filtros incluem `.engineering/**`, que coincidiu com Work Order/Context Lock/Evidence deste piloto. Os tempos de jobs foram: M41–M47 62 s, M48–M54 64 s, M55–M61 102 s e M62–M63 68 s (296 s de runner no total; 28–73 s de parede, em paralelo). Evidências: [M41–M47](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782957), [M48–M54](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782793), [M55–M61](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782834), [M62–M63](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782745). Os filtros foram preservados porque ainda não há mapeamento comprovado de quais artefatos de governança podem ser excluídos sem perder validação relevante.

O Codecov recebeu LCOV em `3c4455a080055fb65fee7d7021b72c3d40c5ae52`: `tests/` domina o conjunto agregado. Não foi configurado threshold. CodeQL e Codecov mantêm seus filtros e não se tornam checks obrigatórios globais.

## Manutenção e recuperação

1. Leia este MASTER, o Work Order e o Context Lock antes de retomar. Compare `main` e os heads dos PRs; qualquer mudança de SHA invalida evidência de CI e revisão anterior.
2. PRs #307 e #308 estão integrados; PR #309 foi forward-port separado para `release/1.1`. Consulte os SHAs e checks exatos acima antes de usar qualquer evidência.
3. Corrija vulnerabilidades confirmadas; trate alertas incertos com triagem documentada. Não use exceção para esconder resultado nem mude regras da main sem Work Order e backup.
4. Se Harden Runner apontar tráfego inesperado, mantenha modo de auditoria, valide domínio, processo e job, documente justificativa e só proponha política de rede em outro escopo.
5. Se Dependency Review falhar, confirme o delta de dependências e a origem no advisory database; não bloqueie histórico preexistente por esta execução.
6. Se CodeQL/Codecov não rodarem por filtros, mantenha `NOT_VERIFIED` para aquele SHA, sem tornar o check obrigatório.
7. Não use Codex review nem auto-merge. A auditoria exata do proprietário KayzenRoot e a decisão de merge são gates separados conforme ADR-0006; a auditoria não é independente.
8. Não promova o checkpoint de manutenção nem edite o checkpoint histórico da V1 antes da aceitação independente e do merge permitido.

## Decisão de promoção

Este MASTER é um registro de reconstrução, não autorização de rollout. O piloto só pode ser considerado completo quando os gates pendentes estiverem vinculados ao head exato e a auditoria do proprietário prevista no ADR-0006 tiver sido registrada. Essa auditoria não é independente. A aplicação a qualquer outro repositório requer nova aprovação específica e preflight por repositório.

## Adendo de continuidade e operação best effort — 2026-09-28

As capturas de billing fornecidas pelo proprietário confirmam Codecov Developer Free (0/250 uploads no período mostrado), Socket Free e a organização SonarQube Cloud no plano Free. A documentação Sonar permite projetos públicos ilimitados e limita a organização a cinco membros; como a organização aparece no Free e o repositório é público, a elegibilidade é inferida desses critérios, sem restrição de licença documentada. O trial Team oferecido não foi iniciado. CodeRabbit continuava no trial Advanced na última leitura, com 14 dias restantes e botão “Cancel subscription”; o usuário autorizou o cancelamento, mas a ação final do proprietário ainda não foi concluída. Até haver confirmação visual do downgrade agendado, a continuidade CodeRabbit é `BLOCKED`. A política oficial oferece revisão gratuita permanente para repositórios públicos ([pricing](https://www.coderabbit.ai/pricing)); `Review paused` no PR #307 impede contar revisão naquele SHA. Billing por uso permanece desligado. Greptile encerra após o trial e seu Starter Free (1 desenvolvedor ativo, 50 créditos/mês) não foi comprovado para a organização. StepSecurity Community é publicado como gratuito para repositórios públicos, mas o downgrade desta conta a partir do trial Enterprise não foi confirmado. Greptile e StepSecurity ficam `BLOCKED / OPTIONAL` e não são checks exigidos pela ruleset.

Os seis passos `step-security/harden-runner` permanecem em `egress-policy: audit` e agora usam `continue-on-error: true`. O Harden Runner fornece telemetria best effort e uma indisponibilidade/entitlement do StepSecurity não pode interromper Repository Validation, Trivy, Gitleaks, CodeQL ou cobertura. Nenhum pagamento, forma de pagamento, crédito ou extensão de trial foi habilitado.

O gate de merge do PR #307 usou a auditoria exata do proprietário conforme ADR-0006; esse registro é owner-operated e **não é revisão independente**. PR #310 não foi integrado porque suas regressões permanecem falhando. Nenhum rollout além do repositório piloto está autorizado por este Work Order.

## Reconciliação de estado — 2026-09-28

- `main` está em `73ab68f3f33f894027fb7a04c2696b02b839060a`; PRs #307 e #308 foram integrados. A ruleset `23566111` foi relida e preserva os quatro contexts obrigatórios, PR obrigatório, resolução de conversas, bloqueio de exclusão/force-push e nenhum bypass.
- PR #309 integrou a manutenção do pipeline em `release/1.1` no SHA `44c6618ece1593365fb6c7f559d13c7166e7df26`; nove checks pós-merge passaram. Evidência: [bundle do Work Order](https://github.com/KayzenRoot/gef-bootstrap/blob/release/1.1/.engineering/evidence/GBS-V11-MAINT-PIPELINE-001-EVIDENCE.md).
- O PR #310 tenta registrar esse pós-merge no overlay do checkpoint V1.1, mas está **BLOCKED**: [Repository Validation](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36498559315) e as quatro matrizes de regressão repetiram as mesmas oito falhas porque testes congelados ainda esperam o `nextLegalAction` anterior. Não alterei os testes, pois o Work Order de manutenção proíbe mudanças em testes. Não integrar até um Work Order admitir a atualização dessas expectativas e os checks voltarem a passar.
- Scorecard no `main` passou no run 36485873871, ligado ao SHA 73ab; a publicação para API pública ficou desligada. Os findings HIGH de BranchProtectionID, CodeReviewID e MaintainedID são sinais de governança/maturidade: falta reviewer independente autorizado e o repo ainda tinha menos de 90 dias.
- CodeRabbit permanece no trial Advanced. A conta exibe “Cancel subscription” e informa downgrade para Free em 12 de outubro de 2026 se cancelado; o usuário autorizou, mas o clique precisa ser feito manualmente pelo proprietário. Greptile e StepSecurity não têm continuidade Free comprovada para a conta, ficam opcionais e não bloqueiam os checks GitHub nativos.
- Resultado do Work Order conforme a STOP CONDITION: `PILOT_FAILED_VALIDATION`, até resolver as oito falhas do PR #310. O pipeline de #309 segue verde no SHA pós-merge, mas a sincronização canônica do checkpoint não foi concluída. Rollout global não executado.
