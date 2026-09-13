## MODIFIED Requirements

### Requirement: Abertura de um Projeto (`.dpr`) pelo menu
O sistema SHALL oferecer, no menu `File`, uma opção para abrir um arquivo
`.dpr` via diálogo nativo de seleção de arquivo. Essa opção ("Open
Project") SHALL ser a única entrada do menu `File` para carregar
conteúdo Pascal — não há mais uma opção separada para abrir um `.pas`
avulso.

#### Scenario: Usuário abre um `.dpr` pelo menu
- **WHEN** o usuário escolhe "Open Project" no menu e seleciona um arquivo
  `.dpr` no diálogo
- **THEN** o conteúdo do arquivo é lido e parseado com `parseDprSource`, e a
  lista de Project Units resultante fica disponível para a tela de
  busca/listagem

#### Scenario: Menu `File` não tem opção de abrir um `.pas` avulso
- **WHEN** o usuário abre o menu `File`
- **THEN** a única opção disponível para carregar conteúdo é "Open
  Project"; não existe uma opção "Open" para um `.pas` avulso

## REMOVED Requirements

### Requirement: Isolamento de estado entre o fluxo de Projeto e o fluxo de arquivo avulso
**Reason**: O fluxo de abrir um `.pas` avulso (`File > Open`) foi removido
do escopo do app — a única forma de carregar conteúdo Pascal agora é via
`Open Project`. Não há mais dois fluxos concorrentes cujo estado precise
ser isolado.
**Migration**: Nenhuma migração de dados é necessária. Qualquer código ou
teste que exercitava o isolamento de estado entre os dois fluxos (por
exemplo, verificar que `projectUnits`/`projectDir` não sobrevivem a um
`File > Open` de `.pas` avulso) deve ser removido junto com o próprio
fluxo de arquivo avulso.
