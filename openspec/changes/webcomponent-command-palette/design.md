# Design

## Context

A Command Palette atual (`src/renderer/components/commandPalette.js`) é um módulo procedural que:
- Gerencia estado global (mode, selectedIndex, filteredItems, etc.) em variáveis `let` no escopo do módulo
- Manipula DOM manualmente (elemento por elemento) via `document.getElementById()`
- Exporta funções imperíods (`configureCommandPalette()`, `showCommandPalette()`, `enterRootUnitMode()`, etc.)
- Tightly coupled com `renderer/index.js` através de callbacks

A refatoração transforma isso em um Web Component encapsulado que:
- Mantém toda a lógica de estado privada na instância do componente
- Usa Shadow DOM para isolar markup e estilos
- Expõe uma interface pública clara (métodos + eventos)
- Reduz o acoplamento com o resto da aplicação

## Goals / Non-Goals

**Goals:**
- Encapsular lógica, markup e estilos da paleta em um único componente reutilizável
- Manter 100% de compatibilidade de comportamento com a implementação atual
- Reduzir o escopo de `renderer/index.js` (orquestração apenas, sem gerenciamento de UI)
- Criar uma interface pública estável (métodos + eventos) que facilite futuras evoluções

**Non-Goals:**
- Não muda o comportamento visível do usuário (UX continua idêntica)
- Não adiciona novos recursos à paleta
- Não refatora `domain/` — lógica de filtro e negócio permanece
- Não implementa testes novos (filtro já é testado; UI é manual por enquanto)

## Decisions

### 1. Shadow DOM com CSS Inheritance

**Decision**: Usar Shadow DOM (encapsulado) e herdar variáveis CSS do host (`:host-context()`).

**Rationale**:
- Shadow DOM isola estilos completamente, evita colisões de classe CSS
- Herdar via CSS custom properties permite que tema global (light/dark) funcione sem acoplamento
- Markup interno fica invisível para seletores CSS externos

**Alternatives considered**:
- Light DOM: mais simples, mas estilos vazam bidirecional
- Web Shadow DOM sem herança: isola bem mas quebra tema global

### 2. Template Único (Não Separado)

**Decision**: HTML + CSS inline como template string dentro de `CommandPalette.js`.

**Rationale**:
- Componente é relativamente pequeno, arquivo único é legível
- Evita complexidade de bundling e imports de assets
- Facilita redistribuição como arquivo standalone

**Alternatives considered**:
- Arquivos separados (html, css): mais organizado, mas adiciona overhead de imports/bundling

### 3. Interface Pública via Métodos (Não Callbacks Globais)

**Decision**: Componente expõe métodos setter (`setCommands()`, `setProjectUnits()`, etc.) e propriedades (`isOpen`, `closable`), com callbacks internos opcionais via setters.

**Rationale**:
- Mais explícito e fácil de debugar que callbacks genéricos
- `renderer/index.js` controla orquestração, não o componente
- Eventos (`selection-confirmed`, `closed`) substituem callbacks para comunicação reversa

**Alternatives considered**:
- Reactive properties: mais moderno mas complexa sincronização
- Custom events only: funciona, mas perde controle imperativo do chamador

### 4. Eventos Públicos em vez de Callbacks Passados

**Decision**: Componente emite `selection-confirmed` (user escolhe item) e `closed` (qualquer fechamento).

**Rationale**:
- Reduz acoplamento (sem callbacks passados)
- `renderer/index.js` trata via `addEventListener()` padrão do DOM
- Facilita testes e debug

### 5. Backward Compatibility via Wrappers em renderer/index.js

**Decision**: As funções exportadas de `commandPalette.js` hoje (`showCommandPalette()`, `enterRootUnitMode()`, etc.) viram métodos chamados dentro de `renderer/index.js`.

**Rationale**:
- Não quebra o fluxo existente de IPC e handlers
- `renderer/index.js` permanece como orquestrador central
- Facilita rollback se necessário

**Alternatives considered**:
- Expor o elemento como export: exigiria refator mais amplo em quem o importa

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Shadow DOM não suporta estilos globais que afetam componente | Usar CSS custom properties herdadas do host (`:host`, `:host-context()`) |
| Componente criado dinamicamente em runtime (criação, montagem) pode ter overhead | connectedCallback apenas cria shadow root — overhead negligenciável |
| Múltiplas instâncias se criadas acidentalmente | Documentar que deve haver uma única instância (`querySelector('command-palette')`) |
| Estado privado difícil de inspecionar em dev tools | Estado público (`isOpen`, `closable`) é acessível; estado privado tem field names claros |

## Migration Plan

1. **Criar CommandPalette.js** como classe Web Component com lógica migrada de commandPalette.js
2. **Refatorar renderer/index.js**: remover imports de commandPalette.js, usar `querySelector('command-palette')` para acessar métodos
3. **Simplificar index.html**: remover `<div id="commandPaletteOverlay">` + `<style>`; adicionar `<command-palette></command-palette>`
4. **Testar manualmente**: verificar cada modo (commands, recents, rootUnit), navegação (↑/↓/Enter/Esc), clique fora, modeEntry logic
5. **Cleanup**: remover commandPalette.js após validação

**Rollback**: Se necessário, reverter os 4 commits acima reverte para o comportamento anterior.

## Open Questions

Nenhuma — todas as decisões arquiteturais foram validadas na fase de grilling.
