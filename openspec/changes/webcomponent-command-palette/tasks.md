# Tasks

## 1. Criar Web Component CommandPalette.js

- [x] 1.1 Criar classe `CommandPalette extends HTMLElement` em `src/renderer/components/CommandPalette.js` com Shadow DOM, template string e estilos encapsulados — verificar que arquivo existe e classe exportada como `customElements.define('command-palette', CommandPalette)`
- [x] 1.2 Implementar state privado (mode, selectedIndex, filteredItems, modeEntry, closable, isOpen, recentPaths, rootUnits, rootUnitProjectDir) como `#field` — verificar via console que state é privado (não enumerable como public property)
- [x] 1.3 Implementar métodos públicos `open()`, `close()`, `switchMode(mode)` e verificar via console que chamadas funcionam corretamente
- [x] 1.4 Implementar setter methods `setCommands(list)`, `setRecentProjects(list)`, `setProjectUnits(units, projectDir)`, `setHasProject(fn)`, `setGetProject(fn)`, `setOnRootUnitSelected(fn)` — verificar que métodos existem no elemento e aceitam argumentos
- [x] 1.5 Implementar renderização interna (`#renderList()`, `#applyFilter()`, `#resetInput()`, etc.) com template único — verificar que shadow DOM contém o overlay e lista quando aberto
- [x] 1.6 Implementar navegação (↑, ↓, Enter, Esc) via event listeners em `connectedCallback()` — verificar via keyboard no app que setas movem destaque, Enter seleciona, Esc fecha
- [x] 1.7 Implementar lógica de click fora do card e modo não-fechável — verificar que click no overlay fecha paleta, e que no modo não-fechável não fecha
- [x] 1.8 Implementar emissão de eventos `selection-confirmed` (detail: {item, mode}) e `closed` — verificar que eventos são disparados ao abrir DevTools com listener

## 2. Refatorar renderer/index.js

- [x] 2.1 Remover imports de `commandPalette.js` e adicionar referência via `document.querySelector('command-palette')` — verificar que arquivo compila sem erros
- [x] 2.2 Refatorar `configureCommandPalette({hasProject, getProject, onRootUnitSelected})` para chamar `palette.setHasProject()`, `palette.setGetProject()`, `palette.setOnRootUnitSelected()` — verificar que métodos são chamados sem erro
- [x] 2.3 Refatorar `showCommandPalette()` para chamar `palette.open()` — verificar que Cmd+P abre a paleta
- [x] 2.4 Refatorar `showOpenRecent()` para chamar `palette.switchMode('recents')` + `palette.open()` — verificar que Cmd+K R abre modo recents
- [x] 2.5 Refatorar `enterRootUnitMode()` para chamar `palette.switchMode('rootUnit')` + `palette.setProjectUnits()` + `palette.open()` e ajustar closable — verificar que ao abrir projeto abre modo rootUnit com closable=false
- [x] 2.6 Refatorar `closeCommandPalette()` para chamar `palette.close()` — verificar que paleta fecha ao selecionar unit ou comando
- [x] 2.7 Adicionar listeners para eventos do componente: `palette.addEventListener('selection-confirmed', (e) => {...})` e `palette.addEventListener('closed', ...)` — verificar que ao escolher item a ação executa (abre projeto, expande graph, etc.)
- [x] 2.8 Verificar que `onRootUnitSelected` é chamado após expandir graph e que closable volta para true — verificar via DevTools que callback é invocado

## 3. Atualizar index.html

- [x] 3.1 Remover `<div id="commandPaletteOverlay">` + `<div id="commandPaletteCard">` + conteúdo e `<style>` (estilos da paleta) de index.html — verificar que arquivo está limpo, sem markup de paleta
- [x] 3.2 Adicionar `<command-palette></command-palette>` no corpo de index.html (antes de fechar `</body>`) — verificar que tag existe no inspect element
- [x] 3.3 Importar/registrar CommandPalette.js em `index.html` (via `<script>` ou module) — verificar que custom element está registrado (no console: `customElements.get('command-palette')` retorna classe)

## 4. Teste Manual e Validação

- [ ] 4.1 Abrir app com `npm start` e verificar que não há erros no console — verificar console vazio de errors
- [ ] 4.2 Testar modo Commands: Cmd+P → verificar overlay abre, input focado, primero item destacado — verificar visualmente
- [ ] 4.3 Testar filtro: digitar no input → verificar lista filtra em tempo real, apenas commands match aparecem — verificar que "Selecion" mostra apenas "Selecionar Unit"
- [ ] 4.4 Testar navegação: ↑/↓ → verificar destaque move, Enter → verificar comando executa, Esc → verificar paleta fecha — verificar comportamento completo
- [ ] 4.5 Testar modo Recents: Cmd+K R → verificar overlay abre em modo recents com prefix "Abrir recente" — verificar visualmente
- [ ] 4.6 Testar click fora: clicar no overlay (cinzento) → verificar paleta fecha — verificar que não fecha se estiver no modo não-fechável
- [ ] 4.7 Testar auto-abertura ao carregar projeto: Arquivo → Abrir projeto → verificar que paleta abre em modo "Selecionar Unit" não-fechável, Esc/click fora não funcionam — verificar comportamento
- [ ] 4.8 Testar seleção de unit: escolher unit da lista → verificar graph expande, paleta fecha, closable volta true — verificar graph renderizado corretamente
- [ ] 4.9 Testar Edição → Selecionar Unit: verificar que abre modo rootUnit novamente, agora fechável — verificar visualmente
- [ ] 4.10 Testar que não há warnings/errors de style ou comportamento inesperado — verificar console vazio, DevTools sem erros

## 5. Cleanup e Finalização

- [x] 5.1 Remover arquivo antigo `src/renderer/components/commandPalette.js` — verificar que arquivo não existe mais
- [x] 5.2 Rodar `npm test` (suite jest) e verificar que testes do domain passam, nenhum teste quebrado — verificar exit code 0
- [x] 5.3 Verificar que não há import de `commandPalette.js` em nenhum lugar do código (grep) — verificar que grep retorna 0 resultados
- [x] 5.4 Commit final: "refactor: transforme commandPalette em web component nativo" — verificar que diff mostra arquivo removido, CommandPalette.js adicionado, renderer/index.js e index.html modificados
