# Proposal

## Why

A Caller Graph (próxima feature) introduz um segundo tipo de Tab que também
exibe um grafo, a Method Tab. Com isso, "Graph Tab" deixa de identificar a Tab
do Dependency Graph de uma Root Unit — as duas Tabs mostram grafos. A sessão
de grilling decidiu renomear o conceito para **Unit Tab** (o `CONTEXT.md` já
foi atualizado, com "Graph Tab" em _Evitar_) e fazer isso num commit
preparatório separado, antes da feature, para que o diff da feature não
misture renomeação com comportamento novo.

## What Changes

- Renomear o conceito "Graph Tab" para "Unit Tab" em código, testes, e2e,
  specs principais (`openspec/specs/`), `CLAUDE.md` e `docs/SUGGESTION.md`.
- Código de domínio (`src/domain/tabs/`): `graphTabId` → `unitTabId`,
  `openGraphTab` → `openUnitTab`, `closeGraphTabs` → `closeUnitTabs`; o
  prefixo do id da Tab passa de `graph:` para `unit:`.
- Store do renderer (`src/renderer/stores/tabs.js`): `closeAllGraphTabs` →
  `closeAllUnitTabs`, e os usos em `App.svelte`.
- Nomes de testes (Vitest e Playwright) e comentários que citam "Graph Tab".
- **Nenhuma mudança de comportamento**: a mesma Root Unit continua gerando a
  mesma Tab, com a mesma posição, título, tooltip e ciclo de vida. O id da
  Tab não é persistido nem trafega por IPC, então a troca de prefixo não
  quebra compatibilidade.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

_Nenhuma em nível de requisito._ Os requisitos das capabilities `tabs`,
`graph-view-filter`, `root-unit-selection`, `application-menu`,
`command-palette`, `graph-canvas-layout`, `renderer/app-root` e
`welcome-screen` continuam iguais; só o termo usado no texto muda. Por isso a
change declara `skip_specs: true` e o texto das specs principais é ajustado
diretamente, como tarefa de documentação (veja `design.md`).

## Impact

- Código: `src/domain/tabs/index.js`, `src/renderer/stores/tabs.js`,
  `src/renderer/components/App.svelte`.
- Testes: `src/domain/test/tabs.test.js`, `e2e/tabs.spec.ts`.
- Specs principais: `openspec/specs/{tabs,graph-view-filter,root-unit-selection,application-menu,command-palette,graph-canvas-layout,welcome-screen}/spec.md`
  e `openspec/specs/renderer/app-root/spec.md`.
- Documentação: `CLAUDE.md`, `docs/SUGGESTION.md`.
- Fora de escopo: changes arquivadas em `openspec/changes/archive/` (registro
  histórico), o `CONTEXT.md` (já atualizado), o componente `GraphView` e o
  campo `graph` dos dados da Tab (descrevem o grafo, não a Tab).
