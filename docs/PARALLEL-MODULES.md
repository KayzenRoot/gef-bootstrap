# Patch candidate v1.1.3: planejamento paralelo seguro

**Estado:** implementação candidata, não publicada. A versão de produção continua sendo v1.1.2 até aceite, CI, auditoria e release. Work Order: [GBS-V113-PARALLEL-001](https://github.com/KayzenRoot/gef-bootstrap/issues/432). Programa futuro relacionado: #397 (não integralmente implementado aqui).

## Intenção

Em novos projetos e em projetos que optarem explicitamente pela adoção, o GEF pode utilizar um manifesto versionado que declara módulos já aprovados. Ele produz lotes de até **seis módulos independentes** para execução Codex com **um agente, um worktree Git, uma branch, uma issue, um PR e um Evidence Bundle por módulo**.

**O planejador não executa Codex**, não atribui execução automática, não faz merges, não cria ou modifica documentos de projeto sem pedido explícito e não promove o checkpoint. Os caminhos declarados são **declarações**, não comprovação de isolamento físico: o executor deve aplicar os limites e o auditor deve verificar os diffs. Use o comando opt-in somente após confrontar o manifesto com Checkpoint, Scope, Architecture, Decisions e Work Orders.

## Pré-requisitos

- CLI disponível na branch candidata e, após aprovação, no pacote publicado v1.1.3. O metadata npm do desenvolvimento permanece 1.1.2 até a etapa de release, para não corromper as matrizes de migração aceitas. O pacote estável do registro npm não fornece este comando.
- Node.js >=22 e Git.
- Para criar/reutilizar issues e emitir um prompt com referências verificadas: GitHub CLI `gh` instalado e autenticado, com permissão de escrita no repositório. Faça `gh auth login` previamente.
- Para **planejar** (offline), não precisa de GitHub CLI.
- Crie o manifesto JSON no diretório do projeto: `.gef/parallel-modules.json`. **Não use o manifesto do próprio GEF como substituto do planejamento aprovado do projeto.**

## Exemplo mínimo

```json
{
  "schemaVersion": "1",
  "repository": "OWNER/PROJECT",
  "modules": [
    {
      "id": "M01",
      "title": "Autenticação pública",
      "workOrder": "WO-M01-001",
      "approved": true,
      "state": "ADMITTED",
      "dependencies": [],
      "files": { "read": ["packages/contracts/**"], "write": ["packages/auth/**"] },
      "tests": ["npm run test:auth"]
    },
    {
      "id": "M05",
      "title": "Relatórios",
      "workOrder": "WO-M05-001",
      "approved": true,
      "state": "ADMITTED",
      "dependencies": [],
      "files": { "read": ["packages/contracts/**"], "write": ["packages/reports/**"] },
      "tests": ["npm run test:reports"]
    }
  ]
}
```

**Regras:** os IDs e Work Orders são estáveis e maiúsculos, com hífens e números. `state` aceita `PLANNED`, `ADMITTED`, `PROMOTED`. O estado `PROMOTED` exige `approved: true` e `promotionSha` de 40 caracteres hexadecimais; esse SHA é apenas uma *declaração* no manifesto e **deve** ser conferido contra o checkpoint e a promoção canônica por quem prepara o projeto. O comando não certifica sozinho a autoridade de um SHA.

Todo módulo `ADMITTED` deve declarar caminhos de escrita (sem curinga aberto, apenas caminho literal ou prefixo `/**`). Rejeitamos `../`, caminhos absolutos e globs ambíguos. Caminhos são comparados conservadoramente, ignorando diferenças de maiúsculas/minúsculas. Arquivos compartilhados, inclusive `package-lock.json`, `AGENTS.md`, `planning/**`, `.engineering/**` e `.github/**`, exigem lote isolado. Módulos com dependências não promovidas não entram no lote, mesmo que uma dependência seja executável em outro lote.

## Uso

```bash
gef parallel plan --manifest .gef/parallel-modules.json --slots 6
gef parallel issues --manifest .gef/parallel-modules.json
gef parallel issues --manifest .gef/parallel-modules.json --apply
gef parallel prompt --manifest .gef/parallel-modules.json --slots 6
gef parallel prompt --manifest .gef/parallel-modules.json --slots 6 --batch 2
```

- **plan:** somente leitura, mostra os lotes, dependências bloqueadas e limites. `--json` retorna objeto legível por automação.
- **issues:** sem `--apply`, apenas lista o que criaria/reutilizaria; **com** `--apply`, cria uma issue por módulo aprovado e ainda não promovido, procurando marcador estável `<!-- gef-parallel-module:M01 -->` ou título `[GEF-MOD:M01]`. Se houver dúvida sobre uma issue antiga, **bloqueia** para reconciliação manual em vez de criar duplicata deliberadamente. O inventário de issues deve ser completo (<1000 entradas); operações paralelas de criação por clientes diferentes não são transacionalmente atômicas, portanto **não rode múltiplos aplicadores simultaneamente**. Cada issue nova é relida após a criação.
- **prompt:** exige issues existentes e verificadas pelo GitHub; por padrão emite o **primeiro lote** pronto, e `--batch N` escolhe os lotes seguintes sem reiniciar o primeiro. Copie seu conteúdo integral para uma única sessão do Codex que suporte múltiplos agentes. Cada agente terá Work Order, issue, paths, testes e branch individuais. Nenhum agente começa enquanto não verificar o seu Context Lock.

`--repo OWNER/PROJECT` pode sobrepor explicitamente o repositório do manifesto. **Não** fornece credenciais, tokens ou flags de bypass. Erros de autenticação, acesso, input, duplicidade, dependência, ciclo ou path desconhecido retornam código não zero. `--apply` é recusado nos comandos `plan` e `prompt`.

## Integração e validação

O GEF continua operando com `init`, `adopt`, `upgrade`, `doctor` e `status` sem mudança no seu caminho de execução. O novo subcomando está isolado em `packages/cli/bin/parallel.mjs` e é empacotado pelo payload `bin/`; não envolve novo serviço ou API paga.

Provas requeridas antes de publicar: `node --test tests/gef-parallel-patch.test.mjs`, `npm run build`, `npm run typecheck`, `npm run validate`, `npm audit --audit-level=high`, `node packages/cli/scripts/prepare-package.mjs --pack ...`, instalação limpa do tarball e `gef parallel --help`, com checagem de SHA do PR no CI. Registrar Evidence Bundle e Checkpoint Delta *proposto*. A publicação v1.1.3 e a adoção por projetos existentes ficam para autorização/validação de release específica.
