# Spec Delta

## Purpose

Expandir, a partir de um Target Method, todos os seus Callers transitivos em
um Caller Graph (`{ nodes, edges, skippedUnits }`), fechando recursão e
ciclos de chamadas sem expandir infinitamente.

## ADDED Requirements

### Requirement: Expansão transitiva dos Callers de um Target Method
O sistema SHALL fornecer uma função pura que recebe o índice de chamadas de
um Project e a identificação de um Target Method, e retorna
`{ nodes, edges, skippedUnits }` com: o Target Method, todos os seus Callers
e, recursivamente, os Callers de cada Caller, até não haver mais Callers, sem
limite de profundidade. Cada Method ou bloco especial SHALL aparecer como um
único nó, mesmo quando alcançado por vários caminhos. `skippedUnits` SHALL
listar todas as Units não analisadas do Project, cada uma no formato
`{ unitName, reason }`.

#### Scenario: Cadeia simples
- **WHEN** `A` chama o Target Method `T`, e `B` chama `A`
- **THEN** o resultado contém os nós `T`, `A` e `B`, e as arestas `A → T` e
  `B → A`

#### Scenario: Diamante
- **WHEN** `A` e `B` chamam `T`, e `D` chama `A` e `B`
- **THEN** `D` aparece uma única vez, com arestas `D → A` e `D → B`

#### Scenario: Target Method sem Callers
- **WHEN** nenhum Caller chama `T`
- **THEN** o resultado contém apenas o nó `T` e nenhuma aresta

### Requirement: Formato dos nós
Cada nó SHALL ter exatamente estes campos:
- `id`: identificador estável, em minúsculas — `unit:<unit>|<classe>|<nome>`
  para um Method (classe vazia para um Method solto), `program:<project>`,
  `init:<unit>` ou `final:<unit>` para os blocos especiais;
- `label`: a grafia original (`TCliente.Salvar`, `Salvar`, `Programa`,
  `UnitX (initialization)`, `UnitX (finalization)`);
- `unitName`: o nome da Unit do Method ou do bloco, com a grafia original (o
  nome do Project, para o bloco principal);
- `kind`: `method`, `program`, `initialization` ou `finalization`;
- `isTarget`: `true` só no Target Method;
- `isEntryPoint`: `true` se o nó é um Entry Point.

#### Scenario: Marcações do Target Method e de um handler
- **WHEN** o Target Method `TCliente.Salvar` é chamado por
  `TForm1.Button1Click`, que está ligado no `.dfm`
- **THEN** o nó de `TCliente.Salvar` tem `isTarget: true` e
  `isEntryPoint: false`, e o nó de `TForm1.Button1Click` tem
  `isTarget: false`, `isEntryPoint: true` e `kind: method`

#### Scenario: Bloco principal
- **WHEN** o bloco principal do Project chama um Method do grafo
- **THEN** existe um nó com `id: program:<project>`, `label: Programa`,
  `kind: program` e `isEntryPoint: true`

### Requirement: Formato das arestas
Cada aresta SHALL ter exatamente estes campos:
- `from`: `id` do Caller;
- `to`: `id` do Method chamado;
- `isBackEdge`: `true` se a aresta fecha um ciclo (veja "Recursão e ciclos");
- `isPolymorphic`: `true` se é uma Polymorphic Call;
- `viaId` e `viaLabel`: o `id` e o `label` da declaração (Method virtual
  ancestral ou método de interface) pela qual a chamada foi feita — presentes
  só quando `isPolymorphic` é `true`, e ausentes caso contrário.

Um self-loop é uma aresta com `from === to`. Entre um mesmo par
`from`/`to` SHALL existir no máximo uma aresta; quando o mesmo Caller alcança
o mesmo Method tanto por chamada direta quanto polimórfica, a aresta SHALL
ter `isPolymorphic: false` e nenhum `viaId`/`viaLabel`.

#### Scenario: Aresta polimórfica
- **WHEN** o Target Method é `TDerived.Salvar` e `X` executa `B.Salvar` com
  `B: TBase`, sendo `TBase.Salvar` virtual
- **THEN** existe uma aresta `X → TDerived.Salvar` com
  `isPolymorphic: true`, `viaId` igual ao id de `TBase.Salvar` e
  `viaLabel: TBase.Salvar`, e nenhum nó `TBase.Salvar` é criado por causa
  dela

#### Scenario: Chamada direta e polimórfica do mesmo Caller
- **WHEN** `X` chama `TDerived.Salvar` diretamente e também via
  `TBase.Salvar`
- **THEN** existe uma única aresta `X → TDerived.Salvar`, com
  `isPolymorphic: false` e sem `viaId`/`viaLabel`

### Requirement: Recursão e ciclos
Uma chamada de um Method a si mesmo SHALL gerar uma aresta com `from` e `to`
iguais (self-loop), sem nova expansão. A expansão SHALL ser uma busca em
profundidade a partir do Target Method; uma aresta que chega a um Method que
ainda está na pilha da travessia SHALL ser marcada como back-edge. A ordem
da travessia SHALL ser determinística: os Callers de cada Method são
visitados na ordem do Project (Units na ordem do `.dpr`, depois a ordem dos
Callers no fonte), de modo que a mesma entrada produz sempre o mesmo
resultado. Self-loops SHALL ter `isBackEdge: false`.

#### Scenario: Recursão direta
- **WHEN** o Target Method `Fatorial` chama a si mesmo
- **THEN** existe uma aresta `Fatorial → Fatorial` com `isBackEdge: false`,
  e a expansão termina

#### Scenario: Ciclo mútuo
- **WHEN** `A` chama o Target Method `T`, `T` chama `A`, e nada mais chama
  `A` ou `T`
- **THEN** o resultado contém as arestas `A → T` com `isBackEdge: false` e
  `T → A` com `isBackEdge: true`, e a expansão termina

#### Scenario: Resultado determinístico
- **WHEN** a expansão é executada duas vezes sobre o mesmo índice e o mesmo
  Target Method
- **THEN** os dois resultados são idênticos, inclusive na ordem de nós e
  arestas e em quais arestas são back-edges
