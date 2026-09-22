# Design

## Context

Ver `proposal.md - Why`. Hoje `renderRootUnitSelection` (em
`src/renderer/components/rootUnitSelection.js`) e `showOpenRecentDialog`
(em `src/renderer/components/openRecentDialog.js`) resolvem o mesmo
problema de UX — buscar e escolher um item numa lista — de duas formas
distintas: uma view full-screen sem teclado nem cancelamento, e um overlay
completo com backdrop, teclado e trava de listener único. `src/renderer/index.js`
é o único módulo que já rastreia o ciclo de vida de um Projeto: guarda
`lastProject` em `onProjectLoaded` e reexibe a Seleção de Unit em
`onShowRootUnitSelection`. Nenhum desses dois listeners hoje sabe se um
grafo já foi renderizado para o Projeto atual — essa informação só existe
implicitamente no `display` do `#mynetwork`.

## Goals / Non-Goals

**Goals:**
- Unificar a apresentação e interação da Seleção de Unit com o padrão já
  estabelecido pelo Abrir recente (overlay, filtro, teclado).
- Introduzir, de forma explícita e testável, o conceito de "overlay
  fechável" vs. "overlay obrigatório", sem depender de inspecionar o DOM
  do grafo para decidir isso.
- Extrair a lógica de filtro para `src/domain/`, com testes, sem alterar o
  formato de dados de `projectUnit` (`{ unitName, path }`) já usado hoje.

**Non-Goals:**
- Mudar o que é uma Root Unit, Project Unit ou como o grafo é expandido —
  nenhum termo de `CONTEXT.md` muda.
- Adicionar um atalho de teclado tipo `Cmd/Ctrl+K` para abrir a Seleção de
  Unit — ela continua acionada só pelo menu `Edição > Selecionar Unit` (e,
  automaticamente, ao carregar um Projeto).
- Unificar os dois overlays num único componente genérico reutilizável —
  cada um continua sendo seu próprio módulo, só compartilhando estilo.

## Decisions

### Rastrear "existe grafo renderizado?" como estado explícito em `src/renderer/index.js`, não inferido do DOM
`src/renderer/index.js` passa a manter `let hasRenderedGraphForCurrentProject
= false`, resetado para `false` em todo `onProjectLoaded` (novo Projeto =
nenhum grafo ainda) e virado `true` via um callback que
`rootUnitSelection.js` invoca depois de uma seleção bem-sucedida. Esse
booleano é passado para `renderRootUnitSelection` como uma opção explícita
(ex.: `{ closable }`), e é essa opção — não o evento que disparou a
renderização (`onProjectLoaded` vs. `onShowRootUnitSelection`) — que decide
se `Esc`/clique-fora têm efeito.

**Alternativa considerada**: inferir a partir do `display` atual de
`#mynetwork`. Rejeitada por acoplar a decisão de fechamento a um detalhe de
apresentação do `graphView.js`, e por já existir uma janela em que o menu
`Edição > Selecionar Unit` pode ser clicado enquanto o overlay obrigatório
da primeira abertura ainda está visível (o menu nativo funciona independente
do foco da página) — nesse caso o `display` de `#mynetwork` e o disparo por
`onShowRootUnitSelection` divergem do que a spec exige, então só um estado
explícito por Projeto resolve corretamente todos os casos.

### Extrair o filtro para `src/domain/rootUnitSelection/index.js`
Nova função pura `filterProjectUnits(projectUnits, text)`, testada em
`src/domain/test/rootUnitSelection.test.js`, espelhando
`filterRecentProjects` de `src/domain/recentProjects/index.js`. Diferente de
`recentProjects`, não é necessária uma função `describe*` — `projectUnit` já
chega com `{ unitName, path }` prontos, sem necessidade de separar nome e
diretório a partir de uma string de caminho única.

### Compartilhar CSS entre os dois overlays via classes, não duplicar por ID
O overlay de Seleção de Unit ganha sua própria estrutura (`#rootUnitOverlay`
/ `#rootUnitDialog`, distintos de `#openRecentOverlay`/`#openRecentDialog`),
mas a aparência comum (backdrop, card, sombra, item de lista, texto
secundário) é movida para classes CSS compartilhadas (ex.: `.overlay`,
`.overlay-dialog`, `.overlay-list li`, `.overlay-list .secondary`) em vez de
duplicar as mesmas regras sob dois prefixos de ID.

**Alternativa considerada**: duplicar o bloco de CSS existente do Abrir
recente sob novos IDs. Mais simples de revisar como diff isolado, mas
duplica ~70 linhas de CSS e arrisca as duas telas divergirem visualmente ao
longo do tempo sem que isso seja notado — rejeitada por contrariar o
objetivo do próprio pedido (mesmo estilo).

### Elemento do overlay permanece sempre no DOM, alternando `display`
Segue o padrão já usado por `#openRecentOverlay` e pelo próprio
`#rootUnitSelection` hoje: o markup do overlay fica fixo em `index.html`, e
`display: none`/`block` controla a visibilidade — sem criar/destruir nós
dinamicamente.

## Risks / Trade-offs

- [Fechamento condicional pode confundir quem não entende por que `Esc`
  funciona só às vezes] → Mitigação: comportamento decidido deliberadamente
  com o usuário (ver decisão acima); a primeira abertura mantém exatamente
  o comportamento já existente (obrigatório), então nada regride — só a
  reabertura ganha uma forma nova de cancelar. Registrar como ADR para
  documentar o porquê no código.
- [Classes CSS compartilhadas entre os dois overlays podem acoplar
  indevidamente sua evolução futura] → Mitigação: manter IDs de topo
  distintos por overlay para que overrides específicos continuem possíveis;
  só o visual comum vira classe compartilhada.
- [Lógica de filtro extraída para `src/domain/` pode divergir do
  comportamento antigo embutido no componente] → Mitigação: cobrir
  `filterProjectUnits` com testes que espelham os cenários da spec delta
  (nome, caminho, case-insensitive) antes de religar ao componente.

## Migration Plan

Mudança é só de UI/renderer, sem dado persistido, sem IPC novo e sem
migração de estado entre versões — um único PR substitui
`rootUnitSelection.js` e o markup/CSS relacionado em `index.html`. Rollback
é reverter o PR.
