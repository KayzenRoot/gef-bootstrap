# GBS-V113-SEC-001 — Work Order de planejamento para falha histórica do Gitleaks

**Estado:** PLANNING_ONLY / PLANNED_NOT_ADMITTED / NOT_IMPLEMENTATION_AUTHORITY

**Issue:** #439 — GBS-V113-SEC-001. **Parent:** #434 (GBS-V113-GOV-001). **Programa:** #437, comentário #6128927054. **Sucessora de release:** #435.

**Base imutável desta proposta:** main@bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1. Revalidar e rebind formalmente se main mudar.

**Branch desta proposta:** codex/gbs-v113-sec-001-planning. **Risco:** ELEVATED; elevar para HIGH_ASSURANCE se uma credencial real/incerta ou a política exigir.
**Artefatos autorizados nesta fase:** este Work Order, Context Lock proposto, Evidence Bundle de planejamento e Checkpoint Delta PROPOSED. Nenhum deles admite implementação.

## Autoridade e fontes fixadas

- Issue #439 completa: https://github.com/KayzenRoot/gef-bootstrap/issues/439.
- Programa de entrega rápida #437, comentário #6128927054; triagem aplicável de #434, comentário #6128530795; demais evidências de #434 estão indexadas no Evidence Bundle. Alegações antigas de classificação, alcance ou benignidade não são prova.
- Run agendado #38253721487: Gitleaks job #114826269082 FAILURE; Trivy job #114826268794 SUCCESS. Esta observação vem de metadados do provedor; nenhum log bruto nem conteúdo de Match foi consultado para este pacote.
- Base e blobs normativos registrados no Context Lock. Autoridade: .engineering/SOURCE-HIERARCHY.md, checkpoint canônico vigente, ADR-0008, Security, Scope, Architecture, Requirements, DoD, Test/Benchmark e Deployment.
- Scanner/workflow fixado na base: Gitleaks 8.30.1, binário SHA-256 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb; política upstream 83d9cd684c87d95d656c1458ef04895a7f1cbd8e; configuração SHA-256 e163e53b9e7e8a8511e77271e2b323ed057759542a6d988258afe3a1fa329caf. O comando agendado preserva --all e --diff-merges=separate e redige a saída com --redact=100.

## Objetivo

Preparar uma execução futura, governada e reproduzível para resolver a falha histórica do gate agendado do Gitleaks sem reduzir cobertura, ocultar exposição real, reescrever histórico, apagar refs ou contornar regrasets. Esta proposta documenta pré-condições, evidências e critérios para auditoria do Owner. Ela não muda scanner, política, código, testes, workflow, checkpoint ou release.

## Estado conhecido e limites da prova

A triagem redigida reporta 21 coordenadas em 16 commits e 8 caminhos. Ela reporta 6 coordenadas alcançáveis de main anterior e da main atual, e 15 em refs laterais. Este pacote preserva cada coordenada e os rótulos anteriores apenas como alegações não verificadas. Nenhuma coordenada foi revalidada contra todas as refs neste trabalho de planejamento. Todas as 21 disposições atuais permanecem UNKNOWN.

Não consultar, copiar, persistir, imprimir, testar como credencial ou anexar qualquer segredo ou valor de Match. Nem a ausência de valores, nem uma descrição anterior de fixture, sentinel ou prosa, nem um scan sem findings, nem sucesso do push workflow provam BENIGN_PROVEN. Se a prova exigir tratar ou revelar um valor de Match, parar sem classificação e manter UNKNOWN.

## Plano de execução condicionado a admissão separada

1. **Rebind e inventário.** Após Owner admitir um Work Order de implementação e aprovar seu Context Lock, confirmar SHA-base, identidade do workflow, pin de scanner e configuração; revalidar a tabela de 21 tuplas somente com campos redigidos. Distinguir reachability de main anterior, main atual e refs laterais; registrar rename/cópias e merges separadamente, sem apagar refs nem reescrever história.
2. **Prova por coordenada.** Para cada item, obter evidência objetiva de blob/commit, regra, localização estrutural, finalidade e lineage com um método que não exporte nem apresente o conteúdo correspondente ao Match. Registrar método, SHA dos objetos, resultado redigido, revisor e vínculo de cada alegação. Exigir revisão Security independente para classificar BENIGN_PROVEN. Sem prova positiva suficiente, manter UNKNOWN. Se real ou incerto, seguir a política de incidente/rotação/revogação existente, bloquear a correção e não suprimir.
3. **Decisão de política antes de editar.** Owner e Security devem decidir por escrito, antes de qualquer implementação sensível, se correção estrutural é adequada e se uma exceção fingerprint-specific é permitida pela Security congelada e pela semântica exata do scanner/configuração pinados. Não presumir que .gitleaksignore ou allowlist é permitida. Exceção, se explicitamente autorizada, deve limitar-se a fingerprints aprovadas, conter justificativa, owner, expiração e revisão, não atingir caminho/regra/scan histórico inteiro e ser auditada por Security. Sem autorização ou semântica comprovada, BLOCKED.
4. **Controles adversariais em estado descartável.** Usar apenas controles sintéticos, efêmeros e não autorizantes em repositório descartável. Não persistir os canários nem seus valores em fixture, PR, artifact ou log; redigir integralmente a saída. Demonstrar que novo segredo de alta entropia continua detectado; refs históricas, merges e renames continuam cobertos; mudanças por duplicação não escapam; e uma exceção estreita não faz overmatch. Um controle negativo contra supressão ampla deve demonstrar rejeição do padrão amplo.
5. **Scans e auditoria.** Executar separadamente scan do delta atual e varredura histórica de todas as refs usando o comando canônico com --all --diff-merges=separate e --redact=100 no SHA exato. Nunca interpretar PASS do push workflow como PASS do scan histórico. Security audita política, classificação, controles e riscos; auditoria do Owner/ChatGPT é NOT_INDEPENDENT. Usar especialista independente quando SEC-10 ou política exigir HIGH_ASSURANCE.
6. **Fallback seguro.** Qualquer REAL_SECRET, UNKNOWN, prova insuficiente, finding novo, overmatch, falha de controle, semântica de ignore ambígua ou aprovação ausente mantém BLOCKED/FAILURE, aciona o caminho de incidente aplicável e encerra sem suppression ou mudança. Não reescrever histórico nem remover refs.

## Gates de admissão e autorização

- G0 — Owner audita e admite formalmente o Work Order de implementação; Context Lock rebindado a uma base atual e fontes hash-pinned.
- G1 — Security independente aprova método de prova e classificação de cada uma das 21 coordenadas; nenhuma disposição fica REAL_SECRET ou UNKNOWN para uma correção proposta.
- G2 — Owner e Security aprovam previamente a solução sensível e sua política; qualquer suppression exige autorização explícita, validade, revisão e teste de não-overmatch. Sem isso, não há alteração de config, scanner, CI ou fixture.
- G3 — Implementação limitada ao mapa de escrita então aprovado, controles adversariais, Security audit, checks obrigatórios no HEAD exato e revisão de Owner. HIGH_ASSURANCE exige especialista quando aplicável.
- G4 — Só depois da promoção autorizada do checkpoint em processo separado #434 pode reavaliar #435 em sua própria Work Order. Este plano não satisfaz nem presume esses gates.

## Escopo desta Work Order de planejamento

Somente os quatro artefatos documentais listados no Context Lock. A tabela de evidências é redigida e preserva UNKNOWN. Validar estrutura documental, JSON do Context Lock/registro, contagem e unicidade dos 21 fingerprints, hashes das fontes e diff whitespace.

## Fora do escopo e caminhos proibidos

Qualquer implementação ou alteração em .gitleaks.toml, .gitleaksignore, scanner/config, workflows, CI, testes de produto, código, refs/histórico, checkpoint canônico, pacote/tag/release, npm, ADR, política Security, Issues #434/#437/#435, ou qualquer mudança fora dos quatro documentos autorizados. Não fazer merge, não declarar admissão, não promover checkpoint e não aceitar failure por conveniência.

## Critérios de aceitação para a futura execução

Reproduzir A1–A6 da Issue #439 no HEAD exato, subordinados aos gates acima: todas as coordenadas classificadas com prova independente e sem REAL_SECRET/UNKNOWN; scan histórico no mesmo escopo passa após correção mínima permitida; positivos e negativos adversariais preservam detecção/recall e rejeitam overmatch; checks obrigatórios e auditoria Security passam no exact HEAD; admissão, revisão independente e merge conforme rulesets; #434 faz novo preflight sem presumir promoção e #435 permanece separada. Qualquer critério não demonstrado mantém BLOCKED e o histórico de falha intacto.

## Evidências, revisão e parada

Entregar Evidence Bundle redigido, relatório de scans separado, tabela por fingerprint com fonte objetiva e revisor, diff mínimo, testes adversariais, Security audit, recuperação/rollback e URLs dos checks do exact HEAD. Reportar em português brasileiro com base/HEAD, riscos, limitations, checks PASS/PENDING/FAIL e veredito APPROVED / CORRECTION REQUIRED / BLOCKED. PR desta fase é exclusivamente DRAFT de planejamento.

**STOP CONDITION:** GBS_V113_SEC_001_PLANNING_READY_FOR_OWNER_AUDIT. Sem implementação, admissão automática, alteração de política, suppression, merge, promoção do checkpoint ou npm.
