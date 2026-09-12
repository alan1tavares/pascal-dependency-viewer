## Why

O `CONTEXT.md` já define **Root Unit** como a Project Unit que o usuário
escolhe numa tela de busca/listagem para começar a visualizar, e
`parseDprSource` já existe e está testado — mas nada no app abre um `.dpr`
nem oferece essa tela. Hoje a única entrada é `File > Open` de um `.pas`
avulso; o vocabulário de "Projeto" do domínio não tem nenhuma manifestação
no app ainda. Este change fecha esse elo: abrir um Projeto, listar suas
Project Units e deixar o usuário escolher a Root Unit.

## What Changes

- Novo item de menu para abrir um Projeto (`.dpr`) via diálogo nativo,
  seguindo o mesmo padrão de `handleOpenDialogSelectFile` já usado para
  `.pas`.
- O `.dpr` selecionado é lido e parseado com o `parseDprSource` já
  existente, extraindo a lista de Project Units.
- Nova tela de busca/listagem no renderer que exibe as Project Units
  (nome + caminho) e permite ao usuário filtrar/selecionar uma delas como
  Root Unit.
- Ao selecionar a Root Unit, o app lê o `.pas` correspondente (caminho
  resolvido a partir do diretório do `.dpr`) e reaproveita
  `parsePascalSource` + `mountDependenceGraphStructure`, já existentes, para
  renderizar o grafo de 1 nível — o mesmo comportamento visual que
  `File > Open` já produz hoje, só que iniciado a partir da escolha de uma
  Root Unit dentro de um Projeto, em vez da escolha direta de um arquivo.
- Fora de escopo neste change: expansão transitiva do grafo (Dependency
  Graph completo, múltiplos níveis), distinção visual de External Unit, e
  Uses Clause Scope (`interface` vs `interface`+`implementation`). Essas
  trilhas ficam para changes seguintes.

## Capabilities

### New Capabilities
- `root-unit-selection`: fluxo de abrir um Projeto (`.dpr`), listar suas
  Project Units numa tela de busca/listagem e permitir a escolha de uma
  delas como Root Unit para iniciar a visualização do grafo.

### Modified Capabilities
_Nenhuma — o fluxo `File > Open` existente e `mountDependenceGraphStructure`
não mudam de comportamento, só passam a ter uma segunda porta de entrada._

## Impact

- `src/components/Main/Menu`: novo item de menu e handler para abrir
  `.dpr`, reaproveitando `parseDprSource`.
- Novo estado gravado em `electron-store`: lista de Project Units + caminho
  base do `.dpr`, para a tela de busca/listagem consumir.
- `index.html`: nova UI de busca/listagem (renderizada quando o store traz
  Project Units em vez de um grafo pronto); reaproveita
  `parsePascalSource` e `mountDependenceGraphStructure` diretamente no
  renderer (nodeIntegration habilitado), sem precisar de um canal de IPC
  novo entre renderer e main.
- Nenhuma mudança em `parseDprSource`, `parsePascalSource` ou
  `mountDependenceGraphStructure` — são reaproveitados como estão.
