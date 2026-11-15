# Proposal

## Why

O app hoje só sabe quais Units dependem de quais (regex sobre `unit`/`uses`).
Para o Caller Graph — analisar o código de baixo para cima a partir de um
Target Method — é preciso saber **quem chama cada Method**, com precisão
suficiente para distinguir `TCliente.Salvar` de `TPedido.Salvar`. Isso exige
um parser Delphi de verdade, com resolução de tipos (ADR 0006), e um índice de
chamadas do Project inteiro mantido em cache no main process (ADR 0007). Esta
change entrega essa base (domínio + main + IPC), sem nenhuma UI; a change
`caller-graph-method-tab` constrói a interface em cima dela.

## What Changes

- Novo parser recursivo-descendente para Delphi em `src/domain/`, em
  JavaScript puro, com pré-processamento de `{$IFDEF}`/`{$IFNDEF}`/`{$IF}`/
  `{$ELSE}`/`{$ENDIF}` avaliado contra um conjunto fixo de símbolos padrão do
  Delphi.
- Extração dos Methods de uma Unit: procedures/functions com corpo na
  `implementation`, de classe ou soltas, na ordem do fonte; overloads da mesma
  classe (ou soltos na mesma Unit) formam um único Method; rotinas aninhadas
  pertencem à rotina envolvente.
- Resolvedor de símbolos e tipos sobre todas as Project Units: locais,
  parâmetros, fields, properties, `Self`, `inherited`, referências de classe,
  encadeamentos de retorno, `with`, casts, herança, interfaces e generics, com
  stubs embutidos para os containers mais usados da RTL. Chamada cujo receptor
  não é resolvido não gera aresta.
- Índice de chamadas do Project: Callers (Methods, bloco principal do `.dpr`,
  seções `initialization`/`finalization`), Polymorphic Calls marcadas como
  tal, e Entry Points (handlers ligados em `.dfm`/`.fmx` texto, Methods
  passados adiante sem ser chamados, blocos especiais).
- Units que o parser não consegue analisar são puladas e reportadas.
- Expansão pura do Caller Graph a partir de um Target Method: um nó por
  Method/bloco, aresta do Caller para o chamado, self-loops, back-edges
  marcados, arestas polimórficas com o Method "via", sem limite de
  profundidade, em ordem determinística.
- Cache do índice no main process por Project: montado sob demanda, compartilhado
  entre pedidos concorrentes, descartado ao carregar outro Project, sem
  vigiar o sistema de arquivos.
- Novos canais IPC e métodos na API do preload: `listUnitMethods` (Methods de
  uma Project Unit) e `expandCallerGraph` (Caller Graph de um Target Method).
  Nenhum Command, menu ou componente muda nesta change.

## Capabilities

### New Capabilities
- `pascal-source-parsing`: pré-processamento de diretivas condicionais,
  parsing de Units e do `.dpr` em árvore sintática, falha de parse reportada
  por Unit, e extração dos Methods de uma Unit.
- `method-call-resolution`: resolução de tipos e símbolos entre Project Units,
  identificação de chamadas (diretas e polimórficas), referências sem chamada,
  Entry Points (incluindo `.dfm`/`.fmx`) e montagem do índice de chamadas do
  Project.
- `caller-graph-expansion`: expansão transitiva dos Callers de um Target
  Method no formato `{ nodes, edges, skippedUnits }`, com tratamento de
  recursão e ciclos.
- `call-index-cache`: ciclo de vida do índice de chamadas no main process e
  os canais IPC `listUnitMethods` / `expandCallerGraph`.

### Modified Capabilities
<!-- Nenhuma: o Dependency Graph, o parsing do `.dpr` (`dpr-project-parsing`)
     e a UI não mudam de comportamento nesta change. -->

## Impact

- **Código novo**: `src/domain/pascalParser/` (lexer, pré-processador,
  parser), `src/domain/callIndex/` (resolvedor, stubs da RTL, leitura de
  `.dfm`, montagem do índice), `src/domain/expandCallerGraph/`,
  `src/main/services/callIndexCache.js`, `src/main/ipc/callGraph.js`.
- **Código alterado**: `src/main/ipc/project.js` (`loadProject` passa a
  registrar o Project atual no cache, guardando também o caminho do `.dpr`),
  `src/main/index.js` (registro do novo handler), `src/preload/api.js` (dois
  métodos novos).
- **Estado no main**: pela primeira vez o main process guarda estado do
  Project aberto (ADR 0007).
- **Dependências**: nenhuma nova — parser escrito à mão (ADR 0006).
- **Testes**: suíte nova em `src/domain/test/` com fixtures `.pas`/`.dpr`/
  `.dfm`; testes do cache/IPC em `src/main/test/`.
- **Fora de escopo**: UI (`Selecionar Método`, Method Tab, estilos),
  migração do Dependency Graph para o parser novo, `.dfm` binário, leitura da
  pasta `source` do Delphi.
