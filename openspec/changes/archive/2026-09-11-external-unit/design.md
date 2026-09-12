## Context

O fluxo de Root Unit (`selectRootUnit` em `index.html`) já tem, no momento em
que monta o grafo, tanto a lista de dependências diretas da unidade
escolhida (`listUses`) quanto a lista de Project Units do `.dpr` aberto
(`projectUnits`, vinda de `parseDprSource`). Isso é suficiente para
classificar cada dependência direta como Project Unit (aparece em
`projectUnits`) ou External Unit (não aparece) — sem precisar da expansão
transitiva do grafo (trilha 2 do `docs/TODO.md`), que fica fora de escopo
aqui.

O fluxo avulso `File > Open` (`src/components/Main/Menu/index.js`) não tem
lista de Project Units — não há `.dpr` aberto — então não há como
classificar nada ali. Ele continua se comportando exatamente como hoje.

## Goals / Non-Goals

**Goals:**
- Classificar cada dependência direta de uma Root Unit como Project Unit
  ou External Unit, comparando contra a lista de Project Units do Projeto
  aberto.
- Diferenciar visualmente, no grafo renderizado (`vis-network`), os nós
  External Unit dos nós Project Unit.
- Manter `mountDependenceGraphStructure` retrocompatível com o uso atual
  do fluxo `File > Open` (sem lista de Project Units).

**Non-Goals:**
- Expansão transitiva do grafo (Dependency Graph completo, DAG, unidade
  visitada uma vez) — trilha 2 do `docs/TODO.md`, spec futura separada.
- Uses Clause Scope (`interface` vs `interface`+`implementation`) — trilha
  3, não afeta este change.
- Classificar/estilizar no fluxo `File > Open` avulso — não há Project
  Units para comparar nesse fluxo.
- Resolver ambiguidade de nomes de unit duplicados entre diretórios
  diferentes — a comparação é só por nome, mesma convenção já usada na
  listagem/busca de Root Unit.

## Decisions

**Nova função pura `classifyExternalUnits(dependencyNames, projectUnits)`
em `src/model`.**
Recebe a lista de nomes de unit de uma cláusula `uses` e a lista de
Project Units (`{ unitName, path }[]`) do Projeto aberto. Retorna, na mesma
ordem de `dependencyNames`, um array `{ unitName, isExternal }` — comparação
case-insensitive (mesma convenção de `id` lowercased já usada em
`mountDependenceGraphStructure`). Alternativa descartada: fazer a
comparação inline dentro de `mountDependenceGraphStructure` — rejeitada
porque mistura classificação (regra de domínio, testável isolada) com
montagem de nós/edges (formato de saída para o `vis-network`).

**`mountDependenceGraphStructure` ganha um terceiro parâmetro opcional
`projectUnits`.**
Quando `projectUnits` é passado (fluxo de Root Unit), cada nó de
dependência recebe um campo `group: 'externalUnit' | 'projectUnit'`
(o nó da unidade principal é sempre `'projectUnit'`, já que é uma Root
Unit escolhida a partir do `.dpr`). Quando omitido (fluxo `File > Open`),
o comportamento e o formato de nó continuam idênticos aos de hoje — sem
campo `group`. Alternativa descartada: sempre exigir `projectUnits` e
quebrar a assinatura — rejeitada porque forçaria o fluxo `File > Open` a
inventar uma lista vazia sem sentido de domínio (lá não existe conceito de
Project Unit).

**Estilo visual via `groups` do `vis-network`, não via `color`/`shape`
por nó.**
`index.html` passa a configurar `options.groups = { projectUnit: {...},
externalUnit: {...} }` no `Network`, deixando o `vis-network` aplicar o
estilo a partir do campo `group` de cada nó. Alternativa descartada:
calcular `color`/`shape` por nó dentro de `mountDependenceGraphStructure` —
rejeitada porque acoplaria o model layer (`src/model`, sem dependência de
Electron/vis, testado em Jest) a detalhes de apresentação do
`vis-network`.

## Risks / Trade-offs

- [Comparação só por nome de unit, sem considerar caminho] → aceito
  conscientemente: mesma limitação já existe na listagem/busca de Root
  Unit (`root-unit-selection`); não piora o estado atual.
- [`mountDependenceGraphStructure` com parâmetro opcional pode passar
  despercebido em code review futuro e ganhar mais parâmetros opcionais
  ad-hoc] → mitigado documentando a decisão aqui e mantendo a função
  pequena; se crescer mais um parâmetro, é sinal de refatorar para um
  objeto de opções.
- [Estilo visual pouco perceptível dependendo da paleta padrão do
  `vis-network`] → mitigado escolhendo um estilo claramente distinto
  (forma e cor) para `externalUnit`, verificado visualmente ao rodar
  `yarn start` antes de fechar a implementação.
