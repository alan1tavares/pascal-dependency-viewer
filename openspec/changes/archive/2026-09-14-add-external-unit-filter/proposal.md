## Why

O grafo mistura, sem distinção de visibilidade, as Project Units do
projeto com as External Units (RTL/VCL, FireDAC, bibliotecas de
terceiros — qualquer `uses` fora do `.dpr`). Em projetos Delphi reais
essas units externas costumam ser numerosas e poluem o grafo quando o
que interessa é entender as dependências entre as próprias Project
Units. O View Filter já resolve um problema parecido para Uses Clause
Origin; falta um eixo equivalente para a visibilidade de External Units.

## What Changes

- Adiciona um terceiro checkbox, "Unidades Externas", ao painel
  flutuante de View Filter, ao lado de "Interface" e "Implementação".
- Esse checkbox começa **desmarcado**: ao abrir o grafo pela primeira
  vez, todo node `externalUnit` (e toda aresta que aponta para um) já
  vem oculto. **BREAKING**: muda o comportamento atual, em que o grafo
  abre mostrando todas as units, incluindo externas.
- Marcar o checkbox reexibe as External Units e as arestas que apontam
  para elas, sujeitas ao filtro de Uses Clause Origin já em vigor.
- Esse novo eixo é independente do de Uses Clause Origin: a aresta só
  fica visível quando os dois filtros permitem (origem marcada E, se o
  destino for External Unit, o checkbox de Unidades Externas marcado).
- Diferente de Interface/Implementação, o checkbox de Unidades Externas
  **não** tem trava de "pelo menos um marcado" — pode ficar desmarcado
  sozinho sem restrição.

## Capabilities

### New Capabilities

(nenhuma — o conceito de External Unit já existe em
`external-unit-classification`; esta mudança só estende a capacidade de
filtragem existente)

### Modified Capabilities

- `graph-view-filter`: adiciona o eixo de External Unit visibility ao
  View Filter — novo checkbox, estado inicial desmarcado, sem trava de
  mínimo, e combinação com o filtro de Uses Clause Origin na visibilidade
  final de arestas e nodes.

## Impact

- `index.html`: markup do `#viewFilterPanel` ganha um terceiro
  `<label>`/`<input type="checkbox">`.
- `src/renderer/components/graphView.js` (`setUpViewFilter`): a função
  de visibilidade de arestas passa a considerar também o `group` do node
  de destino; `handleCheckboxChange` mantém a trava de mínimo só para
  Interface/Implementação.
- `CONTEXT.md`: definição de **View Filter** já atualizada nesta sessão
  para descrever os dois eixos independentes.
- Sem mudança em `src/domain/**` — o dado (`group: 'externalUnit'`) já é
  calculado por `expandDependencyGraph`/`classifyExternalUnits`.
