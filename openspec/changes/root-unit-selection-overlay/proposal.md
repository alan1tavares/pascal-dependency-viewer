# Proposal

## Why

A tela de Selecionar Unit (`rootUnitSelection`) usa uma interação diferente
de todas as outras buscas/listagens do app: é uma view full-screen que troca
`display` com o grafo, sem navegação por teclado, sem forma de cancelar, com
filtro só por nome e com um bug latente de listener duplicado. O overlay
`Abrir recente`, adicionado depois, já estabeleceu o padrão de interação de
"buscar e escolher um item" do app (overlay flutuante, busca por
nome+caminho, teclado completo, item destacado). Unificar a Seleção de Unit
nesse mesmo padrão remove a inconsistência de UX entre as duas telas mais
parecidas do app e corrige o bug de listener no processo.

## What Changes

- A tela de Selecionar Unit deixa de ser uma view full-screen (troca de
  `display` com `#mynetwork`) e passa a ser um overlay flutuante com
  backdrop, estruturalmente igual ao `Abrir recente` (card centralizado,
  sombra, borda).
- Cada item da lista passa a exibir o nome da unit em destaque e o caminho
  do arquivo como subtexto secundário, em vez do texto corrido único
  `Nome (caminho)` de hoje.
- O filtro passa a buscar por nome da unit **e** por caminho do arquivo
  (hoje busca só pelo nome), case-insensitive.
- Navegação por teclado é adicionada: `↑`/`↓` movem o destaque com
  wrap-around, `Enter` confirma o item destacado, e o item destacado ganha
  indicação visual.
- **BREAKING** (comportamento, não API): fechar sem selecionar passa a ser
  possível via `Esc` ou clique fora do card, mas só quando a tela já existe
  um grafo renderizado por trás (reabertura via `Edição > Selecionar Unit`)
  — nesse caso o grafo atual permanece intacto. Na primeira exibição
  automática, logo após abrir um `.dpr` (quando ainda não existe grafo
  nenhum), `Esc`/clique fora continuam sem efeito: a escolha de uma Root
  Unit continua obrigatória, como hoje.
- Corrige o bug de listener duplicado: cada chamada a
  `renderRootUnitSelection` reanexa um novo listener de `input` ao mesmo
  campo, já que não há nenhuma trava equivalente ao `listenersAttached` do
  `Abrir recente`.
- A lógica de filtro (nome + caminho) é extraída para um módulo puro em
  `src/domain/`, com testes dedicados, seguindo o mesmo padrão arquitetural
  de `src/domain/recentProjects`.

## Capabilities

### New Capabilities
_Nenhuma._ A extração da lógica de filtro para `src/domain/` é um detalhe de
implementação da capability já existente, não uma capability nova.

### Modified Capabilities
- `root-unit-selection`: a requirement "Listagem e busca de Project Units
  para escolha da Root Unit" muda de apresentação (view full-screen →
  overlay), de escopo de busca (nome → nome + caminho) e ganha navegação e
  fechamento por teclado condicionados à existência de um grafo já
  renderizado.

## Impact

- `src/renderer/components/rootUnitSelection.js`: reescrito para o padrão de
  overlay, com navegação por teclado, trava de listener único e lógica de
  fechamento condicional.
- `index.html`: novo markup/CSS do overlay de Seleção de Unit, espelhando a
  estrutura de `#openRecentOverlay`/`#openRecentDialog`.
- `src/renderer/index.js`: precisa saber se já existe um grafo renderizado
  no momento em que a Seleção de Unit é (re)exibida, para decidir se
  `Esc`/clique-fora ficam habilitados.
- Novo módulo em `src/domain/` (nome a definir no design) com as funções
  puras de filtro, mais seus testes em `src/domain/test/`.
- Sem mudanças em IPC, `main/`, `preload/` ou nos termos do `CONTEXT.md`.
