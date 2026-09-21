## MODIFIED Requirements

### Requirement: Abertura de um Projeto (`.dpr`) pelo menu
O sistema SHALL oferecer, no menu `Arquivo`, uma opção para abrir um
arquivo `.dpr` via diálogo nativo de seleção de arquivo. Essa opção
("Abrir projeto (.dpr)") SHALL ser a única entrada do menu `Arquivo` que abre
o diálogo nativo para carregar conteúdo Pascal — não há uma opção separada
para abrir um `.pas` avulso. O menu `Arquivo` também expõe `Abrir recente`
(capability `recent-projects`), que reabre um Projeto já aberto antes sem
passar pelo diálogo nativo, e `Sair` (capability `application-menu`), que
encerra a aplicação e não carrega nenhum conteúdo.

#### Scenario: Usuário abre um `.dpr` pelo menu
- **WHEN** o usuário escolhe "Abrir projeto (.dpr)" no menu `Arquivo` e
  seleciona um arquivo `.dpr` no diálogo
- **THEN** o conteúdo do arquivo é lido e parseado com `parseDprSource`, e a
  lista de Project Units resultante fica disponível para a tela de
  busca/listagem

#### Scenario: Menu `File` não tem opção de abrir um `.pas` avulso
- **WHEN** o usuário abre o menu `Arquivo`
- **THEN** a única opção que abre o diálogo nativo para carregar conteúdo é
  "Abrir projeto (.dpr)"; não existe uma opção "Open"/"Abrir" para um `.pas`
  avulso, `Abrir recente` reabre apenas Projetos já abertos antes, e `Sair`
  não carrega conteúdo nenhum
