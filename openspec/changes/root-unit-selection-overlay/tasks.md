# Tasks

## 1. Camada de domínio (`src/domain/`)

- [ ] 1.1 Criar `src/domain/rootUnitSelection/index.js` com a função pura
  `filterProjectUnits(projectUnits, text)` (case-insensitive, casando contra
  `unitName` OU `path`), e verificar que o módulo existe e exporta a função
- [ ] 1.2 Criar `src/domain/test/rootUnitSelection.test.js` cobrindo os
  cenários da spec delta (filtro por nome, filtro por caminho,
  case-insensitive, texto vazio retorna todas as units) e verificar com
  `npx jest src/domain/test/rootUnitSelection.test.js` que todos passam

## 2. Markup e CSS compartilhados do overlay (`index.html`)

- [ ] 2.1 Extrair as regras de `#openRecentOverlay`/`#openRecentDialog`/
  `#openRecentList`/`.recentDir`/`#openRecentEmpty` em `index.html` para
  classes reutilizáveis (`.overlay`, `.overlay-dialog`, `.overlay-list`,
  `.overlay-list li`, `.overlay-list li.selected`, `.overlay-list
  .secondary`, `.overlay-empty`), aplicadas via `class` nos elementos
  existentes do Abrir recente, mantendo os IDs atuais e o resultado visual
  idêntico — verificar rodando `npm start` e conferindo que o Abrir recente
  continua com a mesma aparência de antes
- [ ] 2.2 Substituir o markup de `#rootUnitSelection` por um overlay
  `#rootUnitOverlay`/`#rootUnitDialog` usando as classes compartilhadas do
  item 2.1, com um `input` de busca e `<ul id="rootUnitList">`, e remover do
  CSS o estilo full-screen antigo de `#rootUnitSelection`
  (`width/height: 100%`) — verificar que nenhum seletor CSS em `index.html`
  referencia mais `#rootUnitSelection`

## 3. Componente `rootUnitSelection.js`

- [ ] 3.1 Reescrever `renderRootUnitSelection(projectUnits, projectDir,
  { closable, onRootUnitSelected })` para abrir o novo overlay (`display:
  block` em `#rootUnitOverlay`) em vez de esconder `#mynetwork`, usando
  `filterProjectUnits` (item 1.1) para o filtro — verificar abrindo um
  `.dpr` de teste com `npm start` e conferindo que a lista de Project Units
  aparece como overlay sobre a tela
- [ ] 3.2 Renderizar cada item da lista como duas linhas (nome em destaque +
  `<span class="secondary">` com o caminho do arquivo), reaproveitando a
  estrutura usada por `renderList` em `openRecentDialog.js:29-49` — verificar
  visualmente que o caminho aparece como subtexto abaixo do nome
- [ ] 3.3 Adicionar navegação por teclado no campo de busca
  (`ArrowUp`/`ArrowDown` movendo o destaque com wrap-around, `Enter`
  confirmando o item destacado como Root Unit) e a classe `selected` +
  `scrollIntoView({ block: 'nearest' })`, seguindo o mesmo padrão de
  `moveSelection`/`renderList` de `openRecentDialog.js:57-61` — verificar
  navegando com as setas em `npm start` e confirmando a seleção com Enter
- [ ] 3.4 Adicionar uma trava `listenersAttached` (mesmo padrão de
  `attachListeners` em `openRecentDialog.js:63-87`) para que
  `renderRootUnitSelection` nunca reanexe um segundo listener de
  `input`/`keydown` ao reabrir a tela — verificar reabrindo a Seleção de
  Unit várias vezes via `Edição > Selecionar Unit` e confirmando que o
  filtro e a navegação por teclado continuam respondendo uma única vez por
  tecla (sem efeito duplicado)
- [ ] 3.5 Implementar o fechamento condicional: `Esc` e o clique fora do
  card (`mousedown` no overlay quando `event.target === overlay()`, como em
  `openRecentDialog.js:84-86`) só fecham o overlay quando a opção
  `closable` recebida for `true`; quando `false`, o evento é ignorado e o
  overlay permanece aberto — verificar com teste manual: abrir um `.dpr`
  pela primeira vez e confirmar que `Esc` e o clique fora não têm efeito;
  depois escolher uma unit, reabrir via `Edição > Selecionar Unit` e
  confirmar que `Esc` e o clique fora agora fecham o overlay mantendo o
  grafo atual
- [ ] 3.6 Em `selectRootUnit`, invocar `onRootUnitSelected?.()` logo depois
  de `renderGraph(...)`, para notificar quem chamou que uma Root Unit foi
  escolhida com sucesso — verificar com teste manual que escolher uma unit
  na lista (clique ou Enter) dispara o callback recebido em
  `renderRootUnitSelection`

## 4. Estado por Projeto em `src/renderer/index.js`

- [ ] 4.1 Adicionar `let hasRenderedGraphForCurrentProject = false`,
  resetada para `false` dentro de `onProjectLoaded` antes de chamar
  `renderRootUnitSelection(project.projectUnits, project.projectDir, {
  closable: false, onRootUnitSelected })` — verificar lendo o diff e
  confirmando que todo `app:project-loaded` reseta o estado antes de
  reabrir a seleção
- [ ] 4.2 Em `onShowRootUnitSelection`, passar `{ closable:
  hasRenderedGraphForCurrentProject, onRootUnitSelected }` para
  `renderRootUnitSelection` — verificar com o teste manual do item 3.5
- [ ] 4.3 Implementar `onRootUnitSelected` em `index.js` setando
  `hasRenderedGraphForCurrentProject = true` — verificar com o teste manual
  do item 3.5 (a reabertura após selecionar uma unit já permite fechar com
  `Esc`)

## 5. Regressão e testes

- [ ] 5.1 Rodar `npm test` e confirmar que toda a suíte passa, incluindo os
  novos testes de `src/domain/test/rootUnitSelection.test.js`
- [ ] 5.2 Rodar `npm start` e validar manualmente o fluxo completo: abrir
  `.dpr` → seleção obrigatória (sem `Esc`/clique-fora) → escolher uma unit
  → grafo aparece → reabrir via `Edição > Selecionar Unit` → filtrar por
  nome e por caminho → navegar com teclado (setas + Enter) → fechar com
  `Esc` e com clique fora → grafo permanece o mesmo em ambos os casos
