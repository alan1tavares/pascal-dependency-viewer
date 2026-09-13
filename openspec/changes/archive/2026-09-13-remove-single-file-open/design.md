## Context

O menu `File` hoje tem duas opções (`src/main/menu.js`): `Open` (fluxo de
`.pas` avulso) e `Open Project` (fluxo de `.dpr` com Root Unit
selection). Os dois fluxos são independentes — não compartilham estado
em disco nem uma tela comum — e se comunicam com o renderer por
caminhos diferentes:

- `Open` → `performOpenFile` (`src/main/ipc/file.js`) →
  `mountDependenceGraphStructure` → `mainWindow.webContents.send('app:graph-loaded', ...)`
  → `onGraphLoaded` (`src/preload/api.js`) → `renderGraph` direto em
  `src/renderer/index.js`.
- `Open Project` → `performOpenProject` → `app:project-loaded` →
  `renderRootUnitSelection`; a escolha de uma Root Unit então chama
  `expandFromRootUnit` via `ipcRenderer.invoke` e renderiza o resultado
  diretamente (sem passar por `app:graph-loaded`).

Ver `proposal.md` para o motivo da remoção. Este documento cobre só as
decisões de "como remover" que não são óbvias.

## Goals / Non-Goals

**Goals:**
- Remover inteiramente o código do fluxo de `.pas` avulso (menu, IPC,
  preload, renderer, domínio), sem deixar código morto para trás.
- Manter o fluxo de `Open Project` / Root Unit selection funcionando
  exatamente como hoje.

**Non-Goals:**
- Não estamos redesenhando o menu `File` além de remover a opção `Open`.
- Não estamos alterando o formato `{ nodes, edges }` nem a lógica de
  classificação Project/External Unit usada por `expandDependencyGraph`.

## Decisions

**Remover `mountDependenceGraphStructure` e seu teste, não apenas
deixá-los sem uso.** A função só é chamada por `performOpenFile`
(confirmado via busca no repo). Depois da remoção do fluxo de arquivo
avulso ela fica sem nenhum chamador em produção. Alternativa
considerada: manter a função "para o caso de precisar de novo" — rejeitada
porque contraria a diretriz do projeto de não manter código morto/
especulativo; se o fluxo de 1 nível voltar a ser necessário, o histórico
do git tem a implementação.
Como consequência, a requirement de `dependency-graph-expansion` que cita
`mountDependenceGraphStructure` como referência de formato precisa de uma
delta MODIFIED (já incluída em `specs/dependency-graph-expansion/spec.md`
deste change) para não referenciar uma função removida.

**Remover `app:graph-loaded` / `onGraphLoaded` inteiramente, em vez de
deixá-los sem uso.** Esse evento e listener só existem para o fluxo de
arquivo avulso — `expandFromRootUnit` já renderiza seu resultado
diretamente via `await` + `renderGraph`, sem depender de um push
`webContents.send`. Não há outro chamador previsto para justificar
mantê-los.

**Não introduzir um "shared/" ou abstração de menu.** O menu tem uma
única opção depois da remoção; não há necessidade de generalizar
`buildMenu` além de remover o item.

## Risks / Trade-offs

- [Risco] Algum teste manual ou automatizado ainda referencia
  `window.pascalDependencyViewer.openFile()` ou `onGraphLoaded` →
  Mitigação: `tasks.md` inclui um passo explícito de busca por essas
  strings no repo inteiro (não só em `src/`) antes de considerar a
  remoção completa.
- [Risco] `CONTEXT.md` menciona o fluxo `File > Open` avulso na definição
  de "Dependency Graph" (contraste explícito com o fluxo completo) → não
  é um artefato de spec, mas fica desatualizado após esta mudança.
  Mitigação: `tasks.md` inclui um passo para atualizar essa definição,
  fora do fluxo de artefatos OpenSpec.
