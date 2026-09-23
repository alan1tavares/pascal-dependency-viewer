# Design

## Context

Ver `proposal.md - Why`. Esta change foi originalmente desenhada mirando o
overlay `Abrir recente` como referência de padrão de UX. Nesse meio-tempo, a
change `add-command-palette` (já arquivada) absorveu esse overlay para
dentro de uma Command Palette (`src/renderer/components/commandPalette.js`,
`Cmd/Ctrl+P`) com dois modos — lista de Commands e `Abrir recente` — e um
Command `Selecionar Unit` que hoje só fecha a paleta e dispara a tela antiga
de Seleção de Unit por fora dela.

`commandPalette.js` já resolve exatamente o problema que motivou esta
change (busca, filtro, teclado, item destacado, trava de listener único) e
já tem um mecanismo de "como cheguei neste modo decide o que `Esc` faz"
(`recentsEntry: 'palette' | 'direct'`). Reescrever a Seleção de Unit como um
overlay próprio, como a versão anterior deste design fazia, duplicaria essa
estrutura em vez de reaproveitá-la, e deixaria duas formas de fechar/navegar
por teclado no app em vez de uma. A revisão troca a referência de padrão:
em vez de "espelhar o extinto overlay `Abrir recente`", a Seleção de Unit
passa a ser um terceiro modo da própria Command Palette.

`src/renderer/index.js` continua sendo o único módulo que rastreia o ciclo
de vida de um Projeto (`lastProject`, e agora também se já existe grafo
renderizado para ele).

## Goals / Non-Goals

**Goals:**
- Unificar a apresentação e interação da Seleção de Unit com o padrão
  atual do app: um modo da Command Palette, não um overlay próprio.
- Generalizar o mecanismo de entrada (`'palette'`/`'direct'`) que a paleta
  já usa para `Abrir recente`, em vez de inventar um mecanismo paralelo.
- Introduzir, de forma explícita e testável, um estado "paleta não
  fechável", usado só pela abertura automática obrigatória da Seleção de
  Unit — sem depender de inspecionar o DOM do grafo para decidir isso.
- Extrair a lógica de filtro para `src/domain/`, com testes, sem alterar o
  formato de dados de `projectUnit` (`{ unitName, path }`) já usado hoje.

**Non-Goals:**
- Mudar o que é uma Root Unit, Project Unit ou como o grafo é expandido —
  nenhum termo de `CONTEXT.md` muda.
- Adicionar um atalho de teclado dedicado (tipo `Cmd/Ctrl+K`) para abrir a
  Seleção de Unit diretamente — ela continua acionada só pelo menu
  `Edição > Selecionar Unit`, pelo Command da paleta e, automaticamente, ao
  carregar um Projeto.
- Redesenhar `expandFromRootUnit`/`graphView.js` — só a apresentação da
  lista/busca muda, a expansão e renderização do grafo continuam as mesmas.

## Decisions

### Incorporar a Seleção de Unit a `commandPalette.js` como um terceiro modo, em vez de um overlay próprio
`commandPalette.js` ganha `ROOT_UNIT_MODE`, ao lado de `COMMANDS_MODE` e
`RECENTS_MODE`, reaproveitando o mesmo `#commandPaletteOverlay`/
`#commandPaletteDialog`/`#commandPaletteInputRow`/`#commandPaletteInput`/
`#commandPaletteList`/`#commandPaletteEmpty` já existentes — sem markup ou
CSS novos em `index.html`. `renderList`/`moveSelection`/`confirmSelection`
já são agnósticos de modo (despacham por `mode` para uma função de render de
item); ganham um terceiro caso que usa `filterProjectUnits` (item de
domínio abaixo) e renderiza cada item como nome em destaque + caminho como
subtexto (reaproveitando a mesma estrutura de item de duas linhas que
`renderRecentItem` já usa para nome do arquivo + diretório).

`src/renderer/components/rootUnitSelection.js` e o markup/CSS dedicado que
uma versão anterior deste design introduziu em `index.html`
(`#rootUnitOverlay` e as classes `.overlay`/`.overlay-dialog`/
`.overlay-list`/`.overlay-empty`) são removidos — ficariam sem nenhum uso
depois da fusão.

**Alternativa considerada (a versão anterior deste design)**: manter a
Seleção de Unit como overlay próprio, só compartilhando classes CSS com o
que então era o overlay `Abrir recente`. Válida enquanto os dois eram
overlays irmãos e independentes; deixou de fazer sentido quando `Abrir
recente` virou um modo interno da paleta — nesse ponto, duplicar
overlay/teclado/trava-de-listener ao lado da paleta contraria o próprio
objetivo de unificar UX que motivou a change desde o início.

### Generalizar `recentsEntry` em `modeEntry`, e adicionar `closable`
A trava que hoje decide o `Esc` do modo `Abrir recente` (`recentsEntry:
'palette' | 'direct'`) generaliza para qualquer modo que não seja
`COMMANDS_MODE` (`modeEntry`). Fica um novo estado module-level `closable`
(booleano, `true` por padrão), consultado tanto por `Esc` quanto pelo
`mousedown` no overlay (clique fora) e pelos atalhos que trocam de modo
(`Cmd/Ctrl+P`, `Cmd/Ctrl+K R`) — todos viram no-op enquanto `closable` for
`false`. Só a entrada automática/obrigatória da Seleção de Unit passa
`closable: false`; toda entrada de `Abrir recente` e as demais entradas da
Seleção de Unit continuam com `closable: true` (comportamento inalterado
para elas).

Com `closable: true`: `Esc` volta ao modo lista de Commands quando
`modeEntry === 'palette'`, ou fecha a paleta inteira quando `modeEntry ===
'direct'` (comportamento de `Abrir recente` hoje, sem mudança). O clique
fora do card, em qualquer modo e qualquer entrada, sempre fecha a paleta
inteira sem voltar à lista de Commands — comportamento também já existente,
agora só também condicionado a `closable`.

`hasRenderedGraphForCurrentProject` (rastreado por Projeto, resetado a
`false` em todo `app:project-loaded` e virado `true` após uma seleção bem-
sucedida) decide, em cada entrada na Seleção de Unit, o valor de `closable`
passado: `false` só na abertura automática que acontece antes de qualquer
seleção nessa sessão de Projeto; `true` em todas as reaberturas (menu ou
Command da paleta), já que essas só ficam disponíveis depois de existir um
Projeto carregado — e, na prática, depois de pelo menos a primeira escolha
obrigatória já ter acontecido.

**Alternativa considerada**: manter dois mecanismos separados — um
`closable` só para a Seleção de Unit (como a versão anterior deste design
propunha) e o `recentsEntry` de hoje só para `Abrir recente`. Rejeitada por
duplicar a mesma decisão (o que `Esc`/clique-fora fazem) em dois lugares do
mesmo módulo, com um deles sem cobrir o caso "não-fechável" que só a
Seleção de Unit precisa — generalizar um único mecanismo é mais barato de
manter correto que sincronizar dois.

### Bloquear os atalhos que trocam de modo enquanto não-fechável
Hoje `showCommandPalette()` (`Cmd/Ctrl+P`) e `showOpenRecent()`
(`Cmd/Ctrl+K R`) trocam de modo incondicionalmente, mesmo com a paleta já
aberta — inclusive, antes desta revisão, enquanto ela estivesse na Seleção
de Unit obrigatória. Isso abriria uma forma de escapar da escolha
obrigatória de Root Unit sem selecionar nada (trocar para `Abrir recente` e
abrir outro Projeto, ou simplesmente voltar à lista de Commands). Os dois
passam a checar `closable` e não terem efeito algum enquanto ele for
`false`, fechando essa brecha.

**Risco pré-existente que esta decisão também cobre**: antes desta
revisão, a Seleção de Unit obrigatória era um overlay próprio
(`#rootUnitOverlay`) fisicamente separado da paleta (`#commandPaletteOverlay`)
— nada impedia `Cmd/Ctrl+P` de abrir a paleta por cima do overlay
obrigatório (dois elementos de overlay simultâneos, ambos `z-index: 100`).
Unificar os dois em um único modo dentro do mesmo componente torna esse
gap explícito e o corrige como parte da mesma mudança, em vez de deixá-lo
como uma pendência separada.

### Extrair o filtro para `src/domain/rootUnitSelection/index.js`
Sem mudança em relação à versão anterior deste design: `filterProjectUnits
(projectUnits, text)`, testada em `src/domain/test/rootUnitSelection.test.js`,
espelhando `filterRecentProjects` de `src/domain/recentProjects/index.js`.

## Risks / Trade-offs

- [Fundir a Seleção de Unit em `commandPalette.js` aumenta o acoplamento
  entre as capabilities `root-unit-selection` e `command-palette` — hoje
  eram independentes] → Mitigação: a capability `root-unit-selection`
  continua dona do *conteúdo* (quais Project Units existem, o que acontece
  ao escolher uma), só a *apresentação* passa a viver na capability
  `command-palette`; a fusão é análoga à que já existe entre
  `command-palette` e `recent-projects` hoje (o modo `Abrir recente` já
  cruza essas duas capabilities do mesmo jeito), então não é um padrão
  novo no código, só reaplicado.
- [Reverter/refazer trabalho já implementado numa versão anterior desta
  change (overlay dedicado, componente próprio)] → Mitigação: o módulo de
  domínio (`filterProjectUnits`) e seus testes são reaproveitados sem
  mudança; o custo fica concentrado no componente de apresentação e no
  markup, que são a parte que ficou desatualizada pela mudança upstream.
- [Fechamento condicional pode confundir quem não entende por que `Esc`
  funciona só às vezes, ou por que `Esc` e clique-fora às vezes divergem]
  → Mitigação: replica exatamente o mecanismo já existente e já em
  produção para `Abrir recente` (mesma assimetria `Esc`/clique-fora,
  mesmo `modeEntry`), então não introduz um padrão novo de aprender — só
  estende um já validado a um segundo modo.
- [A capability `command-palette` ganha requirements modificados e um modo
  novo nesta change, ao lado de `root-unit-selection`] → Coberto por
  `specs/command-palette/spec.md` nesta change, mantendo as duas specs
  coerentes entre si antes de `tasks.md` pedir a implementação.

## Migration Plan

Mudança é só de UI/renderer, sem dado persistido, sem IPC novo e sem
migração de estado entre versões. Como parte do trabalho já implementado
numa versão anterior desta change precisa ser desfeito (overlay dedicado) e
refeito dentro de `commandPalette.js`, o PR desta revisão troca: remove
`rootUnitSelection.js` e o markup/CSS dedicado em `index.html`, e edita
`commandPalette.js`/`index.js`. Rollback é reverter o PR.
