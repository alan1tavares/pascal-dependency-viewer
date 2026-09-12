# root-unit-selection

## Purpose

Fluxo de abrir um Projeto (`.dpr`), listar suas Project Units numa tela de
busca/listagem e permitir a escolha de uma delas como Root Unit para
iniciar a visualização do grafo.

## Requirements

### Requirement: Abertura de um Projeto (`.dpr`) pelo menu
O sistema SHALL oferecer, no menu `File`, uma opção para abrir um arquivo
`.dpr` via diálogo nativo de seleção de arquivo, separada da opção existente
de abrir um `.pas` avulso.

#### Scenario: Usuário abre um `.dpr` pelo menu
- **WHEN** o usuário escolhe "Open Project" no menu e seleciona um arquivo
  `.dpr` no diálogo
- **THEN** o conteúdo do arquivo é lido e parseado com `parseDprSource`, e a
  lista de Project Units resultante fica disponível para a tela de
  busca/listagem

### Requirement: Listagem e busca de Project Units para escolha da Root Unit
Após abrir um Projeto, o sistema SHALL exibir uma tela com todas as Project
Units do `.dpr` (nome e caminho), permitindo filtrar a lista por um texto
digitado pelo usuário, comparado de forma case-insensitive contra o nome da
unit.

#### Scenario: Tela lista todas as Project Units do `.dpr` aberto
- **WHEN** o Projeto aberto tem Project Units `UnitA`, `UnitB` e `UnitC`
- **THEN** a tela de busca/listagem exibe as três, com seus nomes e caminhos

#### Scenario: Usuário filtra a lista por texto
- **WHEN** o usuário digita `unitb` no campo de busca
- **THEN** somente as Project Units cujo nome contém `unitb`
  (case-insensitive) permanecem visíveis na lista

### Requirement: Seleção de uma Root Unit renderiza seu grafo de dependências direto
Ao escolher uma Project Unit na tela de busca/listagem como Root Unit, o
sistema SHALL ler o arquivo `.pas` correspondente (caminho resolvido a
partir do diretório do `.dpr` aberto) e renderizar o grafo de 1 nível dessa
unidade — a unidade e suas dependências diretas (`uses`) — usando
`parsePascalSource` e `mountDependenceGraphStructure`, sem exigir reabrir ou
recarregar a janela manualmente.

#### Scenario: Usuário escolhe uma Root Unit na listagem
- **WHEN** o usuário clica na Project Unit `UnitPrincipal` (caminho
  `UnitPrincipal.pas`, relativo ao diretório do `.dpr` aberto) na tela de
  busca/listagem
- **THEN** o app lê `UnitPrincipal.pas` do disco, extrai seu nome de unit e
  sua cláusula `uses`, e exibe o grafo com o nó `UnitPrincipal` e um edge
  para cada dependência direta, no mesmo formato que `File > Open` produz
  para um `.pas` avulso

### Requirement: Isolamento de estado entre o fluxo de Projeto e o fluxo de arquivo avulso
O sistema SHALL garantir que nenhuma chave de estado gravada em
`electron-store` por um fluxo (seleção de Root Unit vs. `File > Open` de um
`.pas` avulso) sobreviva à troca para o outro fluxo.

#### Scenario: Abrir um `.pas` avulso depois de ter aberto um Projeto
- **WHEN** o usuário abriu um `.dpr` (store contém `projectUnits` e
  `projectDir`) e em seguida usa `File > Open` para abrir um `.pas` avulso
- **THEN** o `electron-store`, após a nova gravação, não contém mais
  `projectUnits` nem `projectDir` — apenas o grafo do `.pas` recém-aberto

#### Scenario: Selecionar uma Root Unit depois de listar Project Units
- **WHEN** o usuário está na tela de busca/listagem (store com
  `view: 'rootUnitSelection'`) e escolhe uma Root Unit
- **THEN** o `electron-store` passa a ter `view: 'graph'` com `nodes` e
  `edges` do grafo resultante, sem `projectUnits` nem `projectDir`
