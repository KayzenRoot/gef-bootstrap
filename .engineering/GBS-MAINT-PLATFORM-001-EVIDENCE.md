# Evidence Bundle — GBS-MAINT-PLATFORM-001

Data: 2026-09-28. Repositório `KayzenRoot/gef-bootstrap`. A evidência de CI é SHA-específica; consulte o PR e a aba Checks para o commit corrente. Não reutilize resultados antigos depois de qualquer atualização do head.

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
| SonarQube Cloud | NOT_VERIFIED | Projeto [KayzenRoot_gef-bootstrap](https://sonarcloud.io/project/overview?id=KayzenRoot_gef-bootstrap); [background tasks](https://sonarcloud.io/project/background_tasks?id=KayzenRoot_gef-bootstrap). Main task `AaDobsCxLxZpGagB7Ymd` terminou SUCCESS; cinco tarefas PR também SUCCESS. | Importado como projeto público, sem token de CI. Plano faturado e elegibilidade da licença `UNLICENSED` não foram comprovados. Quality Gate main inicial “Not Computed”; Sonar way padrão e New Code “Previous version”. |
| Socket Security | PASS | [Scan da base](https://socket.dev/dashboard/org/nexlabs/sbom/59dcf573-6288-4f6d-9341-487bb9d526e7), SHA `dfe14590521aead09ab0d8360fefbaea3e230aff`; 29 dependências, 0 alertas. | UI identificou `NexLabs Free`; app já existia. Não foi criada varredura duplicada. |
| StepSecurity Actions Security | BLOCKED | App já estava instalada. A tela OAuth oficial, aberta no Chrome, pede apenas leitura do e-mail da conta; titular precisa aprovar manualmente. | Escopo de instalação preexistente era todos os repositórios; não foi alterado. O agente não aprovou OAuth. |
| Harden Runner | NOT_VERIFIED | Action v2.21.1 fixada por SHA e limitada a `egress-policy: audit` nos jobs Linux selecionados; telemetria do candidato depende do PR. | Nenhum bloqueio de egress, token de serviço ou política remota configurados. Custo da conta não exibido. |
| Dependency Review | NOT_VERIFIED | Workflow criado, aguardando execução no PR real. | `contents: read`; alta e crítica bloqueiam; licença desligada até política do projeto; sem comentário com permissão de escrita. |
| OpenSSF Scorecard | NOT_VERIFIED | Workflow semanal/manual criado, execução pendente. | `publish_results: false`; upload SARIF ao code scanning do repositório; sem publicação à API pública Scorecard. |
| Codecov | NOT_VERIFIED | [Projeto](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap); [run 36425475294](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36425475294) aceitou LCOV no SHA `3c4455a080055fb65fee7d7021b72c3d40c5ae52`. | 8.231 linhas agregadas: 8.030 `tests/`, 201 `packages/`; 97,86% não representa cobertura pura de fonte. Sem threshold. Plano/custo não comprovado. |
| Dependabot | PASS | [Configuração de atualizações](https://github.com/KayzenRoot/gef-bootstrap/network/updates); Dependency Graph, alertas e security updates estavam ativos. | Dependabot preservado; Renovate não habilitado. |
| CodeRabbit / Greptile | NOT_VERIFIED | Resultado do PR corrente deve ser reconsultado no link de checks/reviews adicionado após sua publicação. | Plano e limites comerciais não verificados. Nenhum novo revisor foi instalado. |

As três GitHub Apps SonarQubeCloud (`165757337`), Socket (`165807889`) e StepSecurity (`165807767`) já tinham `All repositories`. Não foi expandido esse escopo nesta tarefa. A configuração impede a falsa afirmação de que os apps estão limitados a este piloto; a redução futura requer projeto administrativo de conta separado, fora deste Work Order.

## Linha de base CI e validação local

- No SHA base, workflows obrigatórios e CodeQL completaram SUCCESS nos links listados. API observada: fila não mensurável; tempos 29, 12, 20 e 131 s; 192 s agregados de runner e 131 s de parede com execução concorrente. Não é medição de custo faturado ou média histórica.
- Execução local: `npm ci` completou em 17 s e reportou 0 vulnerabilidades.
- `npm run validate`: SUCCESS, 1.153 testes passaram, 0 falhas, 0 cancelados; execução Node registrou 7.186 ms. O script compilou via `tsc -b` antes dos testes.
- `npm audit --audit-level=high`: SUCCESS, 0 vulnerabilidades.
- Justificativa da otimização: anteriormente o job chamava `npm run typecheck` (`tsc -b`) e depois `npm test`, que executava `npm run build` com o mesmo `tsc -b` antes da suíte. `npm run validate` mantém um `tsc -b` e os mesmos testes. Nenhuma economia percentual foi inferida sem comparação controlada.
- Codecov/CodeQL continuam condicionais por filtros; não entram como obrigatórios para todos os PRs.
- Check do novo candidato, revisões de bots e análise Dependency Review/Scorecard precisam ser lidos na aba Checks do PR depois da publicação. Estado: **PENDENTE**.

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

1. Substituir os campos “PENDENTE” após abrir o PR pelo URL real, head SHA e links exatos das novas execuções.
2. Confirmar Dependency Review no PR e analisar o status do Scorecard por execução manual/semanal.
3. Inspecionar logs do Harden Runner e conexões por job; deixar em auditoria se houver tráfego sem justificativa.
4. Obter autorização OAuth de titular na tela oficial se o painel StepSecurity continuar exigindo-a; não enviar estado, cookies ou códigos OAuth.
5. Obter análise independente atual do SHA final e tratar todo comentário acionável.
6. Reexecutar/ler os quatro checks obrigatórios no head exato antes de qualquer decisão de merge.
7. Não executar rollout global.
