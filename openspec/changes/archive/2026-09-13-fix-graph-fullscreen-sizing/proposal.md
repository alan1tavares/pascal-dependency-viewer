## Why

Após a migração do bootstrap Electron manual para Electron Forge + Vite, o
grafo de dependências renderizado pelo `vis-network` não ocupa todo o espaço
disponível na janela: ao maximizar ou colocar a janela em tela cheia, o grafo
continua restrito a uma pequena área no canto da tela em vez de se esticar
para preencher a janela. Isso acontece porque o projeto nunca definiu CSS
para que `html`, `body` e o container `#mynetwork` tenham uma altura de 100%
— sem essa cadeia de altura explícita, o `vis-network` não tem uma base de
tamanho estável para dimensionar seu canvas, e o problema fica mais visível
quando a janela é redimensionada para tela cheia.

## What Changes

- Adicionar CSS que faça `html`, `body` e o container `#mynetwork` ocuparem
  100% da altura e largura da viewport, para qualquer tamanho de janela.
- Garantir que o grafo renderizado pelo `vis-network` se redimensione
  corretamente ao redimensionar a janela (incluindo maximizar/tela cheia),
  preenchendo todo o espaço disponível do container.
- Aplicar o mesmo ajuste de layout à tela de seleção de Root Unit
  (`#rootUnitSelection`), já que ela compartilha o mesmo `body` sem altura
  definida.

## Capabilities

### New Capabilities
- `graph-canvas-layout`: o sistema deve garantir que a área de renderização
  do grafo (e das demais telas do app) ocupe todo o espaço disponível da
  janela, em qualquer tamanho ou estado (normal, maximizada, tela cheia).

### Modified Capabilities
(nenhuma — as capabilities existentes tratam da construção dos dados do
grafo, não do seu layout visual na janela)

## Impact

- `index.html`: adição de um bloco `<style>` (ou folha de estilo dedicada)
  para o reset de altura/largura.
- `src/renderer.js`: nenhuma mudança funcional esperada além de, se
  necessário, garantir que o `vis-network` reaja a mudanças de tamanho do
  container.
- Nenhum impacto em `src/model/**` (camada pura de parsing, sem dependência
  de Electron ou de layout).
