# Design

## Context

Renomeação pura de um termo do glossário (veja `proposal.md` — Why). O termo
aparece em três camadas: identificadores de código (`src/domain/tabs/` e o
store/`App.svelte` do renderer), nomes de testes e o texto de specs e docs.

## Goals / Non-Goals

**Goals:**
- Nenhuma ocorrência de "Graph Tab"/`graphTab`/`GraphTab`/prefixo `graph:` de
  id de Tab fora do histórico arquivado e do `_Evitar_` do `CONTEXT.md`.
- Suíte de testes (Vitest + Playwright) verde sem nenhuma alteração de
  asserção além dos nomes/ids renomeados.

**Non-Goals:**
- Renomear `GraphView`, o campo `graph` (`{ nodes, edges, rootUnitId }`) dos
  dados da Tab, nem a capability `graph-view-filter`/`graph-canvas-layout`:
  esses nomes descrevem o grafo, não a Tab, e continuarão servindo também à
  Method Tab.
- Reescrever changes arquivadas.

## Decisions

- **`skip_specs: true` + edição direta das specs principais.** Nenhum
  requisito muda de comportamento. Expressar a troca como delta exigiria
  `RENAMED` + `MODIFIED` com o bloco inteiro de ~10 requisitos em 8 specs —
  muito texto copiado para uma troca de palavra, e propenso a perder
  cenários no arquivamento. Alternativa considerada: deltas completos;
  rejeitada pelo custo e risco, sem ganho de rastreabilidade (o commit já
  registra a troca).
- **Prefixo `unit:`** no lugar de `graph:`, mantendo o sufixo igual ao
  `rootUnitId` de `expandDependencyGraph` (o teste que garante essa
  equivalência continua, só com o novo prefixo). O id é efêmero (não é
  persistido nem enviado por IPC), então não há migração.
- **Um commit só**, no padrão Conventional Commits
  (`refactor: renomeia Graph Tab para Unit Tab`), separado da feature.

## Risks / Trade-offs

- [Uma ocorrência esquecida deixa o vocabulário misto] → tarefa final de
  `grep` que precisa voltar vazia (fora das exceções listadas).
- [e2e localizar Tabs pelo id/prefixo] → hoje os e2e localizam por título e
  papel, não pelo id; mesmo assim a suíte e2e roda na verificação.
- [Editar specs principais fora do fluxo de delta] → aceito por ser só
  terminologia; o diff da change fica revisável no mesmo commit.
