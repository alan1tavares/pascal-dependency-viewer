# Proposal

## Why

Hoje o app mostra uma única tela de cada vez: a tela de Bem-vindo some de
vez depois do primeiro grafo, e escolher outra Root Unit substitui o grafo
que estava aberto. Isso impede comparar grafos de Root Units diferentes e
obriga a refazer a escolha (e perder zoom, posições e View Filter) para
voltar a um grafo já visto. Abas no estilo do VSCode resolvem as duas
coisas.

## What Changes

- Nova barra de Tabs na área principal da janela, sempre visível, com
  rolagem horizontal e sem limite de Tabs. Só uma Tab fica ativa por vez.
- Ao iniciar o app, só a **Welcome Tab** está aberta. Ela continua aberta
  depois que um Project é carregado, até o usuário fechá-la.
- Escolher uma Root Unit abre uma nova **Graph Tab** no fim da barra e a
  ativa. Se já existe uma Graph Tab para essa Root Unit, ela só é ativada
  (sem recalcular o grafo).
- O título da Graph Tab é o nome da Root Unit e o tooltip mostra o caminho
  do `.pas`. Cada Graph Tab guarda seu próprio View Filter, posições dos
  nós, zoom e enquadramento enquanto estiver aberta.
- Cada Tab tem um botão "x", e `Cmd/Ctrl+W` fecha a Tab ativa. Ao fechar a
  Tab ativa, a usada mais recentemente vira ativa. Fechar a última Tab
  reabre a Welcome Tab. A Welcome Tab não pode ser fechada quando é a
  única aberta (sem "x" e `Cmd/Ctrl+W` não faz nada). `Cmd/Ctrl+W` nunca
  fecha a janela.
- `Ctrl+Tab` / `Ctrl+Shift+Tab` ativam a próxima e a anterior pela posição
  na barra, em ciclo. São só atalhos, sem Command e sem item de menu.
- Novo Command `Bem-vindo` (Command Palette) e novo menu `Ajuda >
  Bem-vindo`, que reabrem a Welcome Tab ou a ativam se já estiver aberta.
- Abrir um Project (diálogo ou `Abrir recente`, mesmo que seja o Project
  já aberto) fecha todas as Graph Tabs.
- **BREAKING (comportamento)**: a tela de Bem-vindo não é mais ocultada
  para sempre depois do primeiro grafo. Ela vira a Welcome Tab.
- **BREAKING (comportamento)**: o modo `Selecionar Unit` aberto
  automaticamente ao carregar um Project deixa de ser não-fechável. `Esc`
  e o clique fora fecham a paleta e o usuário fica na Welcome Tab com o
  Project carregado. O conceito de modo "não-fechável" deixa de existir.
- `Edição > Selecionar Unit` passa a abrir uma nova Graph Tab em vez de
  substituir o grafo exibido.

## Capabilities

### New Capabilities
- `tabs`: barra de Tabs, tipos de Tab (Welcome Tab e Graph Tab), abertura,
  ativação, fechamento, atalhos de teclado e o efeito de abrir um Project
  sobre as Tabs abertas.

### Modified Capabilities
- `welcome-screen`: remove a ocultação definitiva depois do primeiro grafo.
  O conteúdo de boas-vindas passa a ser exibido na Welcome Tab.
- `root-unit-selection`: a abertura automática após carregar um Project
  passa a ser fechável, e escolher uma Root Unit abre (ou ativa) uma Graph
  Tab em vez de substituir o grafo.
- `command-palette`: remove o modo `Selecionar Unit` não-fechável e as
  regras que dependiam dele; adiciona o Command `Bem-vindo` ao catálogo.
- `application-menu`: novo menu `Ajuda` com `Bem-vindo`; `Edição >
  Selecionar Unit` abre uma Graph Tab em vez de substituir o grafo.
- `renderer/app-root`: o App deixa de alternar entre Welcome e GraphView por
  `viewMode` e passa a renderizar a barra de Tabs e o conteúdo de cada Tab.
- `graph-view-filter`: o View Filter passa a ser independente por Graph Tab
  e o painel fica ancorado na área da Graph Tab, não na janela.
- `graph-canvas-layout`: a área do grafo preenche o espaço abaixo da barra
  de Tabs, e não mais a janela inteira.

## Impact

- **Renderer**: `App.svelte` (barra de Tabs, uma `GraphView` por Graph Tab,
  atalhos de teclado), novo componente de barra de Tabs, `GraphView.svelte`
  (recebe o grafo na montagem; painel de filtro deixa de ser `position:
  fixed`), `Welcome.svelte` (deixa de depender de `graphRenderedStore`),
  `CommandPalette.svelte` (sem `closable`; a escolha de Root Unit delega a
  abertura da Graph Tab), novas stores de Tabs; `stores/ui.js` e
  `stores/graph.js` são removidas.
- **Domínio**: novo módulo puro `src/domain/tabs/` com as regras de abrir,
  ativar e fechar Tabs (incluindo a ordem de uso mais recente) e o novo
  Command `showWelcome` em `src/domain/commands/`.
- **Main**: `menu.js` ganha o menu `Ajuda`; `commands.js` ganha o Command
  `showWelcome`, que envia o novo evento `app:show-welcome`; `preload/api.js`
  expõe `onShowWelcome(cb)`.
- **Sem mudança** no main para expandir grafos: `expandFromRootUnit` segue
  stateless; o estado das Tabs vive só no renderer e não é persistido.
- **Docs**: `CONTEXT.md` já tem Tab, Welcome Tab e Graph Tab; o `CLAUDE.md`
  precisa ser atualizado (fluxo de dados e stores). O que ficou fora do
  escopo está em `docs/SUGGESTION.md`.
