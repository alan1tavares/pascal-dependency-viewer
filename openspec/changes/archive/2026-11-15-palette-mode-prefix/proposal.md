# Proposal

## Why

A Command Palette indica em que modo está de forma inconsistente: o spec
`recent-projects` sempre exigiu o prefixo fixo `Abrir recente` no modo
`Abrir recente`, mas o código nunca o exibiu (só o texto de ajuda
`Escolha o projeto`, que some ao digitar); o modo `Selecionar Método`
(change `caller-graph-method-tab`) já exibe o prefixo `Selecionar Método`; e
o modo `Selecionar Unit` não tem prefixo nem no spec nem no código. Depois
que o usuário começa a digitar, só o prefixo continua dizendo o que a lista
está mostrando.

## What Changes

- O modo `Abrir recente` passa a exibir o prefixo fixo `Abrir recente`, como
  o spec `recent-projects` já pedia (correção do código, sem mudança de
  requisito).
- O modo `Selecionar Unit` passa a exibir o prefixo fixo `Selecionar Unit`,
  com o mesmo aspecto e a mesma posição do prefixo dos outros modos de
  escolha; o texto de ajuda `Filtrar por nome ou caminho da unit` continua.
- O prefixo dos três modos de escolha (`Abrir recente`, `Selecionar Unit`,
  `Selecionar Método`) passa a sair de um único lugar no componente da
  paleta. A lista de Commands continua sem prefixo.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities
- `root-unit-selection`: o modo `Selecionar Unit` passa a ter o prefixo
  fixo `Selecionar Unit` e o texto de ajuda especificados.

`recent-projects` e `command-palette` não mudam: o prefixo `Abrir recente`
e a ausência de prefixo na lista de Commands já estão especificados.

## Impact

- Código: `src/renderer/components/CommandPalette.svelte` (prefixo por
  modo).
- Testes: `src/renderer/components/CommandPalette.test.js` (prefixo nos
  modos `Abrir recente` e `Selecionar Unit`; nenhum prefixo na lista de
  Commands).
- Specs: delta de `root-unit-selection`.
- Sem mudança de IPC, domínio, main ou dependências. Os e2e localizam os
  itens pela lista (`#commandPaletteList`) e pelo input, não pelo prefixo.
