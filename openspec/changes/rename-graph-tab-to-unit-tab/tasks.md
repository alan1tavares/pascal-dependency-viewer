# Tasks

## 1. Domínio

- [ ] 1.1 Em `src/domain/tabs/index.js`, renomear `graphTabId` → `unitTabId` (prefixo `graph:` → `unit:`), `openGraphTab` → `openUnitTab` e `closeGraphTabs` → `closeUnitTabs`, ajustando comentários; verificar com `grep -n -i "graph" src/domain/tabs/index.js` sem ocorrências referentes à Tab
- [ ] 1.2 Em `src/domain/test/tabs.test.js`, atualizar imports, o helper `graphTab`, os ids esperados (`'graph:unita'` → `'unit:unita'` etc.) e os nomes dos testes ("Graph Tab" → "Unit Tab", `closeGraphTabs`/`graphTabId` → novos nomes); verificar com `npx vitest run src/domain/test/tabs.test.js` verde

## 2. Renderer

- [ ] 2.1 Em `src/renderer/stores/tabs.js`, usar os novos nomes do domínio, renomear `closeAllGraphTabs` → `closeAllUnitTabs` e trocar "Graph Tab" no comentário (mantendo o campo `graph` dos dados); verificar com `npm test` verde
- [ ] 2.2 Em `src/renderer/components/App.svelte`, atualizar imports e chamadas (`unitTabId`, `closeAllUnitTabs`); verificar com `npm test` verde e `npm start` abrindo uma Root Unit numa Tab como antes

## 3. Testes e2e

- [ ] 3.1 Em `e2e/tabs.spec.ts`, trocar "Graph Tab" por "Unit Tab" nos nomes dos testes e comentários (8 testes + 1 comentário); verificar rodando a suíte Playwright (`npx playwright test e2e/tabs.spec.ts`) verde

## 4. Specs principais e documentação

- [ ] 4.1 Trocar "Graph Tab(s)" por "Unit Tab(s)" no texto (títulos de requisito, cenários e corpo) de `openspec/specs/tabs/spec.md` (inclui a definição dos tipos de Tab), `graph-view-filter`, `root-unit-selection`, `application-menu`, `command-palette`, `graph-canvas-layout`, `welcome-screen` e `renderer/app-root`; verificar com `openspec validate --specs` sem erros
- [ ] 4.2 Atualizar `CLAUDE.md` (descrição de `App.svelte`, `TabBar`, `src/domain/tabs/` com `unitTabId`/prefixo `unit:`, e os passos 3–4 do Data flow); verificar com `grep -n "Graph Tab\|graphTab\|graph:" CLAUDE.md` vazio
- [ ] 4.3 Atualizar `docs/SUGGESTION.md` (menções a Graph Tab e ao nome do teste e2e renomeado); verificar que o nome de teste citado bate com `e2e/tabs.spec.ts`

## 5. Verificação final

- [ ] 5.1 Rodar `grep -rniE "graph ?tab|graphTab|GraphTabs|'graph:" --exclude-dir={node_modules,.git,archive,.vite,out} .` e confirmar que só sobra o `_Evitar_` do `CONTEXT.md`; rodar `npm test` e a suíte e2e completas, ambas verdes
- [ ] 5.2 Commitar sozinho como `refactor: renomeia Graph Tab para Unit Tab` (Conventional Commits, sem emoji, sem linha Co-Authored-By), antes de qualquer commit da feature de Caller Graph
