# Tasks

## 1. Fixtures

- [x] 1.1 Criar `src/domain/test/fixtures/callGraph/` com um mini-Project Delphi (`.dpr`, 5–8 `.pas`, um `.dfm` texto e um `.dfm` binário) que exercite: chamadas entre Units, `Self` implícito, encadeamento de retorno, `with`, cast, `inherited`, virtual/override, interface, genérico próprio, `TObjectList<T>`, rotina aninhada, recursão direta, ciclo mútuo, `initialization`, handler de `.dfm`, atribuição a evento, `{$IFDEF}` e uma Unit com sintaxe inválida. Verificar que os arquivos existem e que o `.dpr` lista as Units com `in '...'`
- [x] 1.2 Copiar o projeto real Cine Tapioca (https://github.com/alan1tavares/cine-tapioca, do próprio autor do app; commit `2b63d921dca6110b6936c6c6d0a47749ab79f55a`) para `src/domain/test/fixtures/cineTapioca/`: `CineTapioca.dpr` e os 14 `.pas` com os 13 `.dfm` (texto, VCL, com herança de formulário via `inherited` a partir de `uCadastroBase`), sem `.dproj`/`.res`. Registrar a origem e o commit num `README.md` da pasta. É uma cópia versionada, não submódulo nem clone no teste, para manter a suíte offline e determinística. Verificar que os arquivos estão versionados e que o `.dpr` lista as 14 Units com `in '...'`

## 2. Pré-processador e lexer

- [x] 2.1 Implementar `src/domain/pascalParser/preprocess.js` (design D1) com o conjunto fixo de símbolos padrão, `{$DEFINE}`/`{$UNDEF}`, aninhamento e as formas `{$...}`/`(*$...*)`, preservando linhas para manter as posições. Verificar com `src/domain/test/preprocess.test.js` cobrindo os quatro cenários do requisito de diretivas condicionais
- [x] 2.2 Implementar `src/domain/pascalParser/lexer.js` com tokens case-insensitive, linha/coluna, comentários `//`/`{}`/`(* *)`, strings com `''` e `#13`, números (hex `$FF`, reais) e operadores. Verificar com `src/domain/test/lexer.test.js`, incluindo o cenário "chamada dentro de comentário ou string é ignorada"

## 3. Parser

- [x] 3.1 Implementar em `src/domain/pascalParser/parser.js` a estrutura de Unit (seções, `uses`, `{$R}`) e de Program (`.dpr` com bloco principal), com `ParseError` contendo linha/coluna. Verificar com `src/domain/test/parser.test.js` (Unit de formulário VCL e bloco principal do Project)
- [x] 3.2 Acrescentar declarações de tipos: classes (ancestral, interfaces, seções de visibilidade, campos, métodos com diretivas, properties indexadas/`default`), records, interfaces, class helpers, genéricos com constraints, aliases, tipos procedurais/`of object`/`reference to`. Verificar com testes de parser por construto
- [x] 3.3 Acrescentar corpos de routines: variáveis/constantes locais, rotinas aninhadas, anonymous methods e todas as instruções (atribuição, chamada, `if`, `case`, `for`/`for..in`, `while`, `repeat`, `with`, `try`/`except`/`finally`, `raise`, `inherited`, `exit`, `asm` opaco) e expressões com designadores (`a.b[i].c(x)`, `@x`, `x as T`, `T(x)`). Verificar com testes de parser por construto
- [x] 3.4 Implementar `src/domain/methods/` (`listUnitMethods` e o formato de `id`, design D1), cobrindo os cinco cenários do requisito "Extração dos Methods de uma Unit". Verificar com `src/domain/test/listUnitMethods.test.js`
- [x] 3.5 Rodar o parser sobre todas as fixtures (`fixtures/callGraph` e `fixtures/cineTapioca`) e corrigir as lacunas até a única falha ser a Unit inválida proposital; todas as Units do Cine Tapioca devem ser analisadas sem falha. Verificar com `src/domain/test/parserRobustness.test.js`

## 4. Resolvedor e índice de chamadas

- [x] 4.1 Implementar `src/domain/callIndex/rtlStubs.js` (design D10) com os containers listados no spec e verificar que o fonte dos stubs passa pelo parser sem erro
- [x] 4.2 Implementar `src/domain/callIndex/symbols.js`, a primeira passada da resolução (design D2): tabela global com tipos, ancestrais, interfaces, membros, routines soltas e visibilidade `interface`/`implementation`. Verificar com testes que consultam membros herdados e routines visíveis via `uses`
- [x] 4.3 Implementar `src/domain/callIndex/resolver.js`, a segunda passada (design D2): pilha de escopos, `Self` implícito, `inherited`, `with`, casts, encadeamentos, indexadores/`default`, `for..in`, genéricos e qualificação por Unit; receptor não resolvido não gera registro. Verificar com `src/domain/test/resolver.test.js` cobrindo todos os cenários de "Resolução de tipos do receptor"
- [x] 4.4 Classificar chamada × referência (design D3) e marcar Entry Points por referência. Verificar com os cenários "Atribuição a evento" e "Método passado como parâmetro"
- [x] 4.5 Implementar Polymorphic Calls (design D4) para virtual/override e interfaces. Verificar com os três cenários de "Polymorphic Calls"
- [x] 4.6 Implementar `src/domain/callIndex/dfm.js` (design D9), com detecção de binário. Verificar com `src/domain/test/dfm.test.js` (handler aninhado, `inherited`/`inline`, arquivo binário e ausente)
- [x] 4.7 Implementar `buildCallIndex({ dprPath, projectUnits, readFile })` (design D5/D6): async, cede o loop por Unit, inclui bloco principal e `initialization`/`finalization`, atribui chamadas aninhadas ao Method envolvente, registra `skippedUnits` e nunca lê External Units. Verificar com `src/domain/test/buildCallIndex.test.js` sobre a fixture `callGraph` (todos os cenários de "Índice de chamadas do Project", "Handlers de formulário" e "Blocos especiais", mais um `readFile` espião que não recebe External Units)

## 5. Expansão do Caller Graph

- [x] 5.1 Implementar `src/domain/expandCallerGraph/index.js` (DFS determinística, nós únicos, self-loops, back-edges, deduplicação de arestas com prioridade para a direta, marcações de nó e `skippedUnits`). Verificar com `src/domain/test/expandCallerGraph.test.js` cobrindo todos os cenários do spec `caller-graph-expansion`, usando índices montados à mão
- [x] 5.2 Teste de integração do domínio: `buildCallIndex` + `expandCallerGraph` sobre a fixture `callGraph` para três Target Methods (cadeia com handler de `.dfm`, recursão, ciclo mútuo). Verificar com `npx vitest run src/domain/test/callerGraph.integration.test.js`
- [x] 5.3 Teste de integração sobre o Cine Tapioca: `buildCallIndex` + `expandCallerGraph` no projeto inteiro, com `skippedUnits` vazio e pelo menos três Target Methods cujos Callers foram conferidos à mão no fonte. Os Target Methods devem cobrir: um Method chamado pelo bloco principal do `.dpr` (ex.: `TdmConn.Conecta`, nó `Programa` como Entry Point), um handler ligado em `.dfm` de um formulário herdado de `uCadastroBase` e um handler de `uCadastroBase` alcançado por `inherited` a partir de um handler de formulário filho (ex.: em `uCadastroSessoes`). Incluir também `TfmCadastroSessoes.ValidarDados` como Target Method: `TfmCadastroBase.ValidarDados` é `virtual` e chamado por `TfmCadastroBase.Save`, então o grafo deve ter a aresta `TfmCadastroBase.Save → TfmCadastroSessoes.ValidarDados` com `isPolymorphic: true` e `viaLabel: TfmCadastroBase.ValidarDados`, subindo até os handlers `btSalvarClick` e `FormKeyDown`. Verificar com `npx vitest run src/domain/test/cineTapioca.integration.test.js`

## 6. Main process e IPC

- [x] 6.1 Implementar `src/main/services/callIndexCache.js` (design D7) com `setProject`/`getIndex`, montagem única compartilhada, descarte por `generation` e erros `NO_PROJECT`/`PROJECT_REPLACED`. Verificar com `src/main/test/callIndexCache.test.js` cobrindo os cenários dos requisitos "Índice montado sob demanda" e "Índice descartado ao carregar outro Project", com `buildCallIndex` mockado e controlável
- [x] 6.2 Em `src/main/ipc/project.js`, fazer `loadProject` chamar `callIndexCache.setProject({ dprPath, projectDir, projectUnits })` só depois do parse do `.dpr` dar certo, sem mudar o retorno. Verificar atualizando `src/main/test/project.test.js` (inclusive: falha de parse não troca o Project do cache)
- [x] 6.3 Criar `src/main/ipc/callGraph.js` com os handlers `methods:list` e `callerGraph:expand` (design D8) e registrá-lo em `src/main/index.js`. Verificar com `src/main/test/callGraph.test.js` cobrindo os cenários dos dois requisitos de canal (incluindo Unit não analisada e `METHOD_NOT_FOUND`)
- [x] 6.4 Expor `listUnitMethods(unitName)` e `expandCallerGraph(methodId)` em `src/preload/api.js` e no stub do preload dos testes e2e (`e2e/support/rendererHarness.ts`). Verificar que `npm test` passa e que, no app (`npm start`), `await window.pascalDependencyViewer.listUnitMethods('<Unit>')` no DevTools devolve a lista depois de abrir um `.dpr`

## 7. Fechamento

- [x] 7.1 Atualizar o `CLAUDE.md` (Architecture: novos módulos do domínio, `callIndexCache`, canais IPC, e o fato de o main agora guardar estado do Project, referenciando o ADR 0007). Verificar relendo a seção
- [x] 7.2 Medir o tempo de `buildCallIndex` sobre a fixture `cineTapioca` e registrar o resultado no PR; se alguma Unit isolada passar de ~200 ms, abrir uma issue para a migração para `utilityProcess` (design D6). Verificar que o número aparece na descrição do PR
- [x] 7.3 Rodar `npm test` e `openspec validate pascal-parser-and-call-index --strict` e verificar que os dois passam
