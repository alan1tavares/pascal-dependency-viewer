## 1. Teste do atalho

- [x] 1.1 Adicionar em `src/main/test/menu.test.js` um teste que verifica que o item `Abrir Projeto` tem `accelerator: 'CmdOrCtrl+O'`; rodar `npx jest src/main/test/menu.test.js` e confirmar que falha antes da implementação

## 2. Implementação

- [x] 2.1 Adicionar `accelerator: "CmdOrCtrl+O"` ao item `Abrir Projeto` em `src/main/menu.js`, mantendo o `click` existente; verificar que `npx jest src/main/test/menu.test.js` passa por completo (incluindo os testes já existentes de `Abrir Projeto`)

## 3. Verificação manual

- [x] 3.1 Rodar `npm start` e verificar que o menu `Arquivo` exibe o atalho ao lado de `Abrir Projeto` e que `Cmd+O` (macOS) / `Ctrl+O` (Linux) abre o diálogo de seleção de `.dpr` e carrega o projeto; verificar também que cancelar o diálogo não altera a tela atual
