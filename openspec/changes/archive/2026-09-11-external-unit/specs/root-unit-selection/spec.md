## MODIFIED Requirements

### Requirement: Seleção de uma Root Unit renderiza seu grafo de dependências direto
Ao escolher uma Project Unit na tela de busca/listagem como Root Unit, o
sistema SHALL ler o arquivo `.pas` correspondente (caminho resolvido a
partir do diretório do `.dpr` aberto) e renderizar o grafo de 1 nível dessa
unidade — a unidade e suas dependências diretas (`uses`) — usando
`parsePascalSource` e `mountDependenceGraphStructure`, sem exigir reabrir ou
recarregar a janela manualmente. Cada dependência direta SHALL ser
classificada como Project Unit ou External Unit, comparando seu nome
contra a lista de Project Units do Projeto aberto, e o grafo renderizado
SHALL exibir as External Unit com um estilo visual distinto (nó folha) das
Project Unit.

#### Scenario: Usuário escolhe uma Root Unit na listagem
- **WHEN** o usuário clica na Project Unit `UnitPrincipal` (caminho
  `UnitPrincipal.pas`, relativo ao diretório do `.dpr` aberto) na tela de
  busca/listagem
- **THEN** o app lê `UnitPrincipal.pas` do disco, extrai seu nome de unit e
  sua cláusula `uses`, e exibe o grafo com o nó `UnitPrincipal` e um edge
  para cada dependência direta, no mesmo formato que `File > Open` produz
  para um `.pas` avulso

#### Scenario: Dependência direta que é uma Project Unit do Projeto aberto
- **WHEN** a Root Unit `UnitPrincipal` tem, em sua cláusula `uses`, a
  dependência `UnitA`, e `UnitA` está presente na lista de Project Units
  do `.dpr` aberto
- **THEN** o nó `UnitA` é renderizado com o estilo de Project Unit

#### Scenario: Dependência direta que é uma External Unit
- **WHEN** a Root Unit `UnitPrincipal` tem, em sua cláusula `uses`, a
  dependência `Vcl.Forms`, e `Vcl.Forms` não está presente na lista de
  Project Units do `.dpr` aberto
- **THEN** o nó `Vcl.Forms` é renderizado com o estilo distinto de
  External Unit (nó folha)
