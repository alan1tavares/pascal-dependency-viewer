# Design

## Context

Veja `proposal.md` (Why). Estado atual relevante:

- Todo o parsing é regex (`src/domain/parsePascalSource/`,
  `src/domain/parseDprSource/`). Nada analisa corpos de routines.
- O main process não guarda estado do Project: `loadProject(filePath)`
  (`src/main/ipc/project.js`) devolve `{ projectUnits, projectDir }` ao
  renderer, que o reenvia em `expandFromRootUnit`. O caminho do `.dpr` não é
  devolvido nem guardado.
- `src/domain/` é ESM puro, sem Electron, testado com Vitest e fixtures em
  `src/domain/test/`. I/O é injetado (`readFile`), como em
  `expandDependencyGraph`.
- ADR 0006 fixa o parser escrito à mão com resolução de tipos; ADR 0007 fixa
  o cache no main por Project, sem file watching.

## Goals / Non-Goals

**Goals:**
- Parser, resolvedor e expansão 100% no domínio, testáveis sem Electron.
- Main process responsivo (menus, IPC de outras features) enquanto o índice
  é montado.
- Um formato de saída do Caller Graph que a change `caller-graph-method-tab`
  consiga desenhar sem reprocessar nada.

**Non-Goals:**
- Recuperação de erro dentro de uma Unit (parse parcial): falhou, a Unit
  inteira é pulada.
- Análise incremental, file watching, persistência do índice em disco.
- Resolver overloads pela assinatura (overloads já são um único Method).
- Migrar o Dependency Graph para o parser novo.

## Decisions

### D1. Pipeline em quatro estágios no domínio

```
fonte ──► preprocess ──► lexer ──► parser (AST) ──► resolver ──► CallIndex ──► expandCallerGraph
          ({$IFDEF})                               (2 passes)
```

Módulos:
- `src/domain/pascalParser/` — `preprocess.js` (diretivas), `lexer.js`
  (tokens com linha/coluna; comentários e strings viram tokens descartados),
  `parser.js` (recursivo-descendente, produz AST de Unit ou de Program),
  `ParseError` com posição.
- `src/domain/callIndex/` — `symbols.js` (tabela de símbolos por Unit),
  `resolver.js`, `rtlStubs.js`, `dfm.js` (leitor de `.dfm`/`.fmx` texto),
  `buildCallIndex.js` (orquestra).
- `src/domain/methods/` — `listUnitMethods(ast)` e o formato de `id`
  (`unit:<unit>|<class>|<name>` em minúsculas; blocos especiais
  `program:<project>`, `init:<unit>`, `final:<unit>`).
- `src/domain/expandCallerGraph/` — função pura sobre o `CallIndex`.

Alternativa considerada: um único módulo "analyzer". Rejeitada: o
pré-processador e o lexer são testáveis isoladamente e serão reutilizados
quando o Dependency Graph migrar.

### D2. Resolução em duas passadas

1. **Declarações**: percorre a AST de todas as Units (e os stubs) e monta a
   tabela de símbolos global — tipos com ancestral, interfaces implementadas,
   membros com tipo e diretivas, routines soltas, variáveis globais — por
   Unit, respeitando `interface` (visível por quem usa) e `implementation`
   (visível só na própria Unit).
2. **Corpos**: para cada corpo de Method/bloco, percorre as instruções com
   uma pilha de escopos (`with`, do mais interno para o mais externo →
   locais e parâmetros, inclusive das rotinas envolventes → `Self`/classe e
   ancestrais → Unit → `uses` da implementation e depois da interface, em
   ordem reversa → `System`, como o compilador Delphi; o `with` esconde até
   variáveis locais) e resolve cada designador (`a.b[i].c(...)`) passo a passo
   até o tipo final.

A segunda passada precisa da primeira completa porque uma Unit pode chamar
tipos declarados em Units que aparecem depois no `.dpr`.

Genéricos: o tipo instanciado carrega um mapa `T → TCliente`; membros cujo
tipo é parâmetro genérico são substituídos na resolução. Constraints não
precisam ser verificadas.

### D3. Chamada vs. referência

Um designador que termina num Method SHALL ser classificado pelo contexto
sintático: lado direito de `:=` cujo lado esquerdo resolve para tipo
procedural/evento, argumento cuja posição de parâmetro é procedural, ou
operando de `@` → **referência** (marca Entry Point). Qualquer outro uso
(instrução isolada, expressão, com ou sem parênteses) → **chamada**. Quando o
tipo do parâmetro/lado esquerdo não puder ser resolvido, o padrão é
**chamada** (Delphi chama funções sem parênteses; tratar como referência
perderia Callers reais), com duas exceções:

- Uma **procedure** (sem valor de retorno) usada onde se espera um valor —
  lado direito de `:=` ou argumento — só pode estar sendo passada adiante:
  é **referência**, qualquer que seja o tipo do destino.
- Atribuição a uma propriedade cujo nome segue a convenção de evento do
  Delphi (`On` + maiúscula) num receptor de tipo não resolvido é tratada como
  tipo procedural: o lado direito é **referência**. Sem isso,
  `Botao.OnClick := BotaoClick` com `Botao: TButton` (VCL, sem stub) contaria
  como chamada.

Ler ou escrever uma property cujo acessor (`read`/`write`) é um método
executa esse método: conta como **chamada** dele.

### D4. Polymorphic Calls no índice, não na expansão

O índice guarda, para cada Method, a lista de chamadas recebidas como
`{ callerId, kind: 'direct' | 'polymorphic', viaId?, viaLabel? }`. Na
montagem, cada chamada resolvida para um método virtual/de interface é
replicada assim:

- **Virtual** (`virtual`/`dynamic`/`override`/`abstract`): para cada
  `override` com corpo em classes **descendentes do tipo estático do
  receptor** (não de toda a hierarquia do método declarado), desde que a
  cadeia de `override` até o método chamado não seja interrompida por uma
  redeclaração sem `override`. `D.Salvar` com `D: TDerived` não alcança um
  `override` num irmão de `TDerived`, que nunca seria executado ali.
- **Interface**: para o Method que implementa o método (procurado pelo nome,
  com herança) em cada classe do Project que implementa a interface ou uma
  descendente dela, direta ou indiretamente.
- `inherited` é despacho estático: nunca gera Polymorphic Call.

Assim `expandCallerGraph` só consulta os Callers de cada id e não conhece
herança.

### D5. Índice serializável e chaveado por `id`

`CallIndex` = `{ projectName, units: [{ unitName, methods: [{ id, label,
className, name }], skipped? }], nodes: Map<id, { id, label, unitName, kind
}>, callers: Map<id, CallRef[]>, entryPoints: Set<id>, skippedUnits: [{
unitName, reason }] }`. `nodes` tem todos os Methods e blocos especiais
(`kind`: `method`, `program`, `initialization`, `finalization`) e é de onde
`expandCallerGraph` tira rótulos e tipos dos nós; `units[].skipped` é o
motivo de uma Unit não analisada, devolvido pelo `methods:list`. Chamadas
para ids que não estão em `nodes` (métodos sem corpo, de stubs) são
descartadas. Routines declaradas no próprio `.dpr` não são Methods: o que
acontece dentro delas é atribuído ao bloco principal (`Programa`). Ordem dos `CallRef` = ordem do
Project (Units na ordem do `.dpr`, depois posição no fonte), o que torna a
DFS de `expandCallerGraph` determinística sem ordenar nada depois.

### D6. Montagem assíncrona cooperativa no main

`buildCallIndex` é uma função `async` que recebe `readFile` assíncrono e
cede o event loop (`await` entre Units) a cada Unit analisada. O main
continua respondendo a menus e IPC entre uma Unit e outra.

Alternativa considerada: `worker_threads`/`utilityProcess`. Isolaria
completamente o main, mas exige um entry extra no build Vite/Forge e
serializar o índice. Fica como evolução se o perfil mostrar Units
individuais lentas demais (risco abaixo).

### D7. Cache no main: `src/main/services/callIndexCache.js`

Estado: `{ project, generation, pending: Promise<CallIndex> | null, index }`.
- `setProject(project)` — chamado por `loadProject` após o parse do `.dpr`
  dar certo; incrementa `generation` e limpa `pending`/`index`.
- `getIndex()` — devolve `index`; senão `pending`; senão inicia a montagem
  capturando a `generation` atual. Ao terminar, se a `generation` mudou,
  descarta o resultado e rejeita com `ProjectReplacedError`
  (`code: 'PROJECT_REPLACED'`).
- `loadProject` passa a guardar também `dprPath` (o `.dpr` é relido pelo
  parser novo para o bloco principal). O retorno para o renderer não muda.

Sem Project: `getIndex()` rejeita com `code: 'NO_PROJECT'`.

### D8. IPC

`src/main/ipc/callGraph.js`:
- `ipcMain.handle('methods:list', (_e, unitName))` → `{ methods, skipped? }`
- `ipcMain.handle('callerGraph:expand', (_e, methodId))` → resultado de
  `expandCallerGraph`; `code: 'METHOD_NOT_FOUND'` se o `id` não existir.

`src/preload/api.js` ganha `listUnitMethods(unitName)` e
`expandCallerGraph(methodId)`. Erros atravessam o `invoke` como `Error` com
`code` na mensagem (o Electron não preserva propriedades customizadas); o
renderer distinguirá pelo prefixo `[PROJECT_REPLACED]` etc.

### D9. Leitura de `.dfm`/`.fmx`

Detecta binário pelo primeiro byte (`0xFF` / assinatura `TPF0`) e ignora. No
texto, reconhece `object|inherited|inline Nome: Tipo ... end` (e itens de
coleções) e toda linha `Propriedade = Identificador`, não só `OnXxx`:
eventos de dataset como `BeforePost` e `AfterScroll` não começam com `On`.
Os identificadores são resolvidos como Methods da classe do formulário (a
classe do objeto raiz do arquivo, na Unit cujo `{$R}` o aponta; com
`{$R *.dfm}` o arquivo tem o mesmo nome base da `.pas`); o que não resolve
para um Method com corpo (`FocusControl = edNome`, `FieldKind = fkLookup`) é
ignorado. Como no Delphi, os handlers de um formulário valem também para os
formulários herdados dele, resolvidos pelo nome na classe descendente: o
`OnShow = FormShow` de `uCadastroBase.dfm` marca `TfmCadastroSessoes.FormShow`
quando o filho redeclara `FormShow`.

### D10. Stubs da RTL como fonte Pascal embutida

`rtlStubs.js` exporta um fonte Pascal de interface (apenas declarações) com
`System.Generics.Collections` e `System.Classes` reduzidos; ele passa pelo
mesmo parser e pela mesma passada de declarações. Vantagem: nenhum formato
paralelo de "assinatura" e o parser é exercitado com genéricos.

## Risks / Trade-offs

- [Parser escrito à mão não cobre um construto Delphi usado no código real]
  → falha isolada por Unit (aparece em `skippedUnits` com linha/coluna); o
  projeto real Cine Tapioca (14 Units VCL com `.dfm` texto e herança de
  formulário) entra nos testes como fixture e precisa ser analisado inteiro,
  sem `skippedUnits`, antes de fechar a change. Ele cobre Polymorphic Calls
  reais (`TfmCadastroBase.Save` chama o virtual `ValidarDados`, com
  `override` em cinco formulários filhos), mas não usa generics,
  interfaces nem `{$IFDEF}`; esses construtos ficam cobertos só pela fixture
  sintética `callGraph`. Vários `.pas` dele estão em Windows-1252, o que
  exercita a leitura com acentos fora de UTF-8 em strings e comentários.
- [Classificação chamada × referência erra quando o tipo procedural não é
  resolvido] → padrão "chamada" (D3), que no pior caso gera um Caller a mais
  em vez de esconder um real.
- [`with` aninhado e helpers de classe resolvem diferente do compilador] →
  ordem de escopos documentada em D2 e coberta por testes; class helpers são
  considerados apenas para o tipo exato que estendem.
- [Main trava numa Unit enorme] → D6 cede o loop por Unit; se insuficiente,
  migrar para `utilityProcess` sem mudar a API do cache.
- [Memória do índice em projetos grandes] → o índice guarda só ids e
  referências, não as ASTs; ASTs são descartadas ao fim de cada Unit na
  segunda passada (a primeira guarda só a tabela de símbolos).
- [Símbolos `{$IFDEF}` fixos não batem com a configuração real] → aceito
  pelo ADR 0006; o conjunto fica num único módulo para ajuste.

## Migration Plan

Aditivo: nenhum comportamento existente muda. Rollback = remover o handler
`registerCallGraphHandler` e a chamada `callIndexCache.setProject`.

## Open Questions

- Lista final de símbolos padrão além do mínimo do spec (ex.: `VER350`,
  `CPUX86`): pode ser ajustada durante a implementação com base nas fixtures
  reais, sem mudar specs nem tasks.
