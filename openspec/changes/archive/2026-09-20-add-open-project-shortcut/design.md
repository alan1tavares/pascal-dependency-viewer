## Context

O menu nativo é montado em `src/main/menu.js` (`buildMenu`), e o item `Abrir
Projeto` já tem um `click` que chama `performOpenProject` e envia
`app:project-loaded`. Atalhos de menu nativo do Electron são declarados via
a propriedade `accelerator` do item; o Electron registra o atalho enquanto a
janela está em foco e exibe a dica ao lado do rótulo. Ver `proposal.md`
para a motivação.

## Goals / Non-Goals

**Goals:**
- Reaproveitar o `click` existente: o atalho e o clique compartilham o mesmo
  handler, sem duplicar lógica.

**Non-Goals:**
- Atalhos para os demais itens do menu (`Selecionar Unit`, `Selecionar
  Método`, `Sair`).
- Atalho global do sistema (fora do app) ou handlers de teclado no renderer.

## Decisions

- **Usar `accelerator: "CmdOrCtrl+O"` no item `Abrir Projeto`.** Resolve para
  `Cmd+O` no macOS e `Ctrl+O` no Linux (e Windows) com uma única string.
  Alternativa descartada: escolher a string por `process.platform` — mais
  código para o mesmo resultado.
- **Atalho no menu nativo, não no renderer.** O `click` já vive no main
  process e o menu funciona independentemente de qual tela do renderer está
  ativa; um listener de teclado no renderer duplicaria o fluxo e exigiria
  IPC extra.

## Risks / Trade-offs

- [Conflito com atalhos do sistema/Linux DE] → `Ctrl+O` é o padrão de "abrir"
  e não conflita com os atalhos do app; nenhum outro item usa esse
  accelerator.
- [Diálogo já aberto e atalho acionado de novo] → o diálogo nativo é modal à
  janela, então o atalho não é entregue enquanto ele está aberto.
