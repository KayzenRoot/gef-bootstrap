# Next Labs — plano de rollout da engenharia

Status: preparado no piloto; rollout não autorizado nem executado. A aplicação futura exige aprovação específica após auditoria independente do piloto.

## Arquitetura proposta

1. Criar, quando houver uma GitHub Organization adequada, um repositório central versionado para políticas, workflows reutilizáveis, templates e ferramentas de preflight. Enquanto a conta for pessoal, manter os templates nos próprios repositórios e usar um repositório privado/público de engenharia apenas como catálogo; não assumir que recursos de organização estão disponíveis.
2. Cada workflow consumidor fixa o reusable workflow por SHA completo. Um PR de atualização do catálogo testa todos os consumidores amostrados e gera mapa de versões; não usar referência mutável `@main`.
3. Templates separados por família de produto: Node.js/TypeScript, Python, web frontend, API/serviço, CLI, motor de jogos, plataforma de IA e produto financeiro. Um template fornece defaults mínimos e aponta as exceções aprovadas no próprio projeto.
4. Cada repositório mantém seu `AGENTS.md`, autoridade, Work Orders, Context Lock, política de revisão, Definition of Done e Evidence Bundle sob sua própria governança. Um template não pode substituir fonte canônica do produto.
5. Instalação de GitHub Apps sempre começa com um repositório autorizado por vez. Inventário lê permissões, plano, escopo e resultado antes de propor ampliação. Não provisionar apps para todos os repositórios como parte de onboarding automático.
6. CODEOWNERS é gerado a partir de donos humanos confirmados. Sem um revisor humano independente, proteção não simula aprovação: registrar a limitação e manter exigências existentes.
7. Um catálogo versionado mapeia check name, tipo de evento, caminhos filtrados, permissões e custo medido. Somente verificações que ocorrem em todo PR podem virar obrigatórias.
8. Atualizações de Actions são submetidas por Dependabot e avaliadas por PR. Cada SHA novo exige conferir release/tag upstream, permissões e CI; não reescrever refs em massa.
9. Agentes de IA recebem instruções específicas de escopo, identidade, fingerprints, aprovação e stop conditions. Nunca herdam acesso externo por mera presença num projeto.

## Preflight, execução e rollback por repositório

1. Capturar owner, repo, visibilidade, conta, plano, default branch, SHA e árvore limpos; validar Work Order ativo, Context Lock e fontes de autoridade.
2. Inventariar branch rules, checks reais, workflows, dependências, apps instaladas, secrets referenciados sem ler valores, revisores, minutos e custos disponíveis.
3. Comparar com o manifesto deste piloto e classificar diferenças; não corrigir toda divergência automaticamente.
4. Abrir um incremento limitado a um único repositório, criar branch e PR, validar Actions fixadas, permissões mínimas, YAML, teste local e checks no SHA exato.
5. Revisão independente e gates do produto precedem merge. Atualizar checkpoint de manutenção separado; preservar os registros de aceitação históricos.
6. Se falhar, reverter somente o incremento do repositório alvo por PR; nunca remover controles de branch ou force-push. Capturar a causa e corrigir o template antes de continuar.
7. O rollout segue em lotes explicitamente aprovados, um repositório por vez; pausa no primeiro desvio de autoridade, segurança ou falha de validação.

## Artefatos padrão futuros

- Work Order: objetivo, base, escopo, risco, exclusões, critérios, plano de validação, stop condition.
- Context Lock: SHA exato, tree, fingerprints de arquivos canônicos, identidade e checks de invalidação.
- Definition of Done: testes e checks no SHA final, análise independente, vulnerabilidades triadas, evidência, checkpoint e estado pós-merge.
- Evidence Bundle universal: identidade não sensível, SHA/ref, comandos/resultados, links de run, permissões, custo observado ou `NOT_VERIFIED`, decisões, exceções e próxima ação.
- Métricas: duração e fila por workflow, falhas por causa, cancelamentos, minutos e custo quando visíveis, cache hit rate, tempo de review, incidentes de supply chain. Comparações exigem coorte equivalente e não podem reduzir segurança.
- Recuperação: congelar expansão, preservar logs e árvore, comparar fingerprints, restaurar configuração administrativa do backup aprovado e reexecutar somente os gates afetados.

## Plano por tipo de produto

| Tipo | Pipeline básico | Extensões condicionais |
| --- | --- | --- |
| Node.js / TypeScript | install lockfile, typecheck, tests, audit delta, Dependency Review | LCOV só de fonte, Codecov/Sonar mediante custo e elegibilidade verificados |
| Python | ambiente travado, lint/type checks, unit/integration, dependency audit | packaging, matrix suportada, cobertura de `src/` |
| Web frontend | pipeline base e build | Playwright smoke/E2E, screenshots e traces; Chromatic somente com Storybook e revisão visual real |
| APIs e serviços | pipeline base, integração e contrato | OpenTelemetry/Sentry em runtime real; secrets de teste separados de produção |
| CLI | build multiplataforma, contratos/integração | empacotamento, SBOM e proveniência somente quando releases reais forem produzidos |
| Motores de jogos | testes por editor/runtime e plataforma alvo | matriz e cache definidos pelo engine; não assumir runner genérico suficiente |
| Plataforma de IA | testes de avaliação, redaction, segurança de modelo/dados | limites de custo e dados explicitados; sem testes pagos implícitos |
| Produto financeiro | controles reforçados, auditabilidade e segregação de segredos | threat model, auditoria independente e requisitos regulatórios definidos por Work Order |

## Pronto para evoluir à organização

A conta atual é uma conta pessoal KayzenRoot. O piloto não verificou disponibilidade contratual de rulesets de organização, catálogo central de workflows, templates organizacionais ou gestão central de apps. Tratar esses recursos como `NOT_VERIFIED` até confirmar plano e configuração numa organização da Next Labs. Não converter a conta nem criar organização nesta execução.
