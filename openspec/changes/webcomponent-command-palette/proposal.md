# Proposal

## Why

A Command Palette atual está implementada como um módulo JavaScript procedural (`src/renderer/components/commandPalette.js`) que gerencia estado global e DOM manipulado manualmente. Transformá-la em um Web Component nativo oferece:

- **Encapsulamento**: lógica, markup e estilos isolados em um componente reutilizável
- **Maintainability**: menor acoplamento com `renderer/index.js`, mais fácil de testar e modificar isoladamente
- **Architecture alignment**: alinha com padrões modernos de componentes web, facilitando futuras integrações

A funcionalidade da paleta (comportamento, UX, modos) permanece **exatamente igual** — é uma refatoração interna.

## What Changes

- `src/renderer/components/commandPalette.js` é transformado em `src/renderer/components/CommandPalette.js` (uma classe Web Component)
  - Move toda a lógica de estado (mode, selectedIndex, filteredItems, etc.) para fields privados
  - Move HTML e CSS para Shadow DOM (encapsulado, estilos herdados do host via CSS custom properties)
  - Expõe métodos públicos: `open()`, `close()`, `switchMode(mode)`, `setCommands()`, `setRecentProjects()`, `setProjectUnits()`, `setHasProject()`, `setGetProject()`, `setOnRootUnitSelected()`
  - Emite eventos: `selection-confirmed` (quando user escolhe item), `closed` (quando fecha)

- `src/renderer/index.js` é refatorado para usar o web component via métodos públicos em vez de funções exportadas globais
- `src/index.html` é simplificado: `<command-palette></command-palette>` substitui o markup/styles existentes

- Sem mudanças em `src/domain/commands/`, `src/domain/recentProjects/`, `src/domain/rootUnitSelection/` — a lógica de negócio permanece

## Capabilities

### New Capabilities

Nenhuma — não há novos comportamentos. A paleta continua funcionando identicamente, apenas refatorada internamente.

### Modified Capabilities

Nenhuma — não há mudança em requirements. A spec `command-palette` descreve todo o comportamento esperado e continua válida.

## Impact

- **Code**: `src/renderer/components/` (CommandPalette.js), `src/renderer/index.js`, `src/index.html`
- **No breaking changes**: a integração com o resto do app é via métodos e eventos (clara interface pública)
- **No dependency changes**: mantém imports de `domain/` e IPC existentes
- **Testing**: lógica de filtro já é testada em `domain/` — componente é puramente UI
