# Proposal

## Why

O Command Palette é o primeiro componente-chave a ser migrado para Svelte neste projeto. Sua lógica é encapsulada e suas dependências externas são estáveis, tornando-o ideal como prototipo da migração incremental planejada no CLAUDE.md. Modernizar o componente com reatividade declarativa (Svelte) reduz o código de gerenciamento de estado manual (~300 linhas) e melhora a manutenibilidade com binding automático de inputs, reatividade nativa e escoposHTML/CSS automáticos — tudo sem impacto no comportamento visível ao usuário.

## What Changes

- Cria novo arquivo `src/renderer/components/CommandPalette.svelte` com o componente Svelte funcional
- Remove `src/renderer/components/commandPalette.js` (implementação vanilla)
- Atualiza `src/renderer/index.js` para usar a nova importação Svelte
- Sem alterações no comportamento externo, interface pública ou IPC — a paleta permanece idêntica do ponto de vista do usuário
- Sem mudanças em templates HTML, ativos ou dependências de build

## Capabilities

### New Capabilities
Nenhuma — a capacidade `command-palette` já existe e seus requirements permanecem inalterados.

### Modified Capabilities
Nenhuma — esta é uma refatoração pura de implementação. O comportamento externo observável não muda.

## Impact

- **Código**: Redução de ~300 para ~150 linhas de lógica de componente (gain esperado: ~50%)
- **Arquivos alterados**: `src/renderer/components/` (novo Svelte, remover vanilla JS), `src/renderer/index.js` (importação)
- **Sem impacto em**: Specs, testes de domínio, IPC, menu, atalhos, visibilidade
- **CI/testes**: Testes visuais manuais via `npm start`; nenhuma quebra esperada em testes existentes
