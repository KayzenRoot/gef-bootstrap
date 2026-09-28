# Adaptadores de engenharia por produto

Este catálogo prepara padrões para produtos que realmente possuam os runtimes correspondentes. Nenhuma ferramenta abaixo foi instalada neste piloto CLI.

## Playwright — projetos web com navegador

- Executar smoke test em PR e E2E completo em release ou agenda adequada.
- Usar ambiente isolado e dados fictícios; credenciais não podem acessar produção.
- Guardar screenshots e traces somente para falhas, com retenção e redaction compatíveis com dados do projeto.
- Fixar browsers e dependências à versão do projeto; não transformar toda suíte lenta em gate em cada mudança sem baseline.

## Chromatic — UI com Storybook

- Adotar somente se o produto tiver Storybook e reviewers precisarem comparar regressões visuais.
- Verificar limite do plano e projeto antes de conectar a app. Sem cartão, assinatura ou expansão de escopo automática.
- Separar mudanças de baseline visual de aprovações funcionais e cobrir componentes relevantes.

## Vercel — aplicações realmente destinadas à plataforma

- Vincular apenas o produto aprovado para Vercel e conferir o plano empresarial aplicável.
- Preview deployment pode usar dados de teste; produção, domínio e variáveis de outro produto ficam fora do pipeline genérico.
- Tokens ficam em secrets com escopo mínimo e nunca aparecem em logs, artefatos ou evidence bundle.

## Sentry e OpenTelemetry — runtimes ativos

- Instrumentar serviços que atendem tráfego ou jobs de produção; omitir CLI sem serviço persistente.
- Definir redaction de PII, retenção, sampling, alertas e custo antes de ativar envio.
- OpenTelemetry segue como interface de instrumentação; o destino e as credenciais são decisão do projeto.
- Usar ambiente de teste isolado para validar eventos e recuperação, sem enviar dados de produção em CI.

## Supply chain e releases

- Criar SBOM, atestação de build e assinatura apenas quando um processo de distribuição gerar artefato real e reproduzível.
- Atestar SHA do commit, runner, ação, toolchain e digest do artefato. Não atestar um build inexistente nem produzir declaração fictícia.
- Retenção de artefatos respeita risco, visibilidade, custo e política de dados do produto.
