# Proposal

## Why

A aplicação Svelte atual (em `src/renderer/`) inicializa Welcome, GraphView e CommandPalette de forma descentralizada em `src/renderer/index.js`, espalhando listeners IPC e lógica de orquestração. Isso dificulta entender o fluxo de estado global e manutenção. 

Introduzir um componente `App.svelte` como raiz única de orquestração centraliza essa responsabilidade, tornando o fluxo de dados explícito e simplificando `index.js` para uma montagem mínima.

## What Changes

- **Novo componente** `src/renderer/components/App.svelte`: orquestra Welcome, GraphView, CommandPalette, centraliza listeners IPC do main process
- **Nova store** `src/renderer/stores/ui.js`: rastreia `viewMode` ('welcome' | 'graph'), permite transições de vista
- **Refactor de** `src/renderer/index.js`: reduzido para ~3 linhas (import App + mount), remove 100+ linhas de listeners e callbacks
- **index.html** simplificado: apenas `<div id="app">` como ponto de montagem único
- **Nenhuma breaking change**: a funcionalidade externa é idêntica; apenas reorganização interna

## Capabilities

### New Capabilities
- `renderer/app-root`: Componente raiz que orquestra sub-componentes Svelte (Welcome, GraphView, CommandPalette), centraliza listeners IPC do main process, e gerencia transições entre vistas ('welcome' → 'graph')

### Modified Capabilities

Nenhuma spec de comportamento muda — as features (command-palette, welcome-screen, root-unit-selection, etc.) funcionam exatamente igual. Apenas a arquitetura interna de renderização é refatorada.

## Impact

- **Código afetado**: `src/renderer/` (index.js, components/, stores/)
- **index.html**: simplificado
- **Teste**: Sem testes unitários novos esperados (App.svelte é glue, não lógica testável em domain/)
- **APIs**: Nenhuma API público-enfrentada muda; refactor interno
- **Dependências**: Nenhuma nova; usa Svelte existente + stores nativas
