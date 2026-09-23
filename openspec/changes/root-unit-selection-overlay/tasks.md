# Tasks

> A capability `command-palette` já tem sua spec delta nesta change
> (`specs/command-palette/spec.md`), documentando o modo `Selecionar Unit`,
> a mudança em "Execução de um Command" e o estado não-fechável.

## 1. Camada de domínio (`src/domain/`)

- [x] 1.1 Criar `src/domain/rootUnitSelection/index.js` com a função pura
  `filterProjectUnits(projectUnits, text)` (case-insensitive, casando contra
  `unitName` OU `path`), e verificar que o módulo existe e exporta a função
- [x] 1.2 Criar `src/domain/test/rootUnitSelection.test.js` cobrindo os
  cenários da spec delta (filtro por nome, filtro por caminho,
  case-insensitive, texto vazio retorna todas as units) e verificar com
  `npx jest src/domain/test/rootUnitSelection.test.js` que todos passam

## 2. Remoção do overlay dedicado (versão anterior desta change)

- [ ] 2.1 Remover de `index.html` o markup de `#rootUnitOverlay`/
  `#rootUnitDialog`/`#rootUnitInputRow`/`#rootUnitFilter`/`#rootUnitList` e
  o CSS dedicado a eles, incluindo as classes `.overlay`/`.overlay-dialog`/
  `.overlay-list`/`.overlay-list li`/`.overlay-list li.selected`/
  `.overlay-list .secondary`/`.overlay-empty` — verificar com
  `grep -rn "rootUnitOverlay\|rootUnitDialog\|rootUnitFilter\|rootUnitList\|overlay-list\|overlay-dialog" index.html`
  que nada resta
- [ ] 2.2 Remover `src/renderer/components/rootUnitSelection.js` — verificar
  com `grep -rn "rootUnitSelection" src/` que nenhum outro arquivo o importa
  mais (fora deste próprio `openspec/changes/`)

## 3. Modo `Selecionar Unit` em `commandPalette.js`

- [ ] 3.1 Adicionar `ROOT_UNIT_MODE` ao lado de `COMMANDS_MODE`/
  `RECENTS_MODE`, com estado module-level para as `projectUnits`/
  `projectDir` do modo, e usar `filterProjectUnits` (item 1.1) em
  `applyFilter` quando `mode === ROOT_UNIT_MODE` — verificar que o módulo
  importa `filterProjectUnits` de `../../domain/rootUnitSelection/index.js`
- [ ] 3.2 Renderizar cada item do modo `Selecionar Unit` com o nome da unit
  em destaque e o caminho como `<span class="recentDir">` subtexto,
  reaproveitando a mesma estrutura de `renderRecentItem` — verificar
  visualmente que o caminho aparece como subtexto abaixo do nome, igual ao
  modo `Abrir recente`
- [ ] 3.3 Implementar a confirmação de um item do modo `Selecionar Unit`
  (clique ou `Enter`): chamar `api.expandFromRootUnit({ projectDir,
  projectUnit, projectUnits })`, depois `renderGraph(...)`, notificar quem
  chamou que uma seleção ocorreu (para marcar
  `hasRenderedGraphForCurrentProject`) e fechar a paleta — verificar com
  teste manual que escolher uma unit (clique ou Enter) exibe o grafo e
  fecha a paleta
- [ ] 3.4 Generalizar `recentsEntry` para `modeEntry` (`'palette'` |
  `'direct'`), usado tanto pelo modo `Abrir recente` quanto pelo modo
  `Selecionar Unit`, sem mudar o comportamento hoje existente de `Abrir
  recente` — verificar rodando os testes/cenários já existentes do modo
  `Abrir recente` (nenhuma regressão)
- [ ] 3.5 Adicionar estado module-level `closable` (booleano, `true` por
  padrão); `leaveOnEscape`, o `mousedown` do overlay (clique fora),
  `showCommandPalette()` (`Cmd/Ctrl+P`) e `showOpenRecent()`
  (`Cmd/Ctrl+K R`) passam a checar `closable` e não terem efeito algum
  quando ele for `false` — verificar com teste manual: com a paleta no
  modo `Selecionar Unit` obrigatório (`closable: false`), `Esc`, clique
  fora, `Cmd/Ctrl+P` e `Cmd/Ctrl+K R` não têm nenhum efeito
- [ ] 3.6 Expor uma função (ex.: `enterRootUnitMode(projectUnits,
  projectDir, { entry, closable, onRootUnitSelected })`) para abrir o modo
  `Selecionar Unit` programaticamente, e alterar `executeCommand` para que
  o Command `Selecionar Unit` chame essa função com `entry: 'palette'` e
  `closable: true` em vez de fechar a paleta e disparar `api.runCommand`
  — verificar que escolher `Selecionar Unit` na lista de Commands troca de
  modo sem fechar a paleta, igual ao Command `Abrir recente`

## 4. Entradas automática e via menu em `src/renderer/index.js`

- [ ] 4.1 Remover o import e o uso de `renderRootUnitSelection`
  (`./components/rootUnitSelection.js`)
- [ ] 4.2 Em `onProjectLoaded`, resetar
  `hasRenderedGraphForCurrentProject = false` e chamar `enterRootUnitMode`
  (item 3.6) com `entry: 'direct'` e `closable: false` — verificar lendo o
  diff e confirmando que todo `app:project-loaded` reabre no modo
  `Selecionar Unit` não-fechável
- [ ] 4.3 Em `onShowRootUnitSelection` (evento disparado pelo menu `Edição >
  Selecionar Unit`), chamar `enterRootUnitMode` com `entry: 'direct'` e
  `closable: hasRenderedGraphForCurrentProject` — verificar com o teste
  manual do item 5.2
- [ ] 4.4 Implementar o callback `onRootUnitSelected` passado a
  `enterRootUnitMode` setando `hasRenderedGraphForCurrentProject = true` —
  verificar com o teste manual do item 5.2 (a reabertura após selecionar
  uma unit já permite fechar com `Esc`/clique fora)

## 5. Regressão e testes

- [ ] 5.1 Rodar `npm test` e confirmar que toda a suíte passa, incluindo os
  testes de `src/domain/test/rootUnitSelection.test.js` e os testes já
  existentes do modo `Abrir recente` (sem regressão na generalização do
  item 3.4)
- [ ] 5.2 Rodar `npm start` e validar manualmente o fluxo completo: abrir
  `.dpr` → modo `Selecionar Unit` obrigatório (sem `Esc`/clique-fora/
  `Cmd+P`/`Cmd+K R`) → escolher uma unit → grafo aparece → abrir a paleta
  (`Cmd/Ctrl+P`) e executar `Selecionar Unit` → filtrar por nome e por
  caminho → navegar com teclado (setas + Enter) → `Esc` volta à lista de
  Commands → reabrir `Selecionar Unit` pela paleta e fechar clicando fora
  (fecha tudo) → reabrir via `Edição > Selecionar Unit` e fechar com `Esc`
  e com clique fora (fecha tudo nos dois casos) → grafo permanece o mesmo
  em todos os fechamentos sem seleção
