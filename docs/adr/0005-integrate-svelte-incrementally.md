# 0005 — Integração Incremental de Svelte

**Status**: Aceita

**Data**: 2026-10-10

**Contexto**:

O projeto começou com vanilla JavaScript puro: DOM manipulation direto, sem framework. Essa simplicidade funcionou bem para 2 componentes (`graphView.js`, `commandPalette.js`), mas à medida que a interface cresce, o código fica mais frágil — estado implícito em variáveis de módulo, testes difíceis, refatoração arriscada.

Queremos modernizar a camada UI sem interromper o desenvolvimento. Uma reescrita full-stack é cara e arriscada; uma migração incremental permite aprender e validar padrão enquanto aproveita o código vanilla existente.

**Decisão**:

Integrar **Svelte** como framework progressivo, coexistindo com vanilla JavaScript durante uma transição gradual para 100% Svelte.

1. **Novos componentes são Svelte por padrão**. Código vanilla fica como está até ser migrado explicitamente.

2. **Estrutura de pasta**:
   - `src/renderer/components/` — vanilla (`.js`) + Svelte (`.svelte`) lado a lado
   - `src/renderer/stores/` — estado reativo via `svelte/store`
   - `src/renderer/services/` — IPC Bridges (funções puras que envolvem `ipcRenderer.invoke`)

3. **Comunicação**:
   - Componentes Svelte **nunca** chamam `ipcRenderer` direto — sempre via Bridge (`src/renderer/services/ipc.js`)
   - Bridges atualizam Stores, que alimentam componentes reativamente
   - Preload API (`window.pascalDependencyViewer`) permanece inalterada

4. **Stack técnico**:
   - **Svelte puro** (não SvelteKit — esse é um app Electron, não web)
   - **`svelte/store`** nativo para estado (sem Pinia ou outra biblioteca)
   - **Vite + `vite-plugin-svelte`** em `vite.renderer.config.mjs`
   - **TypeScript** para Svelte + services/stores; vanilla em JS puro por agora
   - **Vitest + @testing-library/svelte** para testes de componentes Svelte
   - **CSS scoped** (padrão Svelte) — nenhuma dependência CSS global nova

5. **Escopo inicial**:
   - Setup: pastas, config, exemplos (Bridge, Store, componente Welcome.svelte)
   - **Nenhuma migração real** de componentes vanilla — apenas scaffolding para futuro
   - Validar que Svelte constrói e renderiza (`npm start` mostra Welcome.svelte)

6. **Migração futura**:
   - Cada branch temática migra **um** componente vanilla → Svelte
   - Ordem sugerida: CommandPalette (simples) → GraphView (complexo)
   - Ao deletar vanilla, a pasta struct permanece igual — apenas `.svelte` sobra

**Consequências**:

- ✅ Moderniza UI incrementalmente, sem quebra
- ✅ Aprende padrão (Bridge, Store, Svelte) com componentes simples
- ✅ Código vanilla permanece testado e funcional até ser migrado
- ✅ Cada migração é independente — posso pausar, reordenar, priorizar
- ❌ Duas arquiteturas UI em paralelo (complexidade temporária)
- ❌ Configuração adicional (tsconfig, vite plugin, Vitest)

**Trade-offs resolvidos**:

1. **SvelteKit vs Svelte puro**: Svelte puro ganhou — SvelteKit é framework web, aqui é Electron
2. **TypeScript global vs gradual**: Gradual — Svelte + services/stores ganham tipos, vanilla fica como está
3. **Jest vs Vitest**: Ambos — Jest continua para `src/domain/`, Vitest para Svelte (melhor integração Vite + ESM nativo)
4. **Prazo vs indefinido**: Nenhum dos dois — "incremental até 100%" deixa claro que é o destino, mas sem pressa artificial

**Referências**:

- [[Svelte Component]], [[IPC Bridge]], [[Svelte Store]] em `CONTEXT.md`
- Seção "Svelte Setup" em `CLAUDE.md` para padrões e estrutura
