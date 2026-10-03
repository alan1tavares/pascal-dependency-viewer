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

### 2. CSS Separado + Template Inline

**Decision**: CSS fica em arquivo `CommandPalette.css` separado; HTML template permanece inline.

**Rationale**:
- CSS legível em arquivo dedicado com syntax highlighting nativo
- Editor CSS reconhece estilos, autocomplete funciona
- Vite bundla com `?inline` — sem requisição HTTP, ainda embutido no JS final
- HTML simples inline (25 linhas) fica legível
- Separação clara de responsabilidades

**Alternatives considered**:
- HTML + CSS inline: menor overhead mas difícil editar CSS em arquivo JS
- Ambos separados: mais organizado mas overhead maior de imports

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

### 6. Consolidação da Renderização

**Decision**: Os 3 métodos `#renderCommandItem()`, `#renderRecentItem()`, `#renderRootUnitItem()` são consolidados em 1 método genérico `#renderItem(entry, fields)`.

**Rationale**:
- Reduz ~40 linhas (9% do arquivo) sem perder clareza
- Lógica repetida é eliminada (criaElement, listeners, append)
- Metadata-driven: qual campo renderizar é configurável
- Continua legível com nomes de fields descritivos

**Alternatives considered**:
- Manter 3 métodos: mais explícito mas repetitivo
- Template strings: mais compacto mas menos flexível

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Shadow DOM não suporta estilos globais que afetam componente | Usar CSS custom properties herdadas do host (`:host`, `:host-context()`) |
| Componente criado dinamicamente em runtime (criação, montagem) pode ter overhead | connectedCallback apenas cria shadow root — overhead negligenciável |
| Múltiplas instâncias se criadas acidentalmente | Documentar que deve haver uma única instância (`querySelector('command-palette')`) |
| Estado privado difícil de inspecionar em dev tools | Estado público (`isOpen`, `closable`) é acessível; estado privado tem field names claros |

## Migration Plan

1. **Criar CommandPalette.css** com estilos separados
2. **Criar CommandPalette.js** como classe Web Component (lógica + template inline)
   - Importar CSS com `?inline` do Vite
   - Consolidar renderização em 1 método genérico
3. **Refatorar renderer/index.js**: remover imports de commandPalette.js, usar `querySelector('command-palette')` para acessar métodos
4. **Simplificar index.html**: remover `<div id="commandPaletteOverlay">` + `<style>`; adicionar `<command-palette></command-palette>`
5. **Testar manualmente**: verificar cada modo (commands, recents, rootUnit), navegação (↑/↓/Enter/Esc), clique fora, modeEntry logic
6. **Cleanup**: remover commandPalette.js após validação

**Rollback**: Se necessário, reverter os 4 commits acima reverte para o comportamento anterior.

## Open Questions

Nenhuma — todas as decisões arquiteturais foram validadas na fase de grilling.
