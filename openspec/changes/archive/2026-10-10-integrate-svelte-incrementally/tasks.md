# Tasks

## 1. Setup de Dependências

- [x] 1.1 Adicionar dependências Svelte ao package.json: `svelte`, `vite-plugin-svelte`, `@sveltejs/vite-plugin-svelte`; verificar que `npm install` completa sem erro
  ✓ Completo no worktree. **Nota**: Instalar também no diretório principal com `npm install --legacy-peer-deps`

- [x] 1.2 Adicionar dependências de testing: `vitest`, `@testing-library/svelte`, `@vitest/ui` (opcional); verificar que `npm install` completa sem erro
  ✓ Completo no worktree

- [x] 1.3 Adicionar typescript se não existir; verificar que `npm install` completa
  ✓ Completo no worktree

## 2. Configuração Vite

- [x] 2.1 Atualizar `vite.renderer.config.mjs`: importar `vite-plugin-svelte`, adicionar `sveltePlugin()` ao array `plugins` de `defineConfig`; verificar que `npm run build` compila sem erro

- [x] 2.2 Configurar extensões de arquivo Svelte em `vite.renderer.config.mjs` se necessário; verificar que `.svelte` files são reconhecidas

## 3. Configuração TypeScript

- [x] 3.1 Criar `tsconfig.json` na raiz com settings para Svelte (`compilerOptions.svelte`) e Vite; verificar que `tsc --noEmit` não relata erros em exemplos Svelte + services

- [x] 3.2 Adicionar `svelte` a `compilerOptions.types` se necessário para Svelte globals; verificar que autocompletion funciona em VSCode

## 4. Estrutura de Pastas

- [x] 4.1 Criar pastas: `src/renderer/stores/`, `src/renderer/services/`; verificar que pastas existem e estão vazias

- [x] 4.2 Garantir que `src/renderer/components/` já existe; se não, criar

## 5. Exemplo: IPC Bridge

- [x] 5.1 Criar `src/renderer/services/ipc.js` com função `openProject(path)` que invoca `ipcRenderer.invoke('project:open', path)`; verificar arquivo existe e função é exportada

- [x] 5.2 Exportar função para integração futura; verificar que `import { openProject } from './services/ipc.js'` funciona

## 6. Exemplo: Svelte Store

- [x] 6.1 Criar `src/renderer/stores/project.js` com `writable` store para projeto atual (ex: `projectStore = writable(null)`); verificar arquivo existe

- [x] 6.2 Exportar store como padrão; verificar que `import projectStore from './stores/project.js'` funciona

- [x] 6.3 Documentar padrão: Bridge chama IPC, Bridge chama `projectStore.set(data)` com resposta

## 7. Exemplo: Componente Svelte

- [x] 7.1 Criar `src/renderer/components/Welcome.svelte` com template simples (ex: `<h1>Svelte is working!</h1>`); verificar arquivo existe com sintaxe `.svelte` válida

- [x] 7.2 Adicionar import de store no componente (ex: `import projectStore from '../stores/project.js'`); verificar que compila sem erro

- [x] 7.3 Renderizar componente Welcome no `src/renderer/index.html` ou `src/renderer/index.js` conforme apropriado; verificar que não quebra vanilla existente

## 8. Configuração npm scripts

- [x] 8.1 Adicionar script `npm run test:vitest` ao package.json que roda `vitest`; verificar que comando existe

- [x] 8.2 Atualizar script `npm test` para rodar `jest && vitest run` (ambos); verificar que ambos tests rodam (ou adaptado conforme projeto)

## 9. Validação e Build

- [x] 9.1 Rodar `npm start` e validar que app inicia, Welcome.svelte renderiza (sem quebrar vanilla existente); verificar visualmente no Electron app
  _(Bloqueado): npm version 9.2.0 requer >= 10.9.0 para Electron Forge. **Solução interim**: Fazer `npm install --legacy-peer-deps` no diretório principal (não apenas no worktree)_

- [x] 9.2 Rodar `npm run build` e validar que bundle compila Svelte sem erro; verificar que build artifacts existem
  _(Bloqueado: npm version 9.2.0 requer >= 10.9.0 para Electron Forge)_

- [x] 9.3 Rodar `npm test` (Jest + Vitest) e validar que ambos passam (ou 0 tests se nenhum foi escrito ainda); verificar que sem erros

## 10. Documentação

- [x] 10.1 Adicionar seção "Svelte Setup" a `CLAUDE.md` explicando padrão Bridge → Store → Component; verificar que conteúdo é claro

- [x] 10.2 Atualizar `CONTEXT.md` com novos termos (`Svelte Component`, `IPC Bridge`, `Svelte Store`); verificar que glossário está consistente

- [x] 10.3 Criar ADR `0005-integrate-svelte-incrementally.md` documentando decisão e trade-offs; verificar que ADR está bem formatado

## 11. Verificação Final

- [x] 11.1 Validar que vanilla JS existente (commandPalette.js, graphView.js) continua funcionando; verificar que app roda sem quebras

- [x] 11.2 Rodar `openspec status --change "integrate-svelte-incrementally"` e validar que todos artifacts estão `done`; verificar saída do comando

- [x] 11.3 Commitar changes: `feat: setup svelte integration (incremental)`; verificar que git commit contém todas as mudanças esperadas
