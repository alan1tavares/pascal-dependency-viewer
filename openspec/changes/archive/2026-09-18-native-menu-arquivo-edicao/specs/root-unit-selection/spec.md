## MODIFIED Requirements

### Requirement: Abertura de um Projeto (`.dpr`) pelo menu
O sistema SHALL oferecer, no menu `Arquivo`, uma opção para abrir um
arquivo `.dpr` via diálogo nativo de seleção de arquivo. Essa opção
("Abrir Projeto") SHALL ser a única entrada do menu `Arquivo` para
carregar conteúdo Pascal — não há uma opção separada para abrir um `.pas`
avulso. O menu `Arquivo` também expõe uma opção `Sair` (capability
`application-menu`), que encerra a aplicação e não carrega nenhum
conteúdo.

#### Scenario: Usuário abre um `.dpr` pelo menu
- **WHEN** o usuário escolhe "Abrir Projeto" no menu `Arquivo` e seleciona
  um arquivo `.dpr` no diálogo
- **THEN** o conteúdo do arquivo é lido e parseado com `parseDprSource`, e a
  lista de Project Units resultante fica disponível para a tela de
  busca/listagem

#### Scenario: Menu `File` não tem opção de abrir um `.pas` avulso
- **WHEN** o usuário abre o menu `Arquivo`
- **THEN** a única opção disponível para carregar conteúdo é "Abrir
  Projeto"; não existe uma opção "Open"/"Abrir" para um `.pas` avulso, e a
  outra opção do menu (`Sair`) não carrega conteúdo nenhum
