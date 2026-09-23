# Proposal

## Why

A tela de Selecionar Unit (`rootUnitSelection`) usa uma interação diferente
de todas as outras buscas/listagens do app: é uma view full-screen que troca
`display` com o grafo, sem navegação por teclado, sem forma de cancelar, com
filtro só por nome e com um bug latente de listener duplicado.

Esta change nasceu propondo unificá-la com o padrão do overlay `Abrir
recente` da época (overlay flutuante, busca por nome+caminho, teclado
completo, item destacado). Só que, entre a proposta e a implementação, a
change `add-command-palette` absorveu o próprio `Abrir recente` para dentro
de uma Command Palette (`Cmd/Ctrl+P`), que já tem um Command `Selecionar
Unit` na sua lista — hoje esse Command só fecha a paleta e dispara a mesma
tela antiga por fora dela. Continuar mirando o overlay `Abrir recente` (que
não existe mais como tela própria) deixaria a Seleção de Unit inconsistente
com o padrão atual do app. A revisão corrige a mira: a Seleção de Unit
passa a ser um terceiro modo da própria Command Palette, exatamente como
`Abrir recente` já é, reaproveitando a paleta em vez de duplicar sua
estrutura.

## What Changes

- A tela de Selecionar Unit deixa de ser uma view full-screen e deixa de
  ter um overlay próprio: passa a ser um terceiro modo da Command Palette
  (`Selecionar Unit`, ao lado do modo lista de Commands e do modo `Abrir
  recente`), reaproveitando o mesmo overlay/card/lista já usados por ela.
- Cada item da lista passa a exibir o nome da unit em destaque e o caminho
  do arquivo como subtexto secundário, em vez do texto corrido único
  `Nome (caminho)` de hoje — no mesmo padrão visual já usado pelo modo
  `Abrir recente`.
- O filtro passa a buscar por nome da unit **e** por caminho do arquivo
  (hoje busca só pelo nome), case-insensitive.
- Navegação por teclado é adicionada, reaproveitando o mecanismo já
  existente na paleta: `↑`/`↓` movem o destaque com wrap-around, `Enter`
  confirma o item destacado.
- O Command `Selecionar Unit` da paleta deixa de fechar a paleta e disparar
  a tela por fora: passa a trocar a paleta para o modo `Selecionar Unit`
  sem fechá-la, exatamente como o Command `Abrir recente` já faz hoje com o
  modo `Abrir recente`.
- **Entradas e fechamento condicional** — a paleta generaliza o mecanismo
  que já usa para decidir o `Esc` do modo `Abrir recente` (`'palette'` vs.
  `'direct'`), e ganha um novo estado "não-fechável" só usado pela abertura
  automática obrigatória:
  - **Abertura automática, obrigatória** (logo após abrir um `.dpr`, antes
    de qualquer grafo existir para o Projeto): a paleta abre no modo
    `Selecionar Unit`, marcada não-fechável. `Esc`, clique fora do card e os
    atalhos `Cmd/Ctrl+P` e `Cmd/Ctrl+K R` (que hoje trocariam de modo
    incondicionalmente) SHALL não ter efeito algum enquanto não-fechável —
    a escolha de uma Root Unit continua obrigatória, como hoje.
  - **Via o Command `Selecionar Unit` da paleta** (entrada `'palette'`,
    sempre fechável, pois só aparece com um Projeto já aberto e portanto
    algum grafo já existente): `Esc` volta à lista de Commands (com o input
    vazio); clique fora do card fecha a paleta inteira, sem voltar à lista
    de Commands.
  - **Via o menu `Edição > Selecionar Unit`** (entrada `'direct'`, fechável
    quando já existe grafo renderizado): `Esc` e clique fora fecham a
    paleta inteira, revelando o grafo atual intacto — mesmo comportamento
    que o modo `Abrir recente` já tem quando aberto por `Arquivo > Abrir
    recente`/`Cmd/Ctrl+K R`.
- Corrige o bug de listener duplicado ao reabrir a tela (herdado
  gratuitamente por reaproveitar a trava `listenersAttached` já existente
  na paleta).
- A lógica de filtro (nome + caminho) é extraída para um módulo puro em
  `src/domain/`, com testes dedicados, seguindo o mesmo padrão arquitetural
  de `src/domain/recentProjects`.
- O overlay dedicado `#rootUnitOverlay`/`#rootUnitDialog` e o componente
  `src/renderer/components/rootUnitSelection.js` (ambos introduzidos numa
  versão anterior desta mesma change, antes da Command Palette existir) são
  removidos; a lógica de listagem/filtro/seleção é incorporada a
  `commandPalette.js`.

## Capabilities

### New Capabilities
_Nenhuma._ A extração da lógica de filtro para `src/domain/` é um detalhe de
implementação da capability já existente, não uma capability nova.

### Modified Capabilities
- `root-unit-selection`: a requirement "Listagem e busca de Project Units
  para escolha da Root Unit" muda de apresentação (view full-screen →
  modo da Command Palette), de escopo de busca (nome → nome + caminho) e
  ganha navegação por teclado. O requirement de fechamento condicional
  passa a descrever as três origens possíveis (automática/obrigatória,
  Command da paleta, menu) e delega o mecanismo de modo/entrada à
  capability `command-palette`.
- `command-palette`: ganha o novo modo `Selecionar Unit`; o requirement
  "Execução de um Command" muda (`Selecionar Unit` passa a trocar de modo em
  vez de fechar a paleta, igual `Abrir recente`); e ganha o novo estado
  não-fechável, incluindo o efeito (nenhum) de `Cmd/Ctrl+P` e
  `Cmd/Ctrl+K R` enquanto ele estiver ativo.

## Impact

- `src/renderer/components/commandPalette.js`: ganha o modo `Selecionar
  Unit` (listagem, filtro por nome+caminho via `filterProjectUnits`,
  navegação por teclado, seleção que dispara `expandFromRootUnit` e
  `renderGraph`), a generalização de `recentsEntry` para as duas entradas
  possíveis dos dois modos não-Commands, e o novo estado `closable`
  (`Esc`, clique fora e os atalhos que trocam de modo passam a respeitá-lo).
- `src/renderer/components/rootUnitSelection.js`: removido — lógica
  incorporada a `commandPalette.js`.
- `index.html`: remove o markup/CSS do overlay dedicado
  (`#rootUnitOverlay`/`#rootUnitDialog`/`#rootUnitInputRow`/
  `#rootUnitFilter`/`#rootUnitList`) e as classes compartilhadas
  `.overlay`/`.overlay-dialog`/`.overlay-list`/`.overlay-empty` que essa
  versão anterior desta change havia introduzido — sem uso depois da
  fusão com a paleta.
- `src/renderer/index.js`: para de importar/chamar
  `renderRootUnitSelection`; a abertura automática (obrigatória) e a
  reabertura pelo menu passam a chamar funções expostas por
  `commandPalette.js`.
- `src/domain/rootUnitSelection/index.js` e
  `src/domain/test/rootUnitSelection.test.js`: mantidos sem mudança de
  comportamento (a função pura `filterProjectUnits` continua igual,
  independente de quem a consome).
- Sem mudanças em IPC, `main/`, `preload/` ou nos termos do `CONTEXT.md`.
