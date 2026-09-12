## Context

`root-unit-selection` (já implementado) resolve o caminho de arquivo da
Root Unit a partir do diretório do `.dpr` e renderiza só 1 nível
(`mountDependenceGraphStructure`), classificando as dependências diretas
como Project Unit/External Unit via `classifyExternalUnits`. O
`CONTEXT.md` define "Dependency Graph" como a expansão transitiva
completa a partir da Root Unit, com cada unidade expandida no máximo uma
vez (DAG, não árvore). Essa expansão recursiva não existe ainda em nenhum
lugar do código — é a peça que falta para o conceito do `CONTEXT.md` bater
com o comportamento real do app.

O model layer (`src/model`) não tem nenhuma dependência de Electron/fs
hoje — `parseDprSource`, `parsePascalSource`, `classifyExternalUnits` e
`mountDependenceGraphStructure` são todas funções puras que recebem
strings/arrays e devolvem dados. A expansão recursiva precisa ler N
arquivos `.pas` do disco (um por Project Unit alcançável), o que introduz
I/O — a decisão central deste design é como fazer isso sem quebrar esse
padrão.

## Goals / Non-Goals

**Goals:**
- Expandir recursivamente um Root Unit por todas as Project Units
  alcançáveis via `uses`, produzindo um único `{ nodes, edges }` no mesmo
  formato de `mountDependenceGraphStructure`.
- Visitar cada unit no máximo uma vez, independente de quantos outros nós
  apontam para ela (diamantes) ou de haver um ciclo (`A uses B uses A`).
- Manter o model layer livre de dependência direta de `fs`/Electron.
- Reaproveitar `parsePascalSource` e `classifyExternalUnits` sem alterá-los.

**Non-Goals:**
- Ligar a expansão à UI/`root-unit-selection` (continua renderizando 1
  nível até uma change futura decidir o gatilho — botão, automático,
  etc.).
- Resolver o Uses Clause Scope (`interface` vs `implementation`) —
  `selectUsesFromSource` é usado como está, com sua ambiguidade atual.
- Tratar `.pas` com `unit`/`uses` ausente — segue o padrão já documentado
  no `CLAUDE.md` (`.match(...)[0]` lança exceção; não é responsabilidade
  desta change mudar isso).
- Deduplicar edges paralelos (duas ocorrências do mesmo `to` na mesma
  cláusula `uses` de uma unit) — cenário não observado, fora de escopo.

## Decisions

### 1. Injeção de `readFile` como parâmetro, não import de `fs`
A função de expansão recebe `readFile: (path: string) => string` como
parâmetro. Ela nunca importa `fs` diretamente.

- **Por quê**: mantém o model layer 100% puro e testável com um fake em
  memória (`{ 'UnitA.pas': 'unit UnitA; interface uses UnitB; ...' }`),
  igual ao padrão que já existe nos testes do model layer hoje. A
  resolução do caminho absoluto (juntar `projectDir` + `path` do `.dpr`)
  fica por conta de quem chama a função (o mesmo lugar que hoje já faz
  isso em `root-unit-selection`), então essa função nem precisa saber que
  os `path` vêm de um `.dpr`.
- **Alternativa considerada**: aceitar `fs.readFileSync` como default e
  permitir override — rejeitada por criar uma dependência implícita de
  Electron/Node no model layer, contrariando a separação descrita no
  `CLAUDE.md`.

### 2. Assinatura: `expandDependencyGraph(rootUnitName, projectUnits, readFile)`
Recebe o nome da Root Unit (já escolhida pela tela de seleção), a lista
completa de Project Units do Projeto (`{ unitName, path }[]`, saída de
`parseDprSource`) e a função de leitura. Retorna `{ nodes, edges }`.

- A própria Root Unit precisa estar presente em `projectUnits` (contrato
  já garantido por `root-unit-selection`, que só deixa escolher unidades
  dessa lista) — a função usa essa entrada para achar o `path` e ler o
  arquivo da Root Unit.
- **Alternativa considerada**: receber o `source` da Root Unit já lido
  (como parâmetro separado, similar ao fluxo de `File > Open`) — rejeitada
  porque tornaria a assinatura inconsistente (Root Unit tratada diferente
  das demais) sem ganho real, já que a função já precisa de `readFile`
  para as demais units.

### 3. Travessia BFS/DFS com `Map` de visitados por nome normalizado
Um `Map<string, node>` (chave = nome da unit em minúsculas) guarda os nós
já criados. Antes de expandir uma Project Unit, verifica se ela já está no
`Map`; se sim, não lê o arquivo de novo nem gera um novo nó — só o edge de
quem a referenciou é adicionado. A Root Unit é marcada como visitada antes
de começar a percorrer suas próprias dependências (cobre o caso de ciclo
voltando pra ela).

- Cada unidade lida tem suas dependências diretas classificadas via
  `classifyExternalUnits` contra a mesma lista `projectUnits`; External
  Unit vira nó folha (não entra na fila de expansão); Project Unit ainda
  não visitada entra na fila.
- **Por quê Map por nome normalizado**: é a mesma convenção de
  case-insensitivity já usada em `classifyExternalUnits` e no `id`
  lowercase de `mountDependenceGraphStructure` — mantém consistência em
  vez de introduzir uma segunda forma de comparar nomes.

### 4. Reaproveitar o formato de nó/edge de `mountDependenceGraphStructure`
Nós seguem `{ id: unitName.toLowerCase(), label: unitName, group:
'projectUnit' | 'externalUnit' }`; edges seguem `{ from, to }` com IDs em
lowercase. Não se reaproveita a função `mountDependenceGraphStructure` em
si (ela é para 1 nível só e não tem noção de visitados/fila), mas o
formato de saída é idêntico para o `vis-network` não precisar de dois
caminhos de renderização diferentes.

## Risks / Trade-offs

- **[Risco] Leitura síncrona de N arquivos pode ficar lenta em projetos
  grandes** → aceitável por ora (fora de escopo otimizar; projetos Pascal
  típicos têm dezenas, não milhares, de units); revisitar se um caso real
  aparecer.
- **[Risco] Bug na lógica de visitados causa recursão infinita em um
  ciclo real (`A uses B uses A`)** → mitigado exigindo um cenário de teste
  explícito de ciclo direto e de diamante (`A` e `B` ambos dependem de
  `C`) nas specs, não só do caminho feliz linear.
- **[Trade-off] Função não valida que `rootUnitName` existe em
  `projectUnits`** → consistente com o padrão do projeto de não tratar
  entradas inválidas fora dos limites do sistema (mesma lógica do
  `.match(...)[0]` que lança em `unit`/`uses` ausente); se o valor vier de
  fora do fluxo de `root-unit-selection`, o comportamento não é
  especificado por este design.
