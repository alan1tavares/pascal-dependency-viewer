# Design

## Context

Ver `proposal.md` — Why. Estado relevante do código (após
`rename-graph-tab-to-unit-tab`):

- `src/domain/tabs/` modela as Tabs como objetos `{ id, kind, ... }`
  (`kind: 'welcome' | 'unit'`), com `openTab` genérico que ativa em vez de
  duplicar e `closeUnitTabs` para o carregamento de Project.
- `src/domain/commands/` tem o catálogo `COMMANDS` e `availableCommands(commands,
  { hasProject })`, que filtra por `requiresProject`.
- `src/main/menu.js` monta o menu com o item `Selecionar Método` exibindo um
  `dialog.showMessageBox`. O main não conhece a Tab ativa.
- `CommandPalette.svelte` já tem três modos (Commands, `Abrir recente`,
  `Selecionar Unit`), com a regra de `Esc` por origem de entrada
  (`entry: 'command' | 'direct'`).
- `GraphView.svelte` + `services/networkRenderer.js` desenham o Dependency
  Graph com `vis-network` em layout físico (`forceAtlas2Based`).
- A change `pascal-parser-and-call-index` fornece, no main, o índice de
  chamadas em cache por Project (ADR 0007) e o contrato consumido aqui:
  - `methods:list` / preload `listUnitMethods(unitName)` →
    `{ methods: [{ id, label, className, name }], skipped? }` (dispara ou
    aguarda a montagem do índice; `skipped` traz o motivo quando a Unit não
    pôde ser analisada, com `methods` vazio).
  - `callerGraph:expand` / preload `expandCallerGraph(methodId)` →
    `{ nodes, edges, skippedUnits }`, com os campos fixados na spec
    `caller-graph-expansion` da parte 2:
    - nó: `{ id, label, unitName, kind, isTarget, isEntryPoint }`, com
      `kind` ∈ `method` | `program` | `initialization` | `finalization`;
    - aresta: `{ from, to, isBackEdge, isPolymorphic, viaId?, viaLabel? }`
      — `from` é o Caller e `to` o chamado, no máximo uma por par;
      `viaId`/`viaLabel` só existem quando `isPolymorphic`; self-loop é
      `from === to`, sempre com `isBackEdge: false`;
    - `skippedUnits`: `[{ unitName, reason }]`.
  - Ids: `unit:<unit>|<class>|<name>` (minúsculas), `program:<project>`,
    `init:<unit>`, `final:<unit>`. Rótulos dos blocos: `Programa`,
    `UnitX (initialization)`, `UnitX (finalization)`.
  - Erros chegam como `Error` cuja mensagem começa com o código entre
    colchetes: `[PROJECT_REPLACED]`, `[NO_PROJECT]`, `[METHOD_NOT_FOUND]`.

## Goals / Non-Goals

**Goals:**
- Reaproveitar as regras puras existentes (Tabs, Commands, filtro) em vez de
  criar caminhos paralelos.
- Manter o main sem estado de UI além do mínimo para o menu (tipo da Tab
  ativa).

**Non-Goals:**
- Parser, índice de chamadas, detecção de Entry Points, polimorfismo e
  ciclos — tudo isso chega pronto da change `pascal-parser-and-call-index`.
  Esta change só decide *como desenhar* as flags recebidas.
- View Filter na Method Tab, navegação por clique, atalho de teclado para
  `Selecionar Método`, invalidação do índice ao editar arquivos.

## Decisions

### 1. Disponibilidade de Commands passa a receber o tipo da Tab ativa
`availableCommands(commands, { hasProject, activeTabKind })` e o Command
`selectMethod` ganha `requiresActiveTabKind: 'unit'`. Alternativa: um
predicado arbitrário por Command — descartada por ser mais do que o caso
pede; uma propriedade declarativa mantém o catálogo testável e legível.

### 2. Menu desabilitado via push do renderer
O renderer, ao observar a store de Tabs, chama
`api.setActiveTabKind(kind)` (`ipcRenderer.send('tabs:active-kind', kind)`)
sempre que `activeId` muda (incluindo o estado inicial). O main guarda o
último valor e atualiza `menu.getMenuItemById('selectMethod').enabled`. O
item começa desabilitado no `buildMenu`. Alternativas: (a) reconstruir o menu
inteiro a cada troca — desnecessário; (b) deixar o item sempre habilitado e
ignorar o clique — contraria a decisão de produto. `send` (fire-and-forget)
em vez de `invoke` porque não há resposta.

### 3. `Selecionar Método` no menu reusa `runCommand`
`runCommand('selectMethod')` empurra `app:show-method-selection` para o
renderer, como `selectUnit` faz com `app:show-root-unit-selection`. O
renderer resolve a Root Unit da Unit Tab ativa a partir da própria store de
Tabs (o main não sabe qual é), e abre o modo com `entry: 'direct'`. Pela
paleta, o Command troca de modo localmente com `entry: 'command'`, sem IPC.
Se o push chegar sem Unit Tab ativa (corrida com troca de Tab), é ignorado.

### 4. Modo `Selecionar Método` com estado de carregamento
`CommandPalette.svelte` ganha o modo `method`, com estados `loading`,
`ready(methods)`, `empty` e `skipped(reason)`. Ao entrar, chama
`api.listUnitMethods(unitName)`; enquanto a promise está pendente, mostra
`Analisando Project…`. Fechar a paleta não cancela a promise (a análise vive
no main, que mantém o cache); uma resposta que chega com a paleta fechada ou
em outro modo/Unit é descartada pelo renderer. O filtro reusa a normalização
de `filterCommands` (extraída para um helper comum de busca sem acento)
aplicada ao `label` que já vem do main — o renderer não monta rótulos.

Erros (de `listUnitMethods` e de `expandCallerGraph`) são classificados por
um helper puro `ipcErrorCode(error)` que extrai o prefixo `[CODE]` da
mensagem: `PROJECT_REPLACED` é descartado silenciosamente (outro Project já
foi carregado e as Tabs dele já foram fechadas); qualquer outro código
fecha a paleta e exibe um `alert`, no mesmo padrão de falha de
`expandFromRootUnit`.

### 5. Method Tab no domínio de Tabs
Novo `kind: 'method'`, `methodTabId(methodId)` = `method:` + o `id` do
Method vindo do main (ex.: `method:unit:unitcliente|tcliente|salvar`). O
prefixo próprio evita colisão com o id da Unit Tab (`unit:` + nome da Unit,
da change `rename-graph-tab-to-unit-tab`), já que o id do Method também
começa com `unit:`; e o id do Method já inclui a Unit, então rótulos iguais
em Units diferentes geram Tabs distintas. `openMethodTab(state, tab)`
reutiliza `openTab`. `closeUnitTabs` é generalizado para `closeProjectTabs`
(fecha `unit` e `method`), usado em `app:project-loaded`. A Tab guarda
`{ methodId, label, unitName, unitPath, graph }`; o título é `label` e o
tooltip é `${unitName} — ${unitPath}` (`unitPath` vem das Project Units já
presentes na store de Project).

### 6. Visualização em componente próprio
Novo `CallerGraphView.svelte` + `services/callerGraphRenderer.js`, em vez de
parametrizar `GraphView`/`NetworkRenderer`: o Dependency Graph usa física e
View Filter; o Caller Graph usa layout hierárquico e nenhum filtro.
Compartilhar a classe misturaria dois conjuntos de opções sem ganho.

Opções `vis-network`:
- `layout.hierarchical: { direction: 'DU', sortMethod: 'directed',
  shakeTowards: 'leaves' }` — arestas apontam do Caller (acima) para o
  chamado (abaixo); com `DU`, o nível 0 (Target Method) fica embaixo.
- Níveis calculados por nós (longest path a partir do Target Method,
  ignorando back-edges e self-loops) e passados como `level` em cada nó,
  para que back-edges não puxem nós para cima/baixo. Função pura
  `assignCallerLevels(graph)` em `src/domain/`, testável.
- `physics: false` com hierárquico, preservando posições ao arrastar.
- Grupo de cada nó derivado das marcações do contrato, nesta precedência:
  `isTarget` → `target`; `kind !== 'method'` → `block` (box, mesma cor de
  `entryPoint`); `isEntryPoint` → `entryPoint` (ellipse); senão `method`
  (neutro).
- Arestas: `isBackEdge` → `dashes: true`; self-loop nativo do vis
  (`from === to`, `selfReference`); `isPolymorphic` → `color` própria e
  `title: 'via ' + viaLabel`.
- Rótulo do nó: `label` do contrato; para `kind: 'method'`, `label` + `\n`
  + `unitName`. Blocos usam só o `label` (`Programa`, `UnitX (initialization)`).

Cores exatas ficam no componente; os testes verificam grupo/estilo
atribuído, não valores hex.

### 7. Aviso de Units não analisadas
Faixa simples no topo da Method Tab, acima do canvas, renderizada só se
`graph.skippedUnits.length > 0`, listando `unitName` (o `reason` vai no
tooltip de cada nome). Sem ação associada.

## Risks / Trade-offs

- [Layout hierárquico com muitos nós por nível fica largo] → aceitável na
  v1 (sem limite de expansão, decisão de produto); `levelSeparation` e
  `nodeSpacing` ajustados empiricamente.
- [Corrida: usuário troca de Tab enquanto `Analisando Project…`] → a lista
  é sempre a da Unit capturada na entrada do modo; respostas fora de
  contexto são descartadas.
- [Spec delta de `command-palette`/`tabs` toca requirements também
  alterados por `rename-graph-tab-to-unit-tab`] → arquivar aquela change
  primeiro; os blocos MODIFIED aqui já usam o vocabulário Unit Tab.

## Migration Plan

Sem dados persistidos novos. Ordem de aplicação/arquivamento:
`rename-graph-tab-to-unit-tab` → `pascal-parser-and-call-index` → esta
change. Rollback: reverter os commits desta change; o item de menu volta ao
alerta.

## Open Questions

- Paleta de cores final dos grupos (`target`, `entryPoint`, `method`,
  Polymorphic Call) — pode ser decidida na implementação sem afetar specs.
