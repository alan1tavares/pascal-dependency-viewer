# Tasks

## 1. Componente da paleta

- [x] 1.1 Em `src/renderer/components/CommandPalette.svelte`, trocar o prefixo fixo exclusivo do modo `method` por um prefixo derivado do modo (`Abrir recente` para `recents`, `Selecionar Unit` para `rootUnit`, `Selecionar Método` para `method`, nenhum para `commands`), renderizado no mesmo `#commandPalettePrefix`/`.commandPrefix` já usado hoje e fora do valor do input; manter os textos de ajuda atuais (`Escolha o projeto`, `Filtrar por nome ou caminho da unit`, `Digite o nome do método`, `Digite um comando`). Verificar com `npx vitest run --project renderer` verde (os testes existentes de `Selecionar Método` e de "Esc volta à lista de Commands" sem prefixo continuam passando)

## 2. Testes de componente

- [x] 2.1 Em `src/renderer/components/CommandPalette.test.js`, cobrir o modo `Abrir recente` (aberto direto e pelo Command): prefixo `Abrir recente` visível, input vazio com o texto de ajuda `Escolha o projeto`, e o prefixo continua visível depois de digitar sem entrar no valor do input (cenário "Diálogo lista os Recent Projects" de `recent-projects`). Verificar com o teste verde
- [x] 2.2 No mesmo arquivo, cobrir o modo `Selecionar Unit`: prefixo `Selecionar Unit`, texto de ajuda `Filtrar por nome ou caminho da unit` com o input vazio e prefixo mantido ao digitar `unitb` (os dois cenários novos do delta de `root-unit-selection`), além de nenhum prefixo na lista de Commands. Verificar com o teste verde

## 3. Verificação final

- [x] 3.1 Rodar `npm test`, `npm run test:e2e` e `openspec validate palette-mode-prefix --strict`, todos sem erros
