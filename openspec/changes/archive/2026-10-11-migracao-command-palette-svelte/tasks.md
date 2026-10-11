# Tarefas

## 1. Implementar Componente CommandPalette.svelte

- [x] 1.1 Criar `src/renderer/components/CommandPalette.svelte` com bloco script Svelte: definir variáveis reativas (mode, filteredItems, selectedIndex, etc.), importar funções de domínio e utilitários, e configurar referência de API para window.pascalDependencyViewer. Verificar que o arquivo compila sem erros ao rodar `npm run build` ou `npm start`.

- [x] 1.2 Implementar o template com renderização condicional para três modos (COMMANDS_MODE, RECENTS_MODE, ROOT_UNIT_MODE). Incluir overlay, campo de input, rótulo de prefixo, lista e mensagem vazia. Preservar todos os atributos `id` e classes CSS existentes. Verificar que a estrutura HTML corresponde aos IDs de elemento atuais em `index.html` (commandPaletteOverlay, commandPaletteInput, commandPalettePrefix, commandPaletteList, commandPaletteEmpty).

- [x] 1.3 Implementar handlers de eventos de teclado (`on:keydown` no input) para ArrowUp/ArrowDown/Enter/Escape, handlers de mouse (`on:mousedown` no overlay) para fechar ao clicar fora, e filtragem de input (`on:input`). Verificar que navegação de teclado (↑/↓/Enter/Esc) funcione conforme esperado ao testar manualmente em `npm start`.

- [x] 1.4 Implementar funções de troca de modo: `enterCommandsMode()`, `enterRecentsMode(entry)`, `enterRootUnitMode(projectUnits, projectDir, options)`. Cada uma deve atualizar modo, itens filtrados e estado da UI corretamente. Verificar que o Command Palette pode trocar entre modos via UI (clicando "Abrir recente"/"Selecionar Unit" na lista de comandos).

- [x] 1.5 Implementar seleção e execução de itens: renderizar itens de comando com dicas de atalho (usando função de domínio `shortcutHint`), itens de projeto recente e itens de unit raiz. Clicar ou pressionar Enter em um item deve disparar ação apropriada (executeCommand, openRecentProject, selectRootUnit). Verificar ao testar manualmente que clicar/pressionar Enter em cada tipo de item funciona corretamente.

- [x] 1.6 Implementar configuração/setup de callbacks: expor função `configure(options)` (ou export equivalente) que aceita callbacks `hasProject`, `getProject` e `onRootUnitSelected`, correspondendo à assinatura atual `configureCommandPalette()`. Verificar que o componente recebe e usa esses callbacks corretamente testando filtragem de comandos dependente de projeto ("Selecionar Unit" só aparece quando um projeto está aberto).

- [x] 1.7 Implementar funções públicas (`showCommandPalette()`, `showOpenRecent()`, `closeCommandPalette()`, `enterRootUnitMode()`) para corresponder aos exports atuais de vanilla JS. Estas devem ser chamáveis de `src/renderer/index.js`. Verificar que `npm run build` compila o componente e essas funções são exportadas sem erros.

## 2. Atualizar Pontos de Integração

- [x] 2.1 Atualizar `src/renderer/index.js` para importar componente Svelte em vez do módulo vanilla `commandPalette.js`. Alterar statement de importação e verificar que todas as chamadas de função (configureCommandPalette, showCommandPalette, etc.) ainda referenciam os exports corretos do componente Svelte.

- [x] 2.2 Verificar que handlers de mensagens IPC em `src/renderer/index.js` (onProjectLoaded, onShowRootUnitSelection, onShowOpenRecent, onShowCommandPalette) chamam corretamente as funções atualizadas do CommandPalette. Testar cada mensagem rodando `npm start` e verificando que a paleta abre e se comporta corretamente em resposta aos itens de menu e eventos IPC.

- [x] 2.3 Testar integração com handler de sequência de chaves do processo principal: verificar que `Cmd/Ctrl+K R` (Abrir recente) e `Cmd/Ctrl+P` (Paleta de Comandos) disparam a paleta corretamente via menu e atalhos de teclado.

## 3. Limpeza e Verificação

- [x] 3.1 Deletar `src/renderer/components/commandPalette.js` após confirmar que todas as importações foram atualizadas. Verificar que nenhum outro arquivo importa este módulo deletado rodando `grep -r "commandPalette\.js" src/` e confirmando ausência de resultados (ou apenas referências de build/cache).

- [x] 3.2 Rodar `npm test` para garantir que todos os testes existentes ainda passam (testes de domínio, outros componentes). Se algum teste falhar, investigar e corrigir. Verificar que a suite de testes roda e reporta sucesso ou identifica qualquer quebra.

## 4. Teste Manual e Verificação Final

- [x] 4.1 Iniciar app com `npm start` e testar manualmente o Command Palette em todos modos:
  - **Modo Commands**: Abrir paleta via `Cmd/Ctrl+P` ou menu; verificar que comandos aparecem, filtragem funciona, navegação (↑/↓/Enter) funciona, e executar comando fecha a paleta.
  - **Modo Recents**: Abrir paleta, executar comando "Abrir recente"; verificar que projetos recentes carregam e são filtráveis; clicar em projeto abre; `Esc` retorna a comandos.
  - **Modo Root Unit**: Abrir projeto; verificar que paleta abre automaticamente em modo Root Unit (não-fechável); selecionar unit e verificar que o gráfico renderiza; testar comando `Selecionar Unit` quando projeto está aberto.

- [x] 4.2 Verificar que todas as chamadas IPC (expandFromRootUnit, openRecentProject, etc.) executam corretamente e a UI responde como esperado (gráfico renderiza, paleta fecha, etc.). Verificar que nenhum erro de console aparece no DevTools.

- [x] 4.3 Testar atalhos de teclado: `Cmd/Ctrl+P` (abrir paleta), `Cmd/Ctrl+K R` (abrir recentes), setas (navegar), Enter (selecionar), Esc (fechar ou voltar a comandos). Verificar que todos atalhos funcionam sem interferência de handlers do processo principal.

- [x] 4.4 Verificar que app compila com sucesso para produção: rodar `npm run package` e confirmar que nenhum erro de build ocorre. (Criar instaladores é opcional per CLAUDE.md; o objetivo é confirmar que o build sucede.)
