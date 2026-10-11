# Proposal

## Why

A estratégia do projeto é migrar incrementalmente de componentes vanilla JavaScript para Svelte, aproveitar o sistema reativo nativo do framework e garantir consistência da UI. O CommandPalette já foi migrado com sucesso; o GraphView é o próximo componente maior para refatoração, consolidando a migração no renderer.

## What Changes

- **GraphView.svelte**: Reescrever `src/renderer/components/graphView.js` em Svelte, preservando 100% da funcionalidade atual
  - Renderização do grafo via `vis-network` com as mesmas opções (forceAtlas2Based, estabilização)
  - Filtro de visualização (Interface/Implementation/External) com os mesmos checkboxes e lógica
  - Mesmas cores e estilos de nodos (projectUnit/externalUnit)
  - Mesma exposição de API (exportar `renderGraph()` ou equivalente no componente)
  - Nenhuma mudança em comportamento ou contrato externo

- **Atualização de imports**: Ajustar `src/renderer/index.js` para importar e usar o novo `GraphView.svelte` no lugar de `graphView.js`

## Capabilities

### New Capabilities

*Nenhuma* — este é uma migração de implementação pura. Não há mudanças de comportamento, requisitos ou API expostos.

### Modified Capabilities

*Nenhuma* — o contrato externo (como o componente é chamado, o que ele renderiza, como filtra) permanece idêntico.

## Impact

- **Código afetado**: `src/renderer/components/graphView.js` → `GraphView.svelte`
- **Dependências**: Nenhuma adição; mantém `vis-network` e `vis-data`
- **Testes**: Componentes Svelte com `@testing-library/svelte` (já configurado)
- **Não há quebra de compatibilidade**: mudança interna ao componente do renderer
