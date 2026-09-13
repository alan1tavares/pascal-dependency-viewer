## Context

`index.html` já tem a tela `#rootUnitSelection` com um campo de filtro
(`#rootUnitFilter`) e uma função `selectRootUnit(projectDir, projectUnit,
projectUnits)` que lê o `.pas` da Root Unit e chama
`selectUsesFromSource(source)` sem segundo argumento. `selectUsesFromSource`
já aceita `scope` como segundo parâmetro (`USES_CLAUSE_SCOPE.INTERFACE` ou
`.INTERFACE_AND_IMPLEMENTATION`, exportado por
`src/model/parsePascalSource/index.js`) desde a change `uses-clause-scope` —
essa change deixou explicitamente em aberto "quando/como expor o escopo na
UI... só faz sentido decidir isso junto da UI real que vai hospedar o
controle". Este design decide isso.

Ver `proposal.md` para o porquê e o que fica fora de escopo
(`expandDependencyGraph` e o fluxo `File > Open` não são tocados).

## Goals / Non-Goals

**Goals:**
- Adicionar um controle na tela `#rootUnitSelection` para escolher entre
  os dois valores de `USES_CLAUSE_SCOPE`.
- Repassar o valor escolhido para `selectUsesFromSource` dentro de
  `selectRootUnit`.
- Manter o comportamento 100% inalterado quando o controle está no valor
  padrão (`interface`).

**Non-Goals:**
- Persistir a escolha de escopo entre gerações ou sessões (ver requirement
  em `specs/root-unit-selection/spec.md`).
- Mudar `mountDependenceGraphStructure`, `expandDependencyGraph` ou
  qualquer módulo em `src/model` — nenhum precisa mudar para este wiring.
- Adicionar o controle ao fluxo `File > Open` (`src/components/Main/Menu`).

## Decisions

### 1. Radio buttons nativos, não um `<select>`
Só existem dois valores fixos e nomeados
(`USES_CLAUSE_SCOPE.INTERFACE` / `.INTERFACE_AND_IMPLEMENTATION`), então os
dois ficam visíveis de uma vez sem exigir abrir um dropdown — consistente
com a lista de `<input type="radio">` já ser o padrão mais simples do HTML
para "escolha exclusiva entre poucas opções visíveis". Os `value` dos
radios usam as strings de `USES_CLAUSE_SCOPE` diretamente (`'interface'` /
`'interfaceAndImplementation'`), evitando um segundo vocabulário para
mapear rótulo de UI → valor do model.
_Alternativa considerada_: `<select>` com duas `<option>` — rejeitada por
esconder a opção não selecionada atrás de um clique extra, sem ganho real
com só duas opções.

### 2. Estado lido direto do DOM no momento do clique, sem variável JS paralela
`selectRootUnit` (chamado pelo listener de clique de cada item da lista)
lê o valor do radio marcado via `document.querySelector('input[name=
usesScope]:checked').value` no próprio momento da chamada, em vez de
manter uma variável JS sincronizada por um listener `change` separado.
- **Por quê**: o `index.html` já segue esse padrão para o filtro de texto
  (`renderRootUnitList` lê `filterInput.value` direto, sem cache
  intermediário) — mantém o mesmo estilo do arquivo em vez de introduzir
  uma segunda forma de ler estado de formulário.
- **Alternativa considerada**: guardar o escopo escolhido numa variável de
  módulo atualizada por um listener `change` no grupo de radios — rejeitada
  por adicionar um listener e uma variável só para replicar o que
  `:checked` já responde a qualquer momento.

### 3. `selectUsesFromSource` só recebe o novo argumento; nenhuma mudança no model
`selectRootUnit` passa a chamar `selectUsesFromSource(source, scope)`. Como
`scope` já tem default `USES_CLAUSE_SCOPE.INTERFACE` na assinatura
existente, nenhum outro call site (`Menu/index.js`) precisa mudar — eles
continuam chamando com um argumento só e herdando o mesmo comportamento de
hoje.

### 4. Controle fica sempre visível na tela, não atrás de "opções avançadas"
Os radios ficam entre o campo de filtro e a lista, sempre visíveis
enquanto `#rootUnitSelection` está com `display: block` — mesmo tratamento
do filtro, sem esconder atrás de um menu extra. Simples o suficiente para
não precisar de justificativa maior; a tela já é pequena (filtro + lista).

## Risks / Trade-offs

- [Usuário troca o escopo depois de já ter clicado numa Root Unit e não
  entende por que o grafo não mudou] → Mitigado por design: a tela de
  listagem é abandonada assim que o grafo renderiza (`renderGraph`
  substitui a view), então não há como trocar o escopo "depois" sem
  reabrir o Projeto — não é um estado alcançável, não precisa de aviso.
- [Nome do atributo `name="usesScope"` dos radios colidir com algum outro
  elemento do documento] → Risco nulo: `index.html` não tem nenhum outro
  grupo de input hoje; escopo do `querySelector` já é o documento inteiro,
  sem necessidade de escopar a um container.
