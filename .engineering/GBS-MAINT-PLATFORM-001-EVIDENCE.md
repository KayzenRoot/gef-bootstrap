# Evidence Bundle — GBS-MAINT-PLATFORM-001

Data: 2026-09-28. Repositório `KayzenRoot/gef-bootstrap`. [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307) integrou a proposta inicial em `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`; [PR #308](https://github.com/KayzenRoot/gef-bootstrap/pull/308) integrou em `main` `73ab68f3f33f894027fb7a04c2696b02b839060a`. O primeiro candidato verificado foi `14769a9dc01411b71039ac4beb12a3014a0350bc`; seus links abaixo são históricos e não substituem os checks do head atual. Consulte [commits](https://github.com/KayzenRoot/gef-bootstrap/pull/307/commits) e [checks do PR](https://github.com/KayzenRoot/gef-bootstrap/pull/307/checks) antes de qualquer decisão. Evidência de CI e revisão nunca é transferida entre SHAs.

## Identidade, autoridade e limite

- Identidade verificada por GitHub connector e Chrome: KayzenRoot, ID `114633702`; permissão de administração no repositório.
- GitHub CLI local: sem sessão autenticada (`gh auth status`); não foi usado como prova de autorização.
- Base travada: `dfe14590521aead09ab0d8360fefbaea3e230aff`, tree `9dd4d05aef418a215ea12b6d9a65b8d1703ebab7`.
- Regras e hierarquia: `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md`, `.engineering/CHECKPOINT.md` e `.engineering/CHECKPOINT.json` lidos na admissão; fingerprints estão no [Context Lock](context-locks/GBS-MAINT-PLATFORM-001.md).
- Checkout de auditoria: `C:\Users\csn19\AppData\Local\Temp\codex-gef-bootstrap-main-audit`; checkout V1.1 `D:\Projects\gef` não foi alterado.
- Sem segredos, tokens ou conteúdo de cookies copiados para o repositório, PR ou relatório. Nenhuma compra, assinatura, cartão ou crédito foi iniciado.
- O Work Order do usuário autorizou a alteração da ruleset antes de este Work Order local ser materializado; esta sequência foi registrada no Context Lock.

## Ruleset e checks da base

Ruleset `Main Branch Protection`, ID `23566111`, somente `main`. Estado lido novamente depois da mudança em [Settings → Rules](https://github.com/KayzenRoot/gef-bootstrap/settings/rules/23566111).

Checks obrigatórios com SUCCESS no SHA base:

- [Repository validation — run 36429957262](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957262) — 29 s.
- [Pipeline integrity — run 36429957306](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957306) — 12 s.
- [Free Security Pilot, Trivy e Gitleaks — run 36429957225](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957225) — 20 s.
- [Security CodeQL — run 36429957513](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36429957513) — 131 s.

Após a atualização, a ruleset lista os quatro contextos acima. PR obrigatório e threads resolvidas preservados; aprovações exigidas = 0; exclusão e force push continuam bloqueados; `bypass_actors` vazio; nenhum bypass inesperado. O backup pré-alteração está fora do repositório em `%TEMP%\gef-bootstrap-ruleset-23566111-before-2026-09-28.json`, SHA-256 `5D855B297F71C59F9FBA6F3FCD829E8ACD0229D8FDDBE9C619AFFEC8994DA0B2`.

## Estado das integrações

| Componente | Status | Evidência auditada | Custo e permissão |
| --- | --- | --- | --- |
| SonarQube Cloud | PASS | Projeto [KayzenRoot_gef-bootstrap](https://sonarcloud.io/project/overview?id=KayzenRoot_gef-bootstrap); [análise do PR #307](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=307) passou com 0 novos issues. A captura do painel da organização mostra o plano Free. | O plano Free permite análise de projetos públicos e limita organizações a cinco membros; [documentação de planos](https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans). A organização aparece no Free e o repositório é público. A elegibilidade é inferida desses critérios; a documentação não enuncia restrição pelo campo de licença `UNLICENSED`. A oferta de Team trial não foi aceita. A primeira análise de main ficou “Not Computed”; Sonar way e New Code “Previous version”. |
| Socket Security | PASS | [Scan da base](https://socket.dev/dashboard/org/nexlabs/sbom/59dcf573-6288-4f6d-9341-487bb9d526e7), SHA `dfe14590521aead09ab0d8360fefbaea3e230aff`; 29 dependências, 0 alertas. [Relatório do PR](https://socket.dev/dashboard/org/nexlabs/sbom/5eedee81-4523-459c-9e89-7995b63ffc79); o PR não adicionou dependências. | UI identificou `NexLabs Free`; app já existia. Não foi criada varredura duplicada. |
| StepSecurity Actions Security | PASS | O dashboard do [run Repository Validation](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782874) e do [Free Security Pilot](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782940) exibiu telemetria do PR #307. | Escopo preexistente era todos os repositórios; não foi alterado. A página mostrou trial Enterprise ativo; esta execução não instalou app, iniciou trial ou fez compra. Preço atual lista Community como gratuito para repositórios públicos em runners GitHub-hosted e sem cartão ([pricing](https://www.stepsecurity.io/pricing)); plano/billing de transição da conta não foi confirmado, portanto a continuidade após o trial está BLOCKED. |
| Harden Runner | PASS | v2.21.1 por SHA e `egress-policy: audit`. No run [Free Security Pilot](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782940), painel registrou 4 destinos, 45 eventos HTTPS, 5 Actions e 0 detecções; destinos `github.com`, `check.trivy.dev`, `release-assets.githubusercontent.com` e `raw.githubusercontent.com` ficaram permitidos. No [CodeQL](https://app.stepsecurity.io/github/KayzenRoot/gef-bootstrap/actions/runs/36442782838), 3 destinos, 40 eventos, 3 Actions e 0 detecções; `github.com`, `api.github.com` e `release-assets.githubusercontent.com` permitidos. | Sem egress bloqueado, token de serviço ou política remota. Log também registrou HTTP 404 ao consultar feature flags, mas a Action inicializou e concluiu com telemetria observável; manter audit e acompanhar. O baseline automático ainda não tem amostra suficiente para anomalias. |
| Dependency Review | PASS | [Run 36442782888](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782888) passou em `pull_request` no candidato C1 `14769a9dc01411b71039ac4beb12a3014a0350bc`; não houve delta de dependências. | `contents: read`; severidade alta/crítica; licença desligada até política definida; nenhuma permissão de escrita para comentários. |
| OpenSSF Scorecard | PASS | [Run 36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871) no `main` SHA `73ab68f3f33f894027fb7a04c2696b02b839060a`; scan e SARIF do repositório concluídos. | `publish_results: false`; publicação na API pública desativada; findings de maturidade triados no adendo corrente. |
| Codecov | PASS | [Projeto](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap); [run 36442783038](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442783038) completou upload de LCOV em C1; comentário do Codecov confirmou cobertura das linhas modificadas/cobertas no [PR #307](https://github.com/KayzenRoot/gef-bootstrap/pull/307). | Painel da [organização Codecov](https://app.codecov.io/plan/gh/KayzenRoot) mostra Developer plan Free e 0/250 uploads nos últimos 30 dias. Sem threshold; [pricing oficial](https://about.codecov.io/pricing/). |
| Dependabot | PASS | [Configuração de atualizações](https://github.com/KayzenRoot/gef-bootstrap/network/updates); Dependency Graph, alertas e security updates estavam ativos. | Dependabot preservado; Renovate não habilitado. |
| CodeRabbit | BLOCKED | No C1, não gerou comentários acionáveis; a revisão não é requisito da ruleset. | A conta mostra trial Advanced ativo, 14 dias restantes e o controle “Cancel subscription”; o usuário autorizou cancelar, mas a confirmação final do proprietário ainda está pendente. Continuidade Free não está comprovada enquanto não houver confirmação do cancelamento. Nenhum add-on pago foi habilitado. |
| Greptile | BLOCKED | O portal da organização informou que o serviço será encerrado ao fim do trial. Nenhuma revisão no head final foi confirmada; [reviews do PR](https://github.com/KayzenRoot/gef-bootstrap/pull/307/reviews). | O piloto não ativou plano pago nem alterou billing. O Starter gratuito publicado limita-se a 1 desenvolvedor ativo e 50 créditos/mês ([pricing](https://www.greptile.com/pricing)); a organização NexLabs apresenta múltiplos colaboradores e quatro repositórios, então migração sem interrupção ou impacto aos demais projetos não foi comprovada. O responsável da conta precisa decidir por uma migração suportada ao Free ou aceitar o encerramento. |

As três GitHub Apps SonarQubeCloud (`165757337`), Socket (`165807889`) e StepSecurity (`165807767`) já tinham `All repositories`. Não foi expandido esse escopo nesta tarefa. A configuração impede a falsa afirmação de que os apps estão limitados a este piloto; a redução futura requer projeto administrativo de conta separado, fora deste Work Order.

## Continuidade em planos gratuitos — condição adicionada pelo usuário

O usuário exigiu que o fluxo permaneça em funcionamento no modo gratuito depois de todo trial. “Existe um plano Free” não prova que a conta ou a organização atual fará downgrade, atende os limites ou preservará os recursos usados. A verificação é:

| Aplicativo/serviço | Status de continuidade gratuita | Evidência e ação necessária |
| --- | --- | --- |
| GitHub Actions e verificações nativas | PASS | Os workflows mantêm execução por eventos do GitHub e não usam assinatura externa. O custo/minutos faturados da conta não estavam disponíveis; o piloto não criou cobrança nem ativou recurso pago. |
| Socket Security | PASS | O dashboard mostrou `NexLabs Free`; a página oficial publica plano gratuito ([pricing](https://socket.dev/pricing)). Os scans atuais não exigem ação de billing observada. |
| Codecov | PASS | Upload LCOV foi aceito e o painel de plano mostra Developer Free, 0/250 uploads em 30 dias ([conta](https://app.codecov.io/plan/gh/KayzenRoot), [pricing](https://about.codecov.io/pricing/)). A conta não foi alterada. |
| CodeRabbit | BLOCKED | O trial Advanced ainda aparece ativo. A página informa que clicar em “Cancel subscription” agenda downgrade para Free em 12 de outubro de 2026 e retém histórico/configuração; o usuário autorizou, mas o clique do proprietário ainda não foi feito. A política oficial oferece Free para repositórios públicos ([pricing](https://www.coderabbit.ai/pricing)), mas isso não comprova a transição da conta. |
| SonarQube Cloud | PASS | A captura da organização mostra o plano Free. A documentação oficial permite análise ilimitada de projetos públicos e limita a organização a cinco membros ([subscription plans](https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans)); `gef-bootstrap` é público. A inferência de elegibilidade usa o plano observado e a visibilidade pública, pois a documentação não lista restrição baseada em `UNLICENSED`. O trial Team oferecido não foi iniciado. O check de Sonar é informativo e não obrigatório. |
| StepSecurity | BLOCKED | O painel mostrava trial Enterprise ativo. Community é publicado como gratuito para repositórios públicos em runners GitHub-hosted ([pricing](https://www.stepsecurity.io/pricing)), mas o downgrade da conta não foi verificado. O administrador deve confirmar a transição para Community antes do término; nenhum pagamento, extensão ou mudança de billing foi iniciado. |
| Greptile | BLOCKED | O portal da organização informa que o serviço será encerrado quando o trial terminar. Existe Starter gratuito, mas o limite publicado é 1 desenvolvedor ativo e 50 créditos/mês ([pricing](https://www.greptile.com/pricing)); a organização do trial possui múltiplos colaboradores e quatro repositórios. O plano Free não foi ativado e a migração não está comprovada. Nenhum plano pago ou alteração de billing foi iniciado pelo piloto. |

O pipeline GitHub do piloto não depende de CodeRabbit, Greptile nem dos Quality Gates externos como checks obrigatórios. CodeRabbit fica `BLOCKED` para continuidade gratuita até confirmação do cancelamento; `Review paused` não é validação de revisão. SonarQube Cloud está no plano Free para o projeto público. StepSecurity e Greptile continuam `BLOCKED/OPTIONAL`, sem poder de bloquear os checks exigidos. Nenhum trial é presumido como downgrade automático sem evidência da conta.

## Linha de base CI e validação local

- No SHA base, workflows obrigatórios e CodeQL completaram SUCCESS nos links listados. API observada: fila não mensurável; tempos 29, 12, 20 e 131 s; 192 s agregados de runner e 131 s de parede com execução concorrente. Não é medição de custo faturado ou média histórica.
- Execução local: `npm ci` completou em 17 s e reportou 0 vulnerabilidades.
- `npm run validate`: SUCCESS, 1.153 testes passaram, 0 falhas, 0 cancelados; execução Node registrou 6.275 ms na medição comparativa. O script compilou via `tsc -b` antes dos testes.
- `npm audit --audit-level=high`: SUCCESS, 0 vulnerabilidades.
- Medição local sequencial (uma amostra, mesma sessão e checkout): fluxo anterior `npm run typecheck` + `npm test` levou 1,14 s + 7,84 s = 8,98 s; fluxo novo `npm run validate` levou 8,50 s. Ambos passaram e executaram os mesmos 1.153 testes; o delta observado foi 0,48 s nesta única amostra, sem alegação de economia estável ou faturada.
- No candidato C1, as quatro matrizes M41–M63 também rodaram porque seus filtros incluem `.engineering/**`, que coincidiu com os documentos deste Work Order. As execuções ficaram entre 28 s e 73 s de parede, somando 296 s de jobs/runner: [M41–M47](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782957) 62 s de runner; [M48–M54](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782793) 64 s; [M55–M61](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782834) 102 s; [M62–M63](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782745) 68 s. Eles correram em paralelo; não houve custo faturado visível.
- Não estreitei `.engineering/**`: esses filtros podem estar protegendo Work Orders, gates e evidências das próprias áreas. A redução requer mapear os artefatos de governança de cada módulo e validar a cobertura antes de alterar quatro matrizes de regressão. Isto fica como oportunidade mensurável, não como economia já realizada.
- Codecov/CodeQL continuam condicionais por filtros; não entram como obrigatórios para todos os PRs.
- Checks adicionais C1: [Repository Validation](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782874), [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442783001), [Free Security Pilot](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782940), [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442782838), [Codecov](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36442783038) e Dependency Review acima passaram. Estes resultados são C1 e não valem para SHA posterior.
- CodeRabbit não gerou achados acionáveis; Greptile apontou placeholder desatualizado neste MASTER. A correção está incluída neste commit; reconsultar revisões no [head atual](https://github.com/KayzenRoot/gef-bootstrap/pull/307/reviews).

## Alterações e limites de segurança

- Workflows adicionados: `.github/workflows/dependency-review.yml` e `.github/workflows/scorecard.yml`.
- Workflows ajustados: `repository-validation.yml`, `free-security-pilot.yml`, `security-codeql.yml`, `coverage-codecov.yml` para modo audit do Harden Runner; Repository Validation também elimina uma compilação duplicada.
- Action Dependency Review v5.0.0: `a1d282b36b6f3519aa1f3fc636f609c47dddb294`.
- Action OSSF Scorecard v2.4.4: `2d1146689b8cda280b9bc96326124645441f03bc`.
- Harden Runner v2.21.1: `e14015d583714f6e62063499dc959a02595150a1`.
- Upload SARIF reaproveita a referência por SHA já existente no CodeQL.
- Sem `pull_request_target`, `write-all`, secrets de provedor, credenciais de usuário ou comentário automatizado pelo Dependency Review.
- Nenhum SBOM ou artefato de procedência foi fabricado: não houve processo de release/distribuição dentro desta alteração.
- Nenhum checkpoint histórico da V1 foi editado. Uma proposta de checkpoint de manutenção só será promovida após auditoria e merge permitido.

## Próxima leitura obrigatória

1. PRs #307 e #308 foram integrados em `main`; PR #309 foi um forward-port separado para `release/1.1`. Use apenas checks ligados ao SHA que está sendo auditado.
2. Scorecard foi verificado em `main` no run [36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871); seus findings atuais são sinais de maturidade e não são checks obrigatórios.
3. Inspecionar a telemetria de Harden Runner em mais jobs, acompanhar o erro não bloqueante de feature flags e acumular baseline antes de qualquer política de bloqueio.
4. Confirmar plano/faturamento StepSecurity, SonarQube e Greptile antes do fim do trial; não há pagamento, extensão ou forma de pagamento cadastrada pelo piloto.
5. Fazer a auditoria exata do proprietário `KayzenRoot` no SHA final conforme ADR-0006, registrar como `OWNER_APPROVED`, `CORRECTION_REQUIRED` ou `BLOCKED`, e tratar comentários externos acionáveis. Não chamar a auditoria de independente. Greptile fica opcional se a migração gratuita afetar outros colaboradores/projetos.
6. Revalidar os quatro checks obrigatórios e os componentes aplicáveis no head exato antes de qualquer decisão de merge.
7. Não executar rollout global.

## Adendo de continuidade gratuita e isolamento — 2026-09-28

- O usuário forneceu capturas atuais dos painéis de CodeRabbit, SonarQube Cloud, Socket, Greptile e Codecov. Elas confirmam Codecov Developer Free com 0/250 uploads no período mostrado, Socket Free, Greptile ainda em trial e SonarQube Cloud na página da organização com plano Free. A oferta de trial do Team no Sonar não foi aceita.
- CodeRabbit ainda está no trial Advanced. O usuário autorizou o cancelamento, mas a página continua mostrando “Cancel subscription”, então a ação do proprietário não foi concluída. Até aparecer o downgrade agendado para Free, classificar continuidade como `BLOCKED`. `Review paused` não conta como revisão; billing por uso permanece desligado.
- O portal Greptile informa encerramento ao fim do trial; o painel mostrado não tinha método de pagamento. O plano Starter publicado limita-se a um desenvolvedor ativo e 50 créditos/mês, não confirmado como compatível com a organização. Classificar como `BLOCKED / OPTIONAL`; a ausência do serviço não bloqueia CI.
- O painel SonarQube Cloud mostra o plano Free. A documentação oficial permite projetos públicos ilimitados e limita a organização a cinco membros; como a organização aparece no Free e o repositório é público, a elegibilidade é inferida desses critérios. A documentação não lista condição de licença do código. O trial Team oferecido na página não foi iniciado. Sonar permanece informativo e não obrigatório.
- StepSecurity ainda tinha continuidade pós-trial não verificada. Para que o pipeline crítico não dependa desse serviço, os seis usos de Harden Runner nos workflows configurados permanecem em `egress-policy: audit` e agora usam `continue-on-error: true`. Telemetria é best effort; os checks próprios de Repository Validation, Trivy, Gitleaks e CodeQL continuam executando independentemente.
- Nenhum cartão, assinatura, crédito, extensão de trial ou cobrança foi ativado. StepSecurity e Greptile continuam opcionais até a continuidade gratuita da conta ser confirmada; os controles de segurança obrigatórios são os checks GitHub nativos definidos pela ruleset.
- O registro de auditoria deste PR seguirá ADR-0006: auditoria do proprietário `KayzenRoot`, vinculada ao head exato e explicitamente **não independente**.

## Reconciliação de estado pós-merge — 2026-09-28

| Frente | Status | Evidência e decisão |
| --- | --- | --- |
| Integração em `main` | PASS | PR #307 merge `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`; PR #308 merge `73ab68f3f33f894027fb7a04c2696b02b839060a`. A ruleset 23566111 foi relida no estado corrente e preserva os quatro contexts requeridos. |
| OpenSSF Scorecard | PASS | [Run 36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871) passou em `main` SHA `73ab68f3f33f894027fb7a04c2696b02b839060a`; o scan e o SARIF do repositório foram concluídos e a publicação pública permaneceu desligada. Os findings HIGH de BranchProtectionID, CodeReviewID e MaintainedID são sinais de maturidade/governança, não novas vulnerabilidades de produto. |
| Forward-port para V1.1 | PASS | PR #309 foi squash-merged em `release/1.1` no SHA `44c6618ece1593365fb6c7f559d13c7166e7df26`; os nove checks pós-merge aplicáveis passaram. O delta de checkpoint/evidência pós-merge está proposto separadamente em [PR #310](https://github.com/KayzenRoot/gef-bootstrap/pull/310) e permanece bloqueado pelas falhas listadas abaixo. |
| PR #310 — sincronização do checkpoint | FAIL | O candidato `8c9fefae8adf39a5944f52599a9dc4b4b786ae65` falhou em oito asserções repetidas nas quatro matrizes de regressão: [M41–M47](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36498559300), [M48–M54](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36498559351), [M55–M61](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36498559376), [M62–M63](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36498559391). As asserções congeladas esperam `CREATE_WO_009_IMPLEMENTATION_BRANCH_FROM_EXACT_ADMISSION_MERGE`; o checkpoint atualizado corretamente aponta para `REFRESH_WO_009_CONTEXT_LOCK_FOR_RELEASE_1_1_44C6618`. Este Work Order proíbe editar testes; PR #310 não foi integrado. É necessário admitir o ajuste das expectativas em Work Order compatível e revalidar o candidato.
| Continuidade CodeRabbit | BLOCKED | O trial Advanced permanece ativo na última leitura da conta. O usuário autorizou cancelar, mas o controle ainda aparece como “Cancel subscription”; a etapa precisa ser concluída pelo proprietário. Não classificar a continuidade como Free até confirmação visual do downgrade agendado. O serviço é opcional e não bloqueia CI. |
| Continuidade StepSecurity e Greptile | BLOCKED | Downgrade/eligibilidade Free não comprovados para a conta. Permanecem opcionais; GitHub Actions, Gitleaks, Trivy, Dependency Review, CodeQL e Pipeline Integrity não dependem desses serviços. |

O mesmo conjunto de oito asserções também fez falhar [Repository Validation no PR #310](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36498559315); o log registrou 1.575 testes aprovados, 8 falhos e 4 ignorados. Isso confirma que não se trata somente de uma matriz multiplataforma.

Resultado da reconciliação: `PILOT_FAILED_VALIDATION` até que as falhas de teste do PR #310 sejam resolvidas por escopo admitido. PR #309 e os checks pós-merge do forward-port seguem verdes. A revisão independente antes de qualquer rollout global continua pendente; rollout não executado.
