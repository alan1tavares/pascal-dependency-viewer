# Tasks

## 0. Pré-requisitos

- [ ] 0.1 Confirmar que `rename-graph-tab-to-unit-tab` e `pascal-parser-and-call-index` estão aplicadas (`listUnitMethods`/`expandCallerGraph` expostos no preload, devolvendo nós/arestas no formato da spec `caller-graph-expansion`); verificar com `npm test` verde antes de começar

## 1. Domínio puro

- [ ] 1.1 Extrair a normalização de busca (sem acento, sem caixa) de `src/domain/commands` para um helper reutilizável e verificar que `commands.test.js` continua passando
- [ ] 1.2 Adicionar `selectMethod` (`Selecionar Método`, sem atalho, `requiresActiveTabKind: 'unit'`) ao catálogo entre `Selecionar Unit` e `Bem-vindo`, e estender `availableCommands` com `activeTabKind`; atualizar o teste "Selecionar Método e Sair não são Commands" e cobrir os cenários de disponibilidade (Welcome/Unit/Method Tab) em `commands.test.js`
- [ ] 1.3 Criar `filterMethods(methods, text)` (sobre o `label` vindo do main) e `ipcErrorCode(error)` (extrai `[CODE]` da mensagem) em `src/domain/`, com testes de ordem preservada, filtro sem acento/caixa e códigos `PROJECT_REPLACED`/`NO_PROJECT`/`METHOD_NOT_FOUND`/sem código
- [ ] 1.4 Em `src/domain/tabs`: `methodTabId(methodId)` = `method:` + id do Method (teste garantindo que não colide com `unitTabId`), `openMethodTab`, `kind: 'method'` e `closeUnitTabs` → `closeProjectTabs` (fecha `unit` e `method`); testes em `tabs.test.js` para abrir, reativar sem duplicar, mesmo rótulo em Units diferentes, fechar a Unit Tab de origem e abrir Project
- [ ] 1.5 Criar `assignCallerLevels(graph)` em `src/domain/` (Target Method no nível 0, longest path ignorando back-edges e self-loops) com testes para cadeia, ramificação, auto-recursão e ciclo mútuo

## 2. Main process e preload

- [ ] 2.1 Em `src/main/menu.js`, trocar o alerta por `run('selectMethod')`, dar `id: 'selectMethod'`, rótulo do catálogo e `enabled: false` inicial; atualizar `menu.test.js` (remove o teste do alerta, adiciona clique → `runCommand` e estado inicial desabilitado)
- [ ] 2.2 Em `src/main/commands.js`, tratar `selectMethod` empurrando `app:show-method-selection`; teste em `src/main/test` verificando o push
- [ ] 2.3 Registrar o handler `tabs:active-kind` que habilita/desabilita o item `selectMethod` do menu; teste unitário com menu falso verificando `enabled` para `unit`, `welcome` e `method`
- [ ] 2.4 Expor em `src/preload/api.js` `setActiveTabKind(kind)` (`send` em `tabs:active-kind`) e `onShowMethodSelection(cb)`, ao lado de `listUnitMethods`/`expandCallerGraph` da parte 2; verificar com o teste do preload/api existente ou um novo

## 3. Renderer

- [ ] 3.1 Em `App.svelte`, enviar `setActiveTabKind` a cada mudança da Tab ativa (incluindo a inicial) e usar `closeProjectTabs` em `onProjectLoaded`; verificar por teste de componente que o envio ocorre ao ativar Unit, Welcome e Method Tab
- [ ] 3.2 Adicionar o modo `method` em `CommandPalette.svelte`: prefixo `Selecionar Método`, ajuda `Digite o nome do método`, estados `Analisando Project…` / lista / `Esta Unit não tem métodos` / Unit não analisada (`skipped`, com o motivo) / `Nenhum método encontrado`, `↑`/`↓`/`Enter`/clique, `Esc` por origem (`command` volta à lista, `direct` fecha) e clique fora fecha; testes de componente para cada cenário do spec `command-palette`
- [ ] 3.3 Ligar o Command `Selecionar Método` da paleta à troca local de modo (sem IPC) e `onShowMethodSelection` à abertura `direct` usando a Root Unit da Unit Tab ativa (ignorando se não houver); descartar respostas de `listUnitMethods` que chegam fora de contexto e erros `[PROJECT_REPLACED]` em silêncio, alertando os demais; teste de componente cobrindo Esc durante a análise e reentrada com índice pronto
- [ ] 3.4 Ao escolher um Method: ativar a Method Tab existente (`methodTabId(method.id)`) ou chamar `expandCallerGraph(method.id)` e abrir uma nova; descartar em silêncio `[PROJECT_REPLACED]` ou resultado que chega após outro Project ser carregado; alertar outros erros (mesmo padrão de `expandFromRootUnit`); teste de componente
- [ ] 3.5 `TabBar.svelte`: título = `label` do Method e tooltip `Unit — caminho` para Method Tabs; teste de componente
- [ ] 3.6 Criar `services/callerGraphRenderer.js` + `CallerGraphView.svelte` com layout hierárquico `DU`, níveis de `assignCallerLevels`, grupos `target`/`entryPoint`/`block`/`method` derivados de `isTarget`/`kind`/`isEntryPoint`, `isBackEdge` tracejado, self-loop (`from === to`), `isPolymorphic` com cor e tooltip `via ` + `viaLabel`, rótulo em duas linhas (`label` + `unitName`), `physics: false`, sem handlers de clique; testes com `vis-network` mockado verificando nós/arestas/opções entregues
- [ ] 3.7 Exibir a faixa de aviso com `skippedUnits` (nomes, motivo no tooltip) no `CallerGraphView` quando houver; teste de componente com e sem Units não analisadas
- [ ] 3.8 Renderizar `CallerGraphView` para Tabs `kind === 'method'` em `App.svelte`, mantendo-as montadas e ocultas (`visibility: hidden` + `inert`) como as Unit Tabs; teste verificando preservação ao alternar Tabs

## 4. Documentação e verificação final

- [ ] 4.1 Atualizar `CLAUDE.md` (menu `Edição`, Commands, Method Tab, novos canais IPC e componentes) e verificar que não restam menções ao alerta "ainda será implementado"
- [ ] 4.2 Rodar `npm test` e `openspec validate caller-graph-method-tab --strict` sem erros
- [ ] 4.3 Verificação manual com `npm start` num Project Delphi de exemplo: menu desabilitado na Welcome Tab, habilitado na Unit Tab; `Analisando Project…` na primeira vez; Method Tab com Target Method na base, setas para baixo, Entry Point de `.dfm` colorido, self-loop e back-edge tracejado visíveis; reabrir o Project fecha as Method Tabs
