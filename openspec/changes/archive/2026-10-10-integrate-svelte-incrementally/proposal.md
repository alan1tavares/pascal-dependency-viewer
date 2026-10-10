# Proposal

## Why

O projeto começou com vanilla JavaScript puro (DOM manipulation direto, sem framework) e funcionou bem para 2 componentes. Porém, à medida que a interface cresce, o código fica mais frágil: estado implícito em variáveis de módulo, testes difíceis, refatoração arriscada. Queremos modernizar a camada UI sem interromper desenvolvimento. Uma reescrita full-stack é cara; uma migração incremental permite aprender padrão enquanto aproveita código vanilla existente.

## What Changes

- **Adiciona Svelte como framework UI progressivo**: Integra `vite-plugin-svelte` no build, permitindo componentes `.svelte` ao lado de vanilla `.js`.
- **Cria infraestrutura de estado reativo**: `svelte/store` para estado compartilhado (projeto atual, unidades carregadas, etc).
- **Define padrão de comunicação IPC**: Cria IPC Bridges em `src/renderer/services/` que envolvem `ipcRenderer.invoke`, desacoplando componentes de detalhes de inter-processo.
- **Adiciona TypeScript gradual**: Svelte + services/stores ganham tipos; código vanilla existente permanece em JavaScript puro por agora.
- **Adiciona Vitest + @testing-library/svelte**: Testing framework moderno para componentes Svelte, coexistindo com Jest para `src/domain/`.
- **Escopo inicial é setup apenas**: Cria pastas de estrutura, exemplos (Bridge, Store, componente Welcome.svelte), config Vite/TypeScript — **sem migração real** de componentes vanilla (CommandPalette, GraphView migram em branches temáticas futuras).

## Capabilities

### New Capabilities

- `rendering/svelte-setup`: Infraestrutura para componentes Svelte, IPC Bridges, e stores reativos. Define padrão de comunicação renderer ↔ main process via Bridge + Store, e organização de pastas (`src/renderer/components/`, `src/renderer/stores/`, `src/renderer/services/`).

### Modified Capabilities

Nenhuma — este setup não altera requisitos de capabilities existentes. Componentes vanilla (`command-palette`, `graph-view-filter`, etc) continuam funcionando igual, apenas coexistem com Svelte agora.

## Impact

- **Build**: Vite adquire `vite-plugin-svelte`, novo `vite.renderer.config.mjs`, novo `tsconfig.json`.
- **Dependencies**: `svelte`, `vite-plugin-svelte`, `vitest`, `@testing-library/svelte`, `@sveltejs/vite-plugin-svelte` (opcional).
- **Testing**: `npm test` roda Jest + Vitest; `npm run test:vitest` roda apenas Vitest.
- **Padrão**: Novos componentes Svelte por padrão; vanilla migra incrementalmente em future branches.
- **Não-breaking**: Preload API, IPC handlers, main process — nenhuma mudança. Renderer continua funcionando com vanilla até migração.
