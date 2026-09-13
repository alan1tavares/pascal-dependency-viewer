## Why

O `CONTEXT.md` define o Uses Clause Scope como "escolhido por geração, na
tela de busca/listagem" — mas hoje essa escolha não existe em lugar
nenhum. `selectUsesFromSource(source, scope)` já suporta os dois valores
(`interface` e `interfaceAndImplementation`, entregues pela change
`uses-clause-scope`), porém todo call site (`Menu/index.js`, `index.html`)
chama a função sem o segundo argumento, herdando sempre `interface`. Sem
um controle na tela `rootUnitSelection`, o usuário não tem como pedir a
extração combinada `interface` + `implementation`.

## What Changes

- A tela `rootUnitSelection` (`index.html`) ganha um controle (radio
  buttons) para escolher o Uses Clause Scope — `Interface` (padrão) ou
  `Interface + Implementation` — ao lado do campo de filtro já existente.
- O valor selecionado no momento do clique numa Project Unit é lido e
  repassado para `selectUsesFromSource(source, scope)` em `selectRootUnit`,
  substituindo a chamada atual sem segundo argumento.
- O estado do controle é local à tela (variável em memória no
  `index.html`), não persistido em `electron-store` nem em nenhum outro
  lugar — consistente com "not a persisted global setting" do
  `CONTEXT.md`. Uma nova seleção de Root Unit sempre parte do valor atual
  do controle na tela.
- Fora de escopo nesta change: ligar `expandDependencyGraph` (expansão
  transitiva/DAG) à tela de Root Unit — ela continua renderizando o grafo
  de 1 nível via `mountDependenceGraphStructure`, só que agora esse nível
  único respeita o escopo escolhido. Também fora de escopo: adicionar o
  controle de escopo ao fluxo `File > Open` de um `.pas` avulso — o
  `CONTEXT.md` liga o Uses Clause Scope à tela de busca/listagem de um
  Projeto, não ao fluxo avulso independente de Projeto.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `root-unit-selection`: a tela de busca/listagem passa a oferecer um
  controle de Uses Clause Scope, e o requirement de "seleção de Root Unit
  renderiza seu grafo de dependências direto" passa a usar o escopo
  escolhido nesse controle (em vez de sempre `interface`) ao extrair o
  `uses` da Root Unit.

## Impact

- `index.html`: novo controle (radio buttons) na `#rootUnitSelection`,
  leitura do valor selecionado em `selectRootUnit`, repasse como segundo
  argumento de `selectUsesFromSource`.
- Nenhuma mudança em `src/model` — `selectUsesFromSource` e
  `USES_CLAUSE_SCOPE` já existem e são reaproveitados como estão.
- Nenhuma mudança em `src/components/Main/Menu` — o fluxo `File > Open`
  não é afetado.
