# GBS-V113-PARALLEL-001 — Evidence Bundle

Data da atualização: 2026-10-10 (horário local). Work Order/Issue: [#432](https://github.com/KayzenRoot/gef-bootstrap/issues/432). PR: [#433](https://github.com/KayzenRoot/gef-bootstrap/pull/433).

## Estado e vínculo do candidato

- Base autorizada: `main@921493797728a43aadc9f7840c954ce7e3ebc416`.
- Branch: `hotfix/1.1.3-parallel-modules`; destino: `main`.
- Substantive candidate HEAD (código/testes): `4a29199a7f2c97497659aad9a3f39be619ad2c86`.
- Este registro é uma alteração somente de evidência feita depois do substantive HEAD. Seu commit documental não é autorreferenciado aqui; ele exige sua própria rodada de exact-head checks.
- O candidato 1.1.3 não foi publicado. Identidade/versão npm, dependências, workflows de release, tags e checkpoint canônico não foram alterados; manifests permanecem na versão 1.1.2.

## Correção e segurança

- F-01: a validação de raiz usa `git rev-parse --show-prefix`; prefixo vazio autoriza somente a raiz do repositório e prefixo não vazio rejeita chamadas em subdiretórios. Isso evita a comparação de caminhos com grafia/capitalização diferente no Windows.
- O guard de promoção mantém o repositório efetivo, manifest original e origem Git vinculados ao slug canônico `KayzenRoot/gef-bootstrap`; exige o checkpoint rastreado, limpo e igual ao blob/index/HEAD, a tupla canônica U12-01/WO-001 e o commit de merge `bd6d0e9884386d7ec8828ba3bd15de7777ebe362` como ancestral local.
- Foram preservadas as verificações fail-closed de identidade, checkpoint, index/worktree, filtros, HEAD estável e ancestralidade. Nenhuma asserção ou threshold foi enfraquecido.
- Reauditoria de segurança no substantive HEAD: F-01 **APPROVED** sob o modelo de confiança da identidade local `origin`; nenhum finding HIGH/CRITICAL aberto. Limitação residual MEDIUM: `origin` é configuração local e pode ser falsificada pelo operador do clone; ela não prova posse remota. A aprovação cobre a prevenção de cópia entre o projeto A canônico e um alvo B sob o contrato admitido.
- Não foi encontrada credencial nos dois arquivos alterados pelo scan local de padrões de segredo. Gitleaks hospedado passou no substantive HEAD.

## Arquivos do substantive diff

- `packages/cli/bin/parallel.mjs`: comparação portátil de raiz e extração dos caminhos de verificação de promoção e parsing para helpers menores, preservando a ordem e sem supressões de Sonar.
- `tests/gef-parallel-patch.test.mjs`: casos para origem SSH válida, remotes malformados, cwd aninhado e renderização in-process de `plan`, `prompt` e ação desconhecida. Os cenários adversariais anteriores de promoção/checkpoint, ancestralidade, cópia entre projetos, conflito e aliases Windows permanecem.
- `packages/cli/bin/parallel.mjs`: 56 linhas adicionadas / 28 removidas.
- `tests/gef-parallel-patch.test.mjs`: 74 linhas adicionadas / 2 removidas.

## Validação local no substantive HEAD

- `node --test tests/gef-parallel-patch.test.mjs`: **33/33 PASS**.
- `node --experimental-test-coverage --test tests/gef-parallel-patch.test.mjs`: **33/33 PASS**; `parallel.mjs`: 98.01% linhas, 92.02% branches no teste focado.
- `npm run build`: PASS.
- `npm run typecheck`: PASS.
- `npm audit --audit-level=high`: PASS, 0 vulnerabilidades.
- `git diff --check`: PASS.
- Scan local por padrões comuns de credenciais nos dois arquivos alterados: nenhuma correspondência. Gitleaks não está instalado localmente; o check hospedado pinned passou.
- `npm run validate` no linked worktree: **1690/1692**, portanto **não PASS** neste ambiente. As únicas duas falhas são limitações conhecidas de observação do linked worktree, fora do escopo permitido: `tests/v11-wo-002-cli.test.mjs:306` esperou `OBSERVED` e recebeu `UNKNOWN`; `tests/v11-wo-003-doctor-status-e2e.test.mjs:198` tenta abrir `.git/index`, mas `.git` é um arquivo ponteiro de linked worktree. Nenhum desses testes foi alterado.
- Clone normal limpo do substantive HEAD: `npm ci`, build, focused 33/33, typecheck, `npm run validate` **1692/1692 PASS** (exit 0), audit zero e `git diff --check` passaram. O smoke de pacote instalado/CLI também passou. O tarball local Windows teve SHA diferente por `autocrlf`; por isso, a prova cross-platform do artefato é a matriz hospedada do mesmo tarball do run 38104792261, que passou em Ubuntu, Windows e macOS.

## Checks hospedados no substantive HEAD

Todos os checks abaixo foram consultados para `4a29199a7f2c97497659aad9a3f39be619ad2c86`; nenhum resultado do HEAD anterior foi herdado. Todos estavam **PASS** na última consulta.

| Check | Resultado | Evidência |
|---|---|---|
| Repository validation | PASS | [run/job 114367885771](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792328/job/114367885771) |
| `validate` | PASS | [run/job 114367885444](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792315/job/114367885444) |
| Focused/regression Ubuntu, Windows, macOS | PASS | [matriz final focada/regressão](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792458) |
| Node coverage LCOV | PASS | [run/job 114367885265](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792220/job/114367885265) |
| Codecov patch | PASS, **95.60%**; meta 94.39% | [Codecov PR #433](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap/pull/433) |
| V1.1 release assurance — Ubuntu | PASS | [job 114367885482](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367885482) |
| V1.1 release assurance — Windows | PASS | [job 114367885570](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367885570) |
| V1.1 release assurance — macOS | PASS | [job 114367885533](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367885533) |
| Mesmo tarball V1.1 — Ubuntu, Windows, macOS | PASS | [Ubuntu](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367954865), [Windows](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367954851), [macOS](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367954862) |
| Upgrade/recovery — Ubuntu, Windows, macOS | PASS | [Ubuntu](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792287/job/114367885721), [Windows](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792287/job/114367885677), [macOS](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792287/job/114367885601) |
| Windows rights oracle | PASS | [run/job 114367885790](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792296/job/114367885790) |
| Analyze TypeScript | PASS | [run/job 114367885349](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792224/job/114367885349) |
| SonarCloud Code Analysis | PASS | [PR analysis](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=433) |
| Gitleaks | PASS | [run/job 114367885513](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792292/job/114367885513) |
| Trivy | PASS | [run/job 114367885864](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792292/job/114367885864) |
| Dependency Review | PASS | [run/job 114367885602](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792323/job/114367885602) |
| CodeQL / tracked alert evidence | PASS | [CodeQL run](https://github.com/KayzenRoot/gef-bootstrap/runs/114368078788), [evidence job](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367885543) |
| Pipeline Integrity | PASS | [run/job 114367885728](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792341/job/114367885728) |
| Socket Security | PASS | [Project Report](https://socket.dev/dashboard/org/nexlabs/sbom/6f0af02d-4d9a-4f4e-9194-425ead4f80b2), [PR Alerts](https://socket.dev) |
| Cumulative Sonar diagnostics / duplicate blocks | PASS | [diagnostics](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367885540), [duplicates](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/38104792261/job/114367885358) |
| CodeRabbit | PASS, review paused | [PR #433](https://github.com/KayzenRoot/gef-bootstrap/pull/433); não é aprovação independente |

## Sonar: histórico e estado atual

- O PASS histórico sem SHA continua **não vinculado e não probante** para este candidato.
- O finding histórico no `f65c0dacb0a0a0c7bcf0eefe7afcd9f319563aab` continua registrado como **FAILED**, Reliability C e Security B, conforme review [#6103264709](https://github.com/KayzenRoot/gef-bootstrap/pull/433#pullrequestreview-6103264709).
- No HEAD anterior `fc52edf19601bfcd750673bd2bca9fc1b412f88a`, Sonar passou com quatro new issues e zero aceitos; os dois S3776 CRITICALs estavam abertos.
- No substantive HEAD `4a29199a7f2c97497659aad9a3f39be619ad2c86`, Quality Gate passou. Consulta da API do Sonar no PR mostrou os S3776 CRITICALs **CLOSED** e duas issues abertas sem supressão/aceitação: S8786 MAJOR (regex com backtracking, caminho limitado a 180 caracteres, linha 43) e S6582 MINOR (optional chaining, linha 169). Não foram classificadas como findings de segurança HIGH/CRITICAL.

## Limites e decisão

- Code changes do substantive HEAD têm checks hospedados completos e verdes, incluindo Codecov 95.60% acima de 94.39% e release assurance Ubuntu/Windows/macOS.
- O corpo da PR e este bundle serão atualizados no commit documental; esse novo exact HEAD precisa executar e passar sua própria rodada de checks antes da reauditoria final.
- ADR-0011 permanece PROPOSED; auditoria do executor permanece NOT_INDEPENDENT.
- Checkpoint Delta permanece PROPOSED. Não houve merge, checkpoint promotion, tag, publicação npm ou GitHub Release.
- Estado: substantive implementation **READY FOR EXACT-HEAD REAUDIT**, sujeito aos checks do commit evidence-only e à auditoria owner final.
