## Why

Hoje o único jeito de abrir um projeto é navegar com o mouse por `Arquivo >
Abrir Projeto`. Como é a ação de entrada de todo o fluxo do app, ela merece o
atalho de teclado padrão de "abrir arquivo" de cada plataforma.

## What Changes

- Atribuir o atalho `Cmd+O` (macOS) e `Ctrl+O` (Linux) ao item `Abrir Projeto`
  do menu `Arquivo`, disparando exatamente o mesmo fluxo do clique.
- Exibir o atalho ao lado do rótulo do item no menu nativo (comportamento
  padrão do Electron ao definir um `accelerator`).
- Nenhuma mudança no fluxo de abertura (diálogo `.dpr`, `parseDprSource`,
  evento `app:project-loaded`), no IPC ou no renderer.

Premissa: usar o accelerator multiplataforma `CmdOrCtrl+O` do Electron, que
resolve para `Cmd+O` no macOS e `Ctrl+O` no Linux (e no Windows, sem custo
adicional, embora o pedido cite apenas Mac e Linux).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `application-menu`: o item `Abrir Projeto` do menu `Arquivo` passa a ter o
  atalho `Cmd+O`/`Ctrl+O` por plataforma.

## Impact

- Código: `src/main/menu.js` (propriedade `accelerator` no item `Abrir
  Projeto`) e `src/main/test/menu.test.js` (teste do accelerator).
- Sem novas dependências, sem mudança de API/IPC.
