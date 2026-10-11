# Design

## Contexto

O Command Palette atual é implementado em JavaScript vanilla (`src/renderer/components/commandPalette.js`, ~297 linhas) com manipulação manual do DOM, rastreamento de estado e listeners de eventos. O projeto já estabeleceu infraestrutura Svelte (plugin Vite, padrão `svelte/store`, padrão bridge para IPC) conforme documentado no CLAUDE.md.

O contrato IPC do app e a estrutura HTML DOM (IDs e classes para overlay, input, list, etc.) são estáveis e usados pelos handlers de eventos de teclado no processo principal (`src/main/keySequence.js`). Veja proposal.md para a motivação.

## Objetivos / Não-Objetivos

**Objetivos:**
- Portar o Command Palette de vanilla JS para Svelte com comportamento externo idêntico
- Aproveitar a reatividade do Svelte para reduzir boilerplate de gerenciamento de estado (~40-50% de redução de código esperada)
- Estabelecer um padrão reutilizável para a próxima migração de componente (GraphView)
- Manter todos os handlers IPC, handlers de eventos e IDs/classes DOM inalterados
- Preservar a UI de três modos (Commands, Recents, Root Unit selection)
- Manter o comportamento de navegação por teclado, filtragem e seleção exatamente igual

**Não-Objetivos:**
- Alterar qualquer estilo visual ou aparência
- Refatorar a camada IPC ou criar novos handlers IPC
- Introduzir novas stores ou alterar o padrão IPC Bridge existente
- Migrar testes (testes de domínio permanecem em Jest; nenhum teste novo de componente Svelte nesta mudança)
- Suportar tree-shaking ou otimização de tamanho de bundle além dos padrões do Svelte

## Decisões

### 1. Arquitetura de Componente: Arquivo `.svelte` Único

**Decisão:** Implementar `CommandPalette.svelte` como um único componente com estado local, evitando fragmentação de stores.

**Justificativa:** O estado do Command Palette (modo, itens filtrados, índice de seleção) é totalmente local—nenhum outro componente precisa observá-lo. Stores são reservadas para estado entre componentes (informações de projeto, lista de projetos recentes—veja `renderer/stores/`). Um único componente é mais simples para esse comportamento escopo.

**Alternativas consideradas:**
- **Múltiplas stores + componente mais simples**: Adiciona cerimônia (arquivos de store, subscriptions) sem benefício para estado local apenas.
- **Extrair lógica de troca de modo para uma store**: Pouco claro qual valor o estado compartilhado fornece; complica a migração.
- **Híbrido**: Uma store (mode) + estado local (itens filtrados). Divisão desnecessária; o estado do modo orienta itens filtrados, então mantê-los juntos é mais claro.

### 2. Gerenciamento de Estado: Declarações Reativas

**Decisão:** Usar bindings `let` do Svelte e atribuições reativas para gerenciar estado (mode, filtered items, selected index), evitando stores.

**Justificativa:** A reatividade do Svelte via atribuição (`selectedIndex = 0` dispara re-renderizações automaticamente) elimina as chamadas de re-renderização manual (`renderList()` em vanilla) e anexação manual de listeners de eventos. Este é o ganho principal: menos linhas, intenção mais clara.

**Alternativas consideradas:**
- **Stores graváveis + subscriptions**: exagerado para estado local; adiciona complexidade.
- **Props**: O componente deve rastrear seu próprio modo e seleção entre interações do usuário; props são para dados recebidos, não estado interno.

### 3. Manipulação de Eventos: Diretivas Svelte

**Decisão:** Usar diretivas `on:input`, `on:keydown`, `on:mousedown` em elementos DOM em vez de `addEventListener` manual.

**Justificativa:** O Svelte lida com a limpeza de listeners automaticamente; menos boilerplate e sem risco de listeners duplicados (o código atual tem guards `if (listenersAttached)`).

**Alternativas consideradas:**
- **Manter listeners manuais, chamar do componente**: possível mas derrotas o propósito do Svelte.

### 4. Importações de IPC Bridge e Superfície de API

**Decisão:** Manter as importações de IPC Bridge (`src/renderer/services/ipc.js` para uso futuro, ou chamadas diretas `window.pascalDependencyViewer`) inalteradas; importar funções de domínio (`filterCommands`, `COMMANDS`, etc.) como antes.

**Justificativa:** A camada IPC e API preload são inalteradas por este refactor. Chamamos os mesmos handlers IPC (`openProject()`, `expandFromRootUnit()`, etc.) com os mesmos payloads. Funções de domínio (`filterCommands`, `describeRecentProject`) são utilitários puros—nenhuma mudança de comportamento.

**Alternativas consideradas:**
- **Introduzir uma store Svelte para resultados IPC**: Não; chamadas IPC são iniciadas por ação (clique de botão) e resultados são efeitos colaterais locais (fechar paleta, mostrar gráfico). Stores não adicionam valor aqui.

### 5. Estrutura DOM e Seletores

**Decisão:** Preservar todos os atributos `id` e classes CSS em elementos renderizados (overlay, input, list, items, etc.). Não renomear.

**Justificativa:** O handler de eventos de teclado em `src/main/keySequence.js` e qualquer CSS em `index.html` dependem de IDs estáveis. A paleta é parte de uma visão maior; alterar IDs quebra a integração.

**Alternativas consideradas:**
- **Refatorar IDs**: Fora de escopo; riscos quebrar o tratamento de chaves do processo principal.

### 6. Três Modos: Renderização Condicional

**Decisão:** Usar blocos `{#if mode === COMMANDS_MODE}` para renderizar condicionalmente UI específica de modo (templates de itens diferentes, prefixos, texto de placeholder).

**Justificativa:** A renderização condicional do Svelte é mais clara que a abordagem vanilla JS de verificar modo em uma única função `renderItem()`.

**Alternativas consideradas:**
- **Um slot para cada modo**: Sobrecomplicado; a própria paleta é responsável por mostrar o modo correto.

### 7. Filtragem e Renderização de Itens

**Decisão:** Manter lógica de filtragem (funções de domínio `filterCommands`, `filterRecentProjects`, `filterProjectUnits`) em `src/domain/` e chamá-las do componente. Renderizar itens inline em templates Svelte.

**Justificativa:** Lógica de domínio é inalterada e testável independentemente. Renderização de itens é uma preocupação do componente, não do domínio.

## Riscos / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| **Suposições de ID DOM no processo principal**: Se o processo principal depende de seletores não documentados além dos IDs conhecidos, renomear quebra. | Preserve todos os IDs conhecidos (`commandPaletteOverlay`, etc.). Teste atalhos de teclado e gatilhos de menu manualmente antes de fazer merge. |
| **Svelte HMR (hot-reload) durante desenvolvimento**: Mudanças no componente podem disparar recarregos de página inteira em vez de preservar estado. | Aceitável para dev; reinicie o app para testar se necessário. Não é um bloqueador. |
| **Maior que vanilla JS inicialmente**: A saída do compilador Svelte pode ser maior que uma alternativa vanilla JS mínima. | Compensado pela redução de tamanho geral de bundle da migração incremental; revisitar após migração de graphView. |
| **Comportamento IPC assíncrono**: Handlers IPC (`expandFromRootUnit`, `listRecentProjects`) são assíncronos. Se não forem aguardados adequadamente, race conditions podem ocorrer (ex: buscando recentes enquanto troca de modo). | O código atual protege com `if (!isOpen \|\| mode !== RECENTS_MODE) return;` após chamadas assíncronas. Preserve esse padrão de guard em Svelte. |

## Plano de Migração

1. **Criar `CommandPalette.svelte`** em `src/renderer/components/` com lógica equivalente.
2. **Atualizar `src/renderer/index.js`** para importar e montar o componente em vez do módulo vanilla.
3. **Deletar `commandPalette.js`** após verificação.
4. **Teste manual**: `npm start`, testar todos os atalhos de teclado, itens de menu, filtragem e troca de modo.
5. **Verificação**: Garantir nenhuma regressão em outros componentes (graphView, etc.) e que o app ainda se comunique corretamente com o processo principal.

## Questões em Aberto

- Devemos depois extrair o estado de troca de modo em uma store Svelte para consistência com outro estado do renderer, mesmo se estiver local atualmente? (Adiável—resposta depende de quantos componentes interagem com modo.)
- Qual é o impacto de desempenho da reatividade do Svelte em listas filtradas grandes (100+ units)? (Adiável—testar após migração se necessário.)
