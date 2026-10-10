# Spec Delta

## Purpose

Define infraestrutura para componentes Svelte reativos, Bridges IPC, e Stores compartilizadas, permitindo modernizar a camada UI sem quebrar código vanilla existente.

## ADDED Requirements

### Requirement: Componentes Svelte são integrados ao build

O sistema SHALL permitir escrever componentes em Svelte (`.svelte`) ao lado de componentes vanilla (`.js`), compilados via `vite-plugin-svelte`.

#### Scenario: Componente Svelte renderiza no app
- **WHEN** um componente `.svelte` é adicionado a `src/renderer/components/`
- **THEN** ele compila sem erro durante `npm start`
- **THEN** ele pode ser importado e montado no DOM como um componente JavaScript normal

#### Scenario: Styles scoped não conflitam
- **WHEN** dois componentes Svelte definem `<style>` com mesmas classes
- **THEN** os estilos são encapsulados e não afetam um ao outro

### Requirement: IPC Bridges encapsulam chamadas inter-processo

O sistema SHALL fornecer funções puras em `src/renderer/services/` que envolvem `ipcRenderer.invoke` e `ipcRenderer.on`, isolando componentes de detalhes de comunicação inter-processo.

#### Scenario: Componente chama Bridge em vez de IPC direto
- **WHEN** um componente Svelte precisa abrir um projeto
- **THEN** chama `ipcBridge.openProject(path)` de `src/renderer/services/ipc.js`
- **THEN** a Bridge invoca `ipcRenderer.invoke('project:open', path)` internamente
- **THEN** componente nunca chama `ipcRenderer` direto

#### Scenario: Bridge atualiza Store após IPC resposta
- **WHEN** Bridge recebe resposta IPC (ex.: projeto carregado)
- **THEN** atualiza uma Svelte Store com os dados (ex.: `projectStore.set(project)`)
- **THEN** componentes observando a Store re-renderizam automaticamente

### Requirement: Svelte Stores gerenciam estado compartilhado

O sistema SHALL usar `svelte/store` (readable, writable) para estado reativo que é compartilhado entre múltiplos componentes ou persistido entre renders.

#### Scenario: Store alimentado por IPC
- **WHEN** Bridge recebe dados do main process (ex.: lista de projetos recentes)
- **THEN** cria ou atualiza uma Store com `.set(data)`
- **THEN** qualquer componente se inscreve via `$store` no template Svelte
- **THEN** componentes re-renderizam automaticamente quando Store muda

#### Scenario: Store com estado inicial
- **WHEN** app inicia e nenhum projeto foi carregado
- **THEN** Stores têm valores iniciais (ex.: `projectStore` = `null`)
- **THEN** após `onProjectLoaded` IPC event, Bridge atualiza Store
- **THEN** componentes que depend da Store reagem imediatamente

### Requirement: TypeScript é gradualmente adotado para Svelte

O sistema SHALL permitir componentes Svelte e services/stores escrerem em TypeScript (`<script lang="ts">`, `.ts` files) enquanto código vanilla existente permanece em JavaScript puro.

#### Scenario: Svelte com TypeScript compila
- **WHEN** um componente Svelte usa `<script lang="ts">`
- **THEN** tipos são validados durante build
- **THEN** sem `lang="ts"` também funciona (opt-in, não obrigatório)

#### Scenario: Bridge service tem tipos
- **WHEN** uma função Bridge é escrita em `.ts` com tipos de parâmetros e retorno
- **THEN** chamadores recebem autocompletar e validação de tipo
- **THEN** nenhum código vanilla existente é forçado a usar TypeScript

### Requirement: Vitest é fornecido para testar componentes Svelte

O sistema SHALL permitir testar componentes Svelte com Vitest + @testing-library/svelte, enquanto Jest continua disponível para `src/domain/`.

#### Scenario: Componente Svelte é testado
- **WHEN** um teste Vitest monta um componente `.svelte` com `render()`
- **THEN** pode fazer assertions sobre o DOM renderizado
- **THEN** pode disparar eventos e verificar reações

#### Scenario: npm test roda ambos Jest + Vitest
- **WHEN** usuário roda `npm test`
- **THEN** Jest testa `src/domain/**`
- **THEN** Vitest testa `src/renderer/**/*.test.js`
- **THEN** ambos resultados são relatados

### Requirement: Padrão de organização para componentes Svelte

O sistema SHALL manter estrutura consistente: componentes em `src/renderer/components/`, Stores em `src/renderer/stores/`, Bridges em `src/renderer/services/`.

#### Scenario: Novo componente Svelte segue padrão
- **WHEN** desenvolvedor cria novo componente `src/renderer/components/NewFeature.svelte`
- **THEN** ele segue o mesmo padrão de importar de Bridge + Store
- **THEN** nenhuma divergência de estrutura

#### Scenario: Componentes vanilla e Svelte coexistem
- **WHEN** `src/renderer/components/` contém `commandPalette.js` (vanilla) e `Welcome.svelte`
- **THEN** ambos funcionam, sem conflitos de naming ou imports
- **THEN** ao migrar `commandPalette.js` para Svelte, apenas a `.svelte` fica (`.js` é deletado)
