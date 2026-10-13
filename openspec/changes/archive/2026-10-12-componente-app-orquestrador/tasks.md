# Tasks

## 1. Setup: Criar estrutura de arquivos

- [x] 1.1 Criar arquivo `src/renderer/stores/ui.js` com export `viewMode = writable('welcome')` e verificar que o arquivo está presente
- [x] 1.2 Criar arquivo `src/renderer/components/App.svelte` (vazio inicialmente) e verificar que o arquivo está presente

## 2. Implementar store viewMode

- [x] 2.1 Em `src/renderer/stores/ui.js`, definir `viewMode` com valor inicial 'welcome' e exportar função `setViewMode(mode)` para transições, verificar via `npm test` que store é reativa

## 3. Implementar componente App.svelte

- [x] 3.1 Em `src/renderer/components/App.svelte`, importar Welcome, GraphView, CommandPalette e stores (projectStore, graphRenderedStore, viewMode), verificar zero erros de compilação
- [x] 3.2 Implementar renderização condicional: `{#if $viewMode === 'welcome'}` → Welcome, `{:else if $viewMode === 'graph'}` → GraphView, sempre CommandPalette, verificar visualmente que apenas um dos dois aparece ao trocar viewMode
- [x] 3.3 Capturar referências dos componentes filhos via `bind:this={graphViewComponent}`, `bind:this={commandPaletteComponent}` e verificar que referencias não são undefined ao inspecionar no browser
- [x] 3.4 Em `onMount`, registrar listener `api.onProjectLoaded(...)` que: atualiza `projectStore`, muda `viewMode` para 'graph', entra em modo Root Unit Selection via CommandPalette. Verificar que ao abrir projeto em menu, viewMode muda para 'graph'
- [x] 3.5 Em `onMount`, registrar listener `api.onShowCommandPalette()` que chama `commandPaletteComponent.showCommandPalette()`, verificar que atalho Cmd/Ctrl+P abre paleta
- [x] 3.6 Em `onMount`, registrar listener `api.onShowOpenRecent()` que chama `commandPaletteComponent.showOpenRecent()`, verificar que Arquivo > Abrir Recente funciona
- [x] 3.7 Em `onMount`, registrar listener `api.onShowRootUnitSelection()` que chama `commandPaletteComponent.enterRootUnitMode()`, verificar que Edição > Selecionar Unit funciona
- [x] 3.8 Adicionar `<style>` scoped com `.app-container` (flexbox, height 100%), CommandPalette com `position: fixed; z-index: 1000`, verificar layout visualmente

## 4. Refatorar src/renderer/index.js

- [x] 4.1 Remover todos os listeners (onProjectLoaded, onShowCommandPalette, etc.) de index.js, verificar que não há chamadas a `api.on*` mais
- [x] 4.2 Remover variáveis de estado local (lastProject, hasRenderedGraphForCurrentProject), verificar que index.js não referencia essas
- [x] 4.3 Remover mount direto de Welcome e GraphView, verificar que não há `new Welcome()` ou `new GraphView()` mais
- [x] 4.4 Simplificar index.js para: importar App, obter `#app` do DOM, montar `new App({ target: document.getElementById('app') })`, verificar que arquivo tem ~3 linhas de lógica
- [x] 4.5 Verificar que app inicia sem erros: `npm start` e inspeciona console (sem erros de tipo/referência)

## 5. Refatorar src/renderer/index.html

- [x] 5.1 Remover divs legadas (`#svelte-app`, `#mynetwork`, `#viewFilterPanel`, `#commandPaletteContainer`), deixar apenas `<div id="app"></div>`, verificar visualmente que layout não quebra
- [x] 5.2 Remover ou comentar script antigo se houver, deixar apenas `<script type="module" src="/src/renderer/index.js"></script>`

## 6. Testes manuais de integração

- [x] 6.1 Fluxo: abrir app → Welcome visível → abrir projeto via Arquivo > Abrir → GraphView renderiza → selecionar Unit → grafo aparece, verificar que fluxo completo funciona sem erros
- [x] 6.2 CommandPalette funciona: Cmd/Ctrl+P abre, Cmd/Ctrl+K R abre, Abrir Recente funciona, Selecionar Unit funciona, verificar sem erros de console
- [x] 6.3 Filtros de grafo funcionam: Interface, Implementação, Unidades Externas podem ser ativados/desativados, verificar que grafo re-renderiza
- [x] 6.4 Nenhuma regressão visual: Welcome screen, GraphView, CommandPalette parecem iguais a antes, verificar visualmente
- [x] 6.5 HMR (Hot Module Replacement): modificar arquivo Svelte, verificar que app atualiza sem reload completo

## 7. Limpeza e documentação

- [x] 7.1 Remover código morto/comentado de index.js se houver, verificar que arquivo está limpo
- [x] 7.2 Verificar que CLAUDE.md está atualizado se necessário (menção a App.svelte se relevante)
- [x] 7.3 Rodar `npm test` e verificar que todos os testes passam (domain/ + componentes Svelte se houver)
