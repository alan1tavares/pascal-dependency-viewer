## Context

Ver `proposal.md` - Why. Dois pontos de código já existem e estão testados
isoladamente, faltando só a ligação entre eles:

- `expandDependencyGraph(rootUnitName, projectUnits, readFile)` — expansão
  recursiva pura, sem `scope`, nunca chamada por `index.html`.
- `index.html` (`selectRootUnit`) — já lê o controle de Uses Clause Scope
  do DOM e resolve caminhos via `path.resolve(projectDir, ...)`, mas passa
  esse trabalho para `mountDependenceGraphStructure` (1 nível).

## Goals / Non-Goals

**Goals:**
- Trocar a chamada em `selectRootUnit` para usar `expandDependencyGraph`.
- Repassar o `scope` lido do controle da tela até dentro do laço de
  expansão, cobrindo Root Unit e toda Project Unit intermediária.

**Non-Goals:**
- Mudar o fluxo `File > Open` de `.pas` avulso (não tem Projeto para
  expandir).
- Mudar o formato `{ nodes, edges }`, a classificação de External Unit ou
  o algoritmo de deduplicação de `expandDependencyGraph` — já corretos.
- Otimizar a leitura síncrona de N arquivos por clique (trade-off já
  aceito no design de `expand-dependency-graph`; ver "Consequências" no
  `docs/TODO.md`).

## Decisions

**`readFile` injetado como closure sobre `projectDir`, não como novo
parâmetro de `selectRootUnit`.** `expandDependencyGraph` já espera
`readFile(path) => source`; `selectRootUnit` monta
`path => fs.readFileSync(path.resolve(projectDir, path), 'utf-8')` no
próprio corpo da função, reaproveitando a resolução de caminho que já
existe para a Root Unit. Alternativa descartada: fazer
`expandDependencyGraph` receber `projectDir` e `fs` diretamente — quebraria
sua pureza (motivo pelo qual ela recebe `readFile` injetado desde a
change original) sem necessidade.

**`scope` como quarto parâmetro posicional opcional em
`expandDependencyGraph`, na mesma posição/semântica de
`selectUsesFromSource(source, scope)`.** Mantém consistência com a
convenção já usada nessa função (parâmetro opcional, padrão `interface`)
em vez de introduzir um objeto de opções só para esse caso.

**Um único `scope`, lido uma vez no clique, vale para toda a expansão.**
Coerente com "escolhido por geração" do `CONTEXT.md`: o controle já é
local à tela e não persistido; aplicar o mesmo valor a toda a árvore de
expansão (em vez de, por exemplo, deixar cada unidade "herdar" um escopo
próprio) evita um comportamento inconsistente sem necessidade real —
nada no `CONTEXT.md` sugere escopo por unidade.

## Bug encontrado no teste manual: física do vis-network nunca estabiliza com ciclos

`renderGraph` criava o `Network` sem configurar `physics`, herdando o
comportamento padrão do vis-network: simulação de física (`barnesHut`)
rodando continuamente, frame a frame, sem nunca ser desligada. No grafo de
1 nível anterior (poucos nós, raramente com ciclo) isso convergia rápido o
bastante para passar despercebido. Com a expansão completa, o grafo fica
maior e pode conter ciclos de verdade — que `expandDependencyGraph` suporta
e testa explicitamente ("ciclo direto entre duas Project Units") — e esse
tipo de grafo tende a não atingir equilíbrio estável nesse solver, fazendo
os nós oscilarem indefinidamente ("dançando" na tela, reportado no teste
manual da tarefa 3.2).

**Correção**: `renderGraph` agora configura
`physics: { stabilization: { iterations: 200 } }` na criação do `Network`
e desliga a física (`network.setOptions({ physics: false })`) assim que o
evento `stabilizationIterationsDone` dispara — padrão recomendado pelo
próprio vis-network para grafos estáticos (o grafo não muda depois de
renderizado, então não há motivo para manter a simulação rodando).

## Risks / Trade-offs

- [Leitura síncrona de todas as Project Units alcançáveis a cada clique,
  em vez de só a Root Unit] → Aceitável para o porte típico de projeto
  Pascal (dezenas de units); já é um trade-off conhecido e aceito no
  design de `expand-dependency-graph`, agora só passa a acontecer de fato
  a cada seleção em vez de só em teste.
- [Trocar de escopo depois de já estar na tela de grafo exige voltar para
  `Open Project` e escolher a Root Unit de novo] → Já é o comportamento
  atual (tela de listagem é abandonada ao renderizar o grafo) e consistente
  com "not a persisted global setting" do `CONTEXT.md`; nenhuma mudança
  necessária aqui.
