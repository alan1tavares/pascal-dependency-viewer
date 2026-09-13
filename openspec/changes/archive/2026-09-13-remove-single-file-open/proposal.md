## Why

O menu `File` oferece dois pontos de entrada: `Open` (abre um `.pas`
avulso e mostra só ele e suas dependências diretas) e `Open Project`
(abre um `.dpr` e permite expandir o Dependency Graph completo a partir
de uma Root Unit). O fluxo de arquivo avulso não faz mais parte do
escopo do projeto — todo uso real passa por um `.dpr` — e mantê-lo
significa complexidade sem benefício: um segundo caminho de código, IPC
e listener de renderer para manter e testar.

## What Changes

- **BREAKING**: Remove a opção `Open` do menu `File`, junto com todo o
  código que ela aciona: `performOpenFile`/`registerFileHandler`
  (`src/main/ipc/file.js`), o handler IPC `openFile`, o método
  `openFile` exposto em `window.pascalDependencyViewer`
  (`src/preload/api.js`), o evento `app:graph-loaded` e o listener
  `onGraphLoaded` (`src/preload/api.js`, `src/renderer/index.js`).
- O menu `File` passa a ter apenas a opção `Open Project`.
- `mountDependenceGraphStructure` (usado só por `performOpenFile`) fica
  sem nenhum chamador e é removido junto com `src/main/ipc/file.js`;
  `readFile`/`getUnitName`/`selectUsesFromSource` continuam em uso pelo
  fluxo de Projeto.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `root-unit-selection`: a Requirement "Abertura de um Projeto (`.dpr`)
  pelo menu" deixa de descrever `Open Project` como "separada da opção
  existente de abrir um `.pas` avulso", já que essa opção não existe
  mais. A Requirement "Isolamento de estado entre o fluxo de Projeto e o
  fluxo de arquivo avulso" é removida — não há mais um fluxo de arquivo
  avulso para isolar.
- `dependency-graph-expansion`: a Requirement "Expansão recursiva de um
  Root Unit em um Dependency Graph" descreve o formato de retorno citando
  `mountDependenceGraphStructure` como referência de comparação; como
  essa função é removida junto com o fluxo de arquivo avulso, o texto da
  requirement é atualizado para descrever o formato (`{ nodes, edges }`)
  sem depender do nome de uma função que deixa de existir. O
  comportamento da expansão em si não muda.

## Impact

- Código: `src/main/menu.js`, `src/main/index.js`, `src/main/ipc/file.js`
  (removido), `src/preload/api.js`, `src/preload/index.js` (se expuser
  `onGraphLoaded`/`openFile` diretamente), `src/renderer/index.js`,
  `src/domain/mountDependenceGraphStructure/` (fica sem chamador em
  produção — mantido ou removido conforme decisão em design.md).
- Testes: qualquer teste existente para `performOpenFile`,
  `mountDependenceGraphStructure` ou o listener `onGraphLoaded` precisa
  ser removido ou ajustado.
- Documentação: `CONTEXT.md` menciona o fluxo `File > Open` avulso na
  definição de "Dependency Graph" e precisa de ajuste fora deste change
  (não é um artefato de spec).
