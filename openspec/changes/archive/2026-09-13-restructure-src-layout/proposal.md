## Why

`src/main.js`, `src/preload.js` e `src/renderer.js` cresceram como três
arquivos únicos que misturam responsabilidades diferentes (em `main.js`:
criação de janela, menu, registro dos três handlers de IPC e a lógica de
cada um, tudo inline). Não há uma pasta que separe "abrir um handler de IPC
novo" de "montar a janela" ou "montar o menu". A decisão de reestruturar
isso — e de manter o projeto em JavaScript puro, sem framework de UI, sem
`shared/` — já foi tomada e registrada em
`docs/adr/0002-src-layout-main-preload-renderer-domain.md`; este change
aplica essa decisão.

## What Changes

- `src/main.js` vira `src/main/index.js` (só cria a janela, chama
  `buildMenu()` e registra os handlers de `main/ipc/`), com a lógica de cada
  handler extraída para `main/ipc/file.js`, `main/ipc/project.js` e
  `main/ipc/graph.js`, o acesso a `node:fs` extraído para
  `main/services/fileSystem.js`, e `buildMenu()` extraído para `main/menu.js`.
- `src/preload.js` vira `src/preload/index.js` (só a chamada a
  `contextBridge.exposeInMainWorld`) + `src/preload/api.js` (o objeto
  exposto).
- `src/renderer.js` vira `src/renderer/index.js` (entrypoint, escuta os
  eventos IPC) + `src/renderer/components/rootUnitSelection.js` +
  `src/renderer/components/graphView.js` (um arquivo por tela).
- `src/model/**` vira `src/domain/**` — mesmo conteúdo, mesma forma de
  pasta-por-módulo, só renomeado; `src/test/**` vira `src/domain/test/**`
  (fixtures `.pas`/`.dpr` inclusos).
- `forge.config.js` (`entry: 'src/main.js'` → `src/main/index.js`,
  `entry: 'src/preload.js'` → `src/preload/index.js`) e `index.html`
  (`src="/src/renderer.js"` → `/src/renderer/index.js`) atualizados para os
  novos caminhos.
- `vite.main.config.mjs` e `vite.preload.config.mjs` ganham um `fileName`/
  `entryFileNames` fixo (`main.js`/`preload.js`) — sem isso, os dois entry
  points passariam a compartilhar o basename `index` e colidiriam no mesmo
  arquivo de saída (`.vite/build/index.js`); ver design.md, Decisão 5.
- `CLAUDE.md`, seção Arquitetura, reescrita para descrever a nova estrutura
  — inclui corrigir duas frases já desatualizadas por uma migração anterior
  (menção a `src/model/**` ser CommonJS e a `vite.main.config.mjs` precisar
  de `commonjsOptions.include`, ambas já falsas desde a migração para ESM).
- Nenhuma mudança de comportamento observável do aplicativo: as mesmas 3
  telas, os mesmos 3 canais IPC, o mesmo parsing, os mesmos testes (só
  movidos de lugar).
- Não introduz TypeScript, framework de UI (React/Vue/etc.), pasta `shared/`
  nem `services/db`, `services/updater`, `services/nativeModules` — nenhum
  desses existe hoje e nenhum foi pedido (ver ADR 0002 para as alternativas
  consideradas e rejeitadas).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. Reestruturação puramente de organização de arquivos/módulos —
não altera nenhum requisito de comportamento das capacidades existentes
(`dependency-graph-expansion`, `dpr-project-parsing`,
`external-unit-classification`, `graph-canvas-layout`, `root-unit-selection`,
`uses-clause-scope`). `skip_specs: true` foi definido em `.openspec.yaml`.

## Impact

- **Código afetado**: `src/main.js`, `src/preload.js`, `src/renderer.js`
  (removidos, substituídos pelas novas pastas), `src/model/**` (8 arquivos,
  renomeados para `src/domain/**`), `src/test/**` (5 testes + 3 fixtures,
  movidos para `src/domain/test/**`).
- **Configuração**: `forge.config.js` (dois `entry` atualizados),
  `index.html` (um `src` de `<script>` atualizado), `vite.main.config.mjs`
  e `vite.preload.config.mjs` (nome de saída fixado, ver acima).
  `src/package.json` (`{ "type": "module" }`) permanece — continua
  escopando ESM nativo para tudo sob `src/`, agora incluindo as novas
  subpastas.
- **Documentação**: `CLAUDE.md` reescrito; `docs/adr/0002-...md` já existe e
  é a referência da decisão.
- **Sem impacto** em `vite.renderer.config.mjs`, `jest.config.js`,
  dependências do `package.json`, ou no comportamento funcional do app.
