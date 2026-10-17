# Tasks

## 1. Domínio: regras de Tabs

- [x] 1.1 Criar `src/domain/tabs/index.js` com `initialTabsState`, `graphTabId`, `openWelcomeTab`, `openGraphTab`, `activateTab`, `closeTab`, `canCloseTab`, `closeGraphTabs`, `nextTab` e `previousTab` (design, decisão 1), e verificar que o módulo importa sem dependência de Electron ou Svelte
- [x] 1.2 Criar `src/domain/test/tabs.test.js` cobrindo: estado inicial só com a Welcome Tab; Graph Tab nova no fim e ativa; Root Unit repetida só ativa (sem duplicar nem mudar posição); fechar a Tab ativa ativa a usada mais recentemente; fechar Tab inativa mantém a ativa; fechar a última Graph Tab reabre a Welcome Tab; Welcome Tab sozinha não fecha; `openWelcomeTab` com a Welcome fechada e aberta; `closeGraphTabs` com e sem Welcome Tab; `nextTab`/`previousTab` em ciclo e no-op com uma Tab; `graphTabId('UnitA')` igual a `graph:` + o `rootUnitId` de `expandDependencyGraph`. Verificar com `npx vitest run src/domain/test/tabs.test.js`

## 2. Command `Bem-vindo` e menu `Ajuda`

- [x] 2.1 Adicionar `{ id: 'showWelcome', label: 'Bem-vindo' }` no fim de `COMMANDS` (`src/domain/commands/index.js`) e atualizar `src/domain/test/commands.test.js` (ids, rótulos e `availableCommands` com e sem Project incluindo `Bem-vindo`). Verificar com `npx vitest run src/domain/test/commands.test.js`
- [x] 2.2 Em `src/main/commands.js`, tratar `showWelcome` enviando `app:show-welcome`, e cobrir o caso em `src/main/test/commands.test.js`
- [x] 2.3 Em `src/main/menu.js`, adicionar o menu `Ajuda` com o item `Bem-vindo` depois de `{ role: 'viewMenu' }`, e atualizar `src/main/test/menu.test.js` (ordem dos menus e o novo menu). Os testes de `src/main/test/` não estão no `include` do `vitest.config.mjs`, então verificar abrindo o app (`npm start`) e conferindo a barra de menus `Arquivo`, `Edição`, `Ferramentas`, visualização e `Ajuda` — feito; verificado com `src/main/test/menu.test.js` rodando no Vitest por uma configuração temporária que simula `@jest/globals` (o binário do Electron não está instalado no sandbox, então a barra de menus nativa não foi vista no app)
- [x] 2.4 Expor `onShowWelcome(cb)` em `src/preload/api.js`, no mesmo formato de `onShowOpenRecent`, e verificar que `window.pascalDependencyViewer.onShowWelcome` existe no DevTools — feito; coberto pelo stub do preload nos testes e2e (`e2e/support/rendererHarness.ts`)

## 3. Store de Tabs no renderer

- [x] 3.1 Criar `src/renderer/stores/tabs.js` com um `writable(initialTabsState())` e funções que aplicam as funções do domínio, guardando em cada Graph Tab `title`, `path` e `graph` (design, decisão 2). Verificar com `npm test` (sem regressões) e importando a store no `App.svelte` na tarefa 5.1

## 4. Componentes

- [x] 4.1 Mudar `GraphView.svelte` para receber `graph` como prop e renderizar no `onMount`, removendo o `renderGraph` exportado e os `style.display` imperativos; trocar o `position: fixed` do painel de View Filter por `position: absolute` dentro de `.graph-container` (design, decisão 4). Verificar no app que o painel aparece no canto superior direito da área do grafo, abaixo da barra de Tabs, e que os checkboxes filtram o grafo
- [x] 4.2 Criar `TabBar.svelte` (design, decisão 9): uma linha com rolagem horizontal, aba ativa destacada, "x" escondido quando `canCloseTab` é falso, tooltip com o `path` nas Graph Tabs, clique no "x" sem ativar a aba e `scrollIntoView` da aba ativa. Verificar no app com mais Graph Tabs do que cabem na janela
- [x] 4.3 Remover de `Welcome.svelte` a condição `{#if !$graphRenderedStore}` e o import da store, mantendo os dois estados (sem Project / Project carregado). Verificar no app que a Welcome Tab mostra o caminho do Project depois de abrir uma Graph Tab e voltar para ela
- [x] 4.4 Em `CommandPalette.svelte`, remover `closable`, `graphViewComponent`, `markGraphRendered` e as guardas de não-fechável; `selectRootUnit` passa a fechar a paleta e chamar `onRootUnitSelected(projectUnit)`; exportar `isOpen()`. Em `services/commandPalette.js`, expor `isCommandPaletteOpen()` (design, decisão 5). Verificar no app que `Esc` fecha o `Selecionar Unit` exibido ao abrir um Project e que `Cmd/Ctrl+P` e `Cmd/Ctrl+K R` trocam de modo a partir dele — feito; o método exportado se chama `isPaletteOpen()`

## 5. Orquestração no `App.svelte`

- [x] 5.1 Trocar o `{#if $viewMode}` pela `TabBar` e uma área de conteúdo com um painel por Tab (Welcome ou `GraphView`), com os inativos em `visibility: hidden`, `pointer-events: none` e `inert` (design, decisão 3). Verificar no app que, depois de mexer no View Filter, arrastar um nó e dar zoom numa Graph Tab, trocar de Tab e voltar mantém tudo igual
- [x] 5.2 Implementar `onRootUnitSelected`: se `graphTabId(unitName)` já está aberto, só ativar; senão chamar `expandFromRootUnit` e abrir a Graph Tab. Verificar no app que escolher de novo uma Root Unit aberta só a ativa (sem nova aba nem leitura de disco, conferindo no DevTools que não há chamada `expandFromRootUnit`)
- [x] 5.3 Em `onProjectLoaded`, fechar todas as Graph Tabs (ativando a Welcome Tab) antes de abrir o `Selecionar Unit` sem `closable`; registrar `onShowWelcome` com `openWelcomeTab`; em `onShowRootUnitSelection`, tirar o `closable`. Verificar no app: abrir outro `.dpr` e reabrir o mesmo `.dpr` por `Abrir recente` fecham as Graph Tabs; cancelar o diálogo não muda as Tabs; `Ajuda > Bem-vindo` e o Command `Bem-vindo` reabrem ou ativam a Welcome Tab
- [x] 5.4 Registrar o `keydown` no `window` (fase de captura) para `Cmd+W` (macOS) / `Ctrl+W` (Linux), `Ctrl+Tab` e `Ctrl+Shift+Tab`, com `preventDefault()` e ignorando tudo com a paleta aberta (design, decisão 6). Verificar no app: `Cmd/Ctrl+W` fecha a Tab ativa e nunca a janela, não faz nada com só a Welcome Tab, e os atalhos de navegação giram em ciclo — feito; verificado em `e2e/tabs.spec.ts` no Chromium. Que `Cmd/Ctrl+W` não fecha a janela no Electron de verdade não foi conferido no app
- [x] 5.5 Remover `src/renderer/stores/ui.js` e `src/renderer/stores/graph.js` e confirmar com `grep -rn "viewMode\|graphRenderedStore\|markGraphRendered" src/` que não sobrou nenhuma referência; `npm test` continua passando

## 6. Documentação

- [x] 6.1 Atualizar o `CLAUDE.md`: stores (`tabs.js` no lugar de `ui.js`/`graph.js`), componentes (`TabBar.svelte`, uma `GraphView` por Graph Tab), passos 3 a 6 do fluxo de dados (Graph Tab em vez de substituir o grafo, `Selecionar Unit` sempre fechável), menu `Ajuda`, evento `app:show-welcome`, `onShowWelcome` no preload e `src/domain/tabs/`. Verificar relendo cada caminho citado contra o código

## 7. Verificação integrada

- [x] 7.1 Rodar `npm test` e percorrer no app (`npm start`) os cenários de `specs/tabs/spec.md`, do início ao fim: iniciar só com `Bem-vindo`; abrir um `.dpr`; fechar o `Selecionar Unit` com `Esc`; abrir `UnitA` e `UnitB`; escolher `UnitA` de novo; fechar a Tab ativa e conferir a ativação pela mais recente; fechar tudo até a Welcome Tab voltar; redimensionar a janela com uma Graph Tab inativa e ativá-la; abrir outro Project — feito com `npm test` (64 testes) e `npx playwright test --repeat-each=3` (60 execuções sem falha; os 14 testes novos estão em `e2e/tabs.spec.ts` e rodam o renderer com o preload simulado). O teste de zoom se pula quando a física da vis-network não estabiliza, problema que já existia na `main` (ver `docs/SUGGESTION.md`). Os testes de estresse revelaram que o `fit()` agendado pelo `networkRenderer` disparava depois de a Graph Tab ser fechada; corrigido

## 8. Ajustes da verificação (`/opsx:verify`)

- [x] 8.1 Trocar nas specs os rótulos do View Filter pelos da tela ("Implementation" e "External"), trazendo para o delta de `graph-view-filter` os requisitos que os citam; verificado com `openspec validate abas-estilo-vscode`
- [x] 8.2 Descartar o grafo que chega depois de outro Project ser carregado (`App.svelte`, `openRootUnit`); verificado pelo e2e "grafo que chega depois de outro Project ser carregado não abre Graph Tab"
- [x] 8.3 Cobrir com e2e a reabertura de uma Root Unit depois de fechar sua Graph Tab (View Filter volta ao padrão); verificado pelo e2e correspondente em `e2e/tabs.spec.ts`
- [x] 8.4 Alertar o usuário quando `expandFromRootUnit` falhar, sem abrir Graph Tab; verificado pelo e2e "falha ao gerar o grafo avisa o usuário e não abre Graph Tab"
- [x] 8.5 Remover o `style.display = 'block'` sem uso de `networkRenderer.js` e verificar com `npx playwright test` que o grafo continua sendo desenhado
- [x] 8.6 Registrar em `docs/SUGGESTION.md` que o `test.skip` do teste de zoom deve sair quando a física for corrigida

## Workflow follow-up

- Os testes de `src/main/test/` não rodam no `npm test` hoje (o `include` do `vitest.config.mjs` só cobre `src/domain/test/**`). Incluí-los é uma decisão à parte, fora desta change.
- Arquivar a change (`/opsx:archive`) depois da revisão.
