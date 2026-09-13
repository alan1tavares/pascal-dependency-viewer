## Context

See `proposal.md` for motivation and `docs/adr/0002-src-layout-main-preload-renderer-domain.md`
for the decision itself (JS puro, sem framework, sem `shared/`, `domain/` como
pasta irmã). Este documento cobre só o "como" — em particular um detalhe do
pipeline de build do Electron Forge + Vite que não é óbvio a partir do código
atual e que, se ignorado, quebra o app silenciosamente.

Hoje `src/main.js` e `src/preload.js` compilam, via
`@electron-forge/plugin-vite`, para o mesmo diretório de saída
(`.vite/build/`, ver `getBuildConfig` em
`node_modules/@electron-forge/plugin-vite/dist/config/vite.base.config.js`),
cada um com um nome de arquivo derivado do **basename do arquivo-fonte**:
`vite.main.config.mjs` usa `build.lib.fileName: () => '[name].js'` e
`vite.preload.config.mjs` usa `rollupOptions.output.entryFileNames: '[name].js'`.
Como os basenames hoje são distintos (`main`, `preload`), os arquivos gerados
também são (`main.js`, `preload.js`) — é isso que permite
`src/main.js`'s `path.join(__dirname, "preload.js")` encontrar o preload
compilado em tempo de execução.

## Goals / Non-Goals

**Goals:**
- Aplicar a estrutura de `docs/adr/0002-...md` sem quebrar `npm test`,
  `npm start` ou `npm run package`.
- Preservar exatamente o comportamento atual (mesmos 3 canais IPC, mesmas 3
  telas, mesmo parsing).

**Non-Goals:**
- Não introduz TypeScript, framework de UI, `shared/`, nem qualquer conteúdo
  novo em `services/` além do que já existe hoje (`fs`) — ver ADR 0002.
- Não modifica nenhum arquivo de `src/domain/**` além do caminho (mesmo
  conteúdo, mesmas funções, mesmos testes).

## Decisions

### 1. Divisão de `main.js` por responsabilidade

- `main/services/fileSystem.js`: exporta `readFile(filePath)`, um wrapper
  fino sobre `fs.readFileSync(filePath, 'utf-8')` — substitui as três
  chamadas inline hoje espalhadas em `performOpenFile`/`performOpenProject`/
  `performExpandFromRootUnit`.
- `main/ipc/file.js`: exporta `performOpenFile` (a função, para reuso pelo
  menu — ver abaixo) e `registerFileHandler(ipcMain)`, que faz
  `ipcMain.handle('openFile', () => performOpenFile())`. Usa `getUnitName`,
  `selectUsesFromSource` e `mountDependenceGraphStructure` de `domain/`.
- `main/ipc/project.js`: mesma forma para `'openProject'`/
  `performOpenProject`. Usa `parseDprSource` de `domain/`.
- `main/ipc/graph.js`: mesma forma para `'expandFromRootUnit'`/
  `performExpandFromRootUnit` — este não precisa ser reexportado para o menu
  (só é acionado via IPC, nunca pelo menu nativo), então só exporta
  `registerGraphHandler(ipcMain)`. Usa `getUnitName` e `expandDependencyGraph`
  de `domain/`.
- `main/menu.js`: exporta `buildMenu(mainWindow, { performOpenFile, performOpenProject })`.
  Hoje `buildMenu` fecha sobre a variável `mainWindow` do módulo; extraído
  para seu próprio arquivo, ele deixa de ter esse closure e passa a receber
  `mainWindow` (e as duas funções `performOpenX`, já exportadas pelos módulos
  de `ipc/` acima) como parâmetros explícitos.
- `main/index.js`: cria a janela, chama `buildMenu(mainWindow, { performOpenFile, performOpenProject })`
  e cada `registerXHandler(ipcMain)`. Mantém `app.whenReady()`,
  `createWindow()`, o handler de `window-all-closed` e o check do
  `electron-squirrel-startup`.

### 2. Divisão de `preload.js`

`preload/api.js` exporta o objeto hoje passado para
`contextBridge.exposeInMainWorld` (mesmas 5 chaves); `preload/index.js`
importa `contextBridge` + esse objeto e faz a chamada.

### 3. Divisão de `renderer.js`

`renderer/components/graphView.js` exporta `renderGraph(nodesData, edgesData)`
(igual a hoje). `renderer/components/rootUnitSelection.js` exporta
`renderRootUnitSelection(projectUnits, projectDir)`, mantém
`renderRootUnitList`/`selectRootUnit` como funções internas, e importa
`renderGraph` de `./graphView.js` (é chamado depois de
`api.expandFromRootUnit`). `renderer/index.js` é o entrypoint: pega
`window.pascalDependencyViewer`, importa os dois componentes e liga
`api.onGraphLoaded`/`api.onProjectLoaded`.

### 4. `domain/` é uma renomeação pura, sem tocar imports internos

`git mv src/model src/domain` e `git mv src/test src/domain/test`. Os imports
**entre** módulos de `domain/**` (ex.: `mountDependenceGraphStructure/index.js`
importando `../classifyExternalUnits/index.js`) não mudam — são relativos a
pastas irmãs dentro de `domain/`, e essa relação não muda com a renomeação.
O que muda:
- Os testes, que hoje fazem `import X from '../model/Y/index.js'`
  (`src/test/` → `src/model/`), passam a fazer `import X from '../Y/index.js'`
  (`domain/test/` → `domain/Y/`, um nível mais raso, já que `test/` agora é
  irmã de cada pasta de módulo dentro de `domain/`, não irmã de `domain/`
  em si).
- Os fixtures `.pas`/`.dpr` continuam lidos via
  `join(import.meta.dirname, 'nomeDoFixture')` — como o arquivo de teste e o
  fixture se movem juntos para `domain/test/`, nada muda nessa resolução.
- Quem hoje importa de `./model/...` a partir de `src/main.js` (um nível
  acima de `model/`) passa a importar de `../../domain/...` a partir de
  `src/main/ipc/*.js` (dois níveis acima de `domain/`).

### 5. Nomes de arquivo de build fixados em `vite.main.config.mjs`/`vite.preload.config.mjs`

`src/main/index.js` e `src/preload/index.js` compartilham o mesmo basename
(`index`). Sem intervenção, os dois compilariam para o mesmo arquivo
`.vite/build/index.js` (mesmo `outDir`, `[name].js` derivado do basename do
fonte, `emptyOutDir: false` — o segundo build simplesmente sobrescreve o
primeiro), quebrando `path.join(__dirname, "preload.js")` em `main/index.js`
e, com isso, o app inteiro — de um jeito que nenhum teste unitário pega.

Decisão: fixar o nome de saída explicitamente em cada config, em vez de
renomear os arquivos-fonte (o que contrariaria a estrutura já decidida no
ADR 0002):

```js
// vite.main.config.mjs
export default defineConfig({
  build: {
    lib: {
      // O template de config do plugin (vite.main.config.js dentro de
      // @electron-forge/plugin-vite) só preenche `entry`/`formats`
      // automaticamente quando `build.lib` está totalmente ausente aqui.
      // Como precisamos customizar `fileName`, temos que fornecer o `lib`
      // inteiro — `entry` precisa bater com o `entry` deste target em
      // forge.config.js. Omitir `entry`/`formats` e só passar `fileName`
      // faz `libOptions.entry` ficar `undefined`, e o build quebra com
      // `TypeError: Cannot convert undefined or null to object` dentro do
      // Vite (`Object.entries(libOptions.entry)`).
      entry: 'src/main/index.js',
      fileName: () => 'main.js',
      formats: ['cjs'],
    },
  },
});
```

```js
// vite.preload.config.mjs
export default defineConfig({
  build: { rollupOptions: { output: { entryFileNames: 'preload.js' } } },
});
```

(O template de preload não tem o mesmo guard — define
`rollupOptions.input`/`output` incondicionalmente — então não sofre do
mesmo problema; só o `main` precisa do `lib` completo.)

Com isso, `main/index.js` continua podendo fazer
`path.join(__dirname, "preload.js")` sem nenhuma mudança nessa linha — os
arquivos compilados continuam se chamando exatamente como hoje, só o
fonte que os gera mudou de lugar. Isso corrige uma afirmação do
`proposal.md` (que dizia não haver impacto nesses dois arquivos de config);
o `proposal.md` foi atualizado.

## Risks / Trade-offs

- [Risco] Colisão de nome de build main/preload (acima) → Mitigação: nomes
  de saída fixados explicitamente (Decisão 5); verificado rodando
  `npm run package` e conferindo que `.vite/build/main.js` e
  `.vite/build/preload.js` existem como dois arquivos distintos.
- [Risco] ~15 arquivos mudando de profundidade de pasta é fácil de errar um
  `../` a mais ou a menos na migração manual → Mitigação: depois de cada
  grupo de tarefas (main/, preload/, renderer/, domain/), rodar `npm test` e
  `npm run package` antes de seguir para o próximo grupo — mesma disciplina
  usada na migração para ESM.
- [Risco] `CLAUDE.md` descreve fluxo de dados e caminhos de arquivo
  específicos (`src/main.js`, `src/model/**`) que ficam errados assim que os
  arquivos se movem → Mitigação: reescrita da seção Arquitetura é uma tarefa
  explícita, não um retoque incidental; inclui também corrigir duas frases
  da seção Notes já desatualizadas por uma migração anterior (menção a
  `src/model/**` ser CommonJS e a `commonjsOptions.include`, ambas falsas
  desde a migração para ESM).

## Migration Plan

1. `domain/`: `git mv src/model src/domain`, `git mv src/test src/domain/test`,
   atualizar os imports dos arquivos de teste (`../model/` → `../`).
   Rodar `npm test` (deve passar sem tocar em `src/main.js` ainda, que
   segue importando do caminho antigo até o passo 4 — então este passo
   intermediário quebra `main.js`; ver ordem real em `tasks.md`, que resolve
   isso fazendo a migração de `domain/` e a atualização de `main/` no mesmo
   grupo de tarefas antes de validar).
2. `preload/`: criar `api.js` + `index.js`, apagar `src/preload.js`.
3. `renderer/`: criar `components/graphView.js` + `components/rootUnitSelection.js`
   + `index.js`, apagar `src/renderer.js`, atualizar `index.html`.
4. `main/`: criar `services/fileSystem.js`, `ipc/{file,project,graph}.js`,
   `menu.js`, `index.js` (importando de `../domain/...`), apagar
   `src/main.js`.
5. `forge.config.js`: atualizar os dois `entry`. `vite.main.config.mjs`/
   `vite.preload.config.mjs`: fixar `fileName`/`entryFileNames` (Decisão 5).
6. `CLAUDE.md`: reescrever a seção Arquitetura e corrigir as duas frases
   desatualizadas na seção Notes.
7. Validar: `npm test`, `npm start` (fluxo completo: Open, Open Project,
   selecionar Root Unit, expandir grafo), `npm run package`.

Rollback: reverter o commit — mudança mecânica de organização de arquivos,
sem migração de dados.
