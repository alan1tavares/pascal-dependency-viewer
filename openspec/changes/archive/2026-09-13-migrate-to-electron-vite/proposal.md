## Why

O projeto usa hoje uma estrutura de Electron "manual": `main.js` na raiz, `index.html` com `<script>` inline que faz `require()` direto de `vis-network`, `vis-data` e `electron-store` (só funciona com `nodeIntegration: true` + `contextIsolation: false`), sem bundler, sem hot-reload e sem um scaffold padronizado de build/empacotamento. Migrar para o scaffold oficial `create-electron-app@latest --template=vite` traz Vite (dev server com HMR, build otimizado) e Electron Forge (empacotamento/distribuição) prontos, reduzindo a manutenção do setup do zero e alinhando o projeto com o caminho recomendado pela própria Electron para apps novos.

## What Changes

- Substituir o bootstrap manual (`main.js` + `electron .` via script `start`) pelo scaffold gerado por `create-electron-app@latest --template=vite`, que traz Electron Forge + Vite (processos main, preload e renderer com configs Vite próprias).
- **BREAKING**: Introduzir um `preload.js` com `contextBridge` e desligar `nodeIntegration`/religar `contextIsolation` no `BrowserWindow`, já que o template Vite parte desse modelo mais seguro. O `<script>` inline de `index.html` que hoje faz `require('vis-network')`, `require('vis-data')`, `require('electron-store')` e `require('fs')`/`require('path')` direto no renderer deixa de funcionar e precisa ser reescrito como módulo importado (`import`) pelo renderer, com o acesso a `fs`/`path`/`electron-store` exposto via preload/IPC em vez de `require` direto no DOM.
- **BREAKING**: Substituir o canal de comunicação hoje baseado em `electron-store` como blob compartilhado entre main e renderer (escrito pelo main, lido pelo renderer no load, limpo no fechamento da janela) por IPC (`ipcMain`/`ipcRenderer` via preload), que é o padrão do template Forge+Vite. `mountDependenceGraphStructure`, `reloadMainWindow()` e a leitura de `nodes`/`edges`/`view`/`projectUnits`/`projectDir` do `electron-store` em `index.html` precisam ser adaptados para esse novo canal.
- Mover `index.html` e o código hoje inline nele para a estrutura de pastas do template (`src/renderer` ou equivalente gerado pelo Forge+Vite), preservando a lógica de `renderGraph`, `selectRootUnit`, `renderRootUnitList` e `renderRootUnitSelection` como módulos JS importáveis em vez de script solto.
- Atualizar `package.json`: trocar o script `start` (`electron .`) pelos scripts gerados pelo Forge (`start`, `package`, `make`, `publish`), e revisar as dependências (`electron`, `electron-store`, `vis-data`, `vis-network`) para as versões/posicionamento exigidos pelo template.
- Preservar sem alterações a camada de modelo puro (`src/model/**`) e os testes Jest (`src/test/**`), que não têm dependência de Electron e não devem ser afetados pela migração de bootstrap/build.
- Atualizar `CLAUDE.md` para refletir a nova arquitetura de processos (main/preload/renderer via Vite) depois que a migração for concluída.

## Capabilities

### New Capabilities

(nenhuma — esta mudança não introduz comportamento novo para o usuário)

### Modified Capabilities

(nenhuma — o comportamento observável do app, o parsing de Pascal e a renderização do grafo permanecem os mesmos; o que muda é só a infraestrutura de build/empacotamento e o mecanismo interno de comunicação entre processos)

## Impact

- **Código afetado**: `main.js` (removido/substituído pelo entry point gerado pelo Forge), `index.html` (script inline migra para módulo(s) de renderer), `src/components/Main/**` (criação de janela e menu, adaptado para preload/contextIsolation), `package.json` (scripts e dependências).
- **Não afetado**: `src/model/**` (parsing, expansão de grafo, classificação de units) e `src/test/**` (suíte Jest), por não dependerem de Electron.
- **Dependências**: adiciona Electron Forge (`@electron-forge/cli` e plugins, incluindo o plugin Vite) como devDependency. `electron-store` foi removida do projeto (ver `design.md` - Non-Goals): a migração do canal main↔renderer para IPC eliminou a necessidade de qualquer estado persistido entre telas.
- **Build/empacotamento**: passa a existir um pipeline de dev (`vite` + `electron-forge start`) e de empacotamento (`electron-forge package`/`make`) onde antes só havia `electron .`.
- **Documentação**: `CLAUDE.md` precisa ser atualizado após a migração para descrever a nova divisão main/preload/renderer.
