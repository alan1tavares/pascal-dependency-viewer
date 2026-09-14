## REMOVED Requirements

### Requirement: Controle de Uses Clause Scope na tela de busca/listagem
**Reason**: A escolha entre `interface` e `interface + implementation`
deixa de ser feita antes de gerar o grafo. A expansão a partir da Root
Unit passa a seguir sempre as duas seções (ver
`dependency-graph-expansion`), e o que fica visível ao usuário passa a
ser decidido por um View Filter dinâmico na própria tela do grafo.
**Migration**: Use o painel de View Filter da capability
`graph-view-filter`, na tela do grafo, para escolher o que exibir depois
que o grafo já foi gerado.

## MODIFIED Requirements

### Requirement: Seleção de uma Root Unit renderiza seu grafo de dependências direto
Ao escolher uma Project Unit na tela de busca/listagem como Root Unit, o
sistema SHALL expandir recursivamente todas as Project Units alcançáveis
a partir dela via `uses` — sempre considerando tanto a seção `interface`
quanto a `implementation` de cada unidade visitada — produzindo o
Dependency Graph completo, não apenas a Root Unit e suas dependências
diretas, usando `expandDependencyGraph` com um `readFile` que resolve o
caminho de cada Project Unit a partir do diretório do `.dpr` aberto, sem
exigir reabrir ou recarregar a janela manualmente. Cada dependência
encontrada durante a expansão SHALL ser classificada como Project Unit ou
External Unit, comparando seu nome contra a lista de Project Units do
Projeto aberto, e o grafo renderizado SHALL exibir as External Unit com
um estilo visual distinto (nó folha) das Project Unit. Uma mesma unidade
alcançável por mais de um caminho a partir da Root Unit SHALL aparecer
como um único nó no grafo renderizado. Quais dessas arestas ficam
visíveis ao usuário — de acordo com a Uses Clause Origin de cada uma — é
decidido pelo View Filter da tela do grafo (capability
`graph-view-filter`), não por nenhuma escolha feita na tela de
busca/listagem.

#### Scenario: Usuário escolhe uma Root Unit na listagem
- **WHEN** o usuário clica na Project Unit `UnitPrincipal` (caminho
  `UnitPrincipal.pas`, relativo ao diretório do `.dpr` aberto) na tela de
  busca/listagem
- **THEN** o app lê `UnitPrincipal.pas` do disco, extrai seu nome de unit e
  sua cláusula `uses`, e exibe o grafo com o nó `UnitPrincipal` e um edge
  para cada dependência direta

#### Scenario: Dependência transitiva de uma Project Unit intermediária aparece no grafo
- **WHEN** a Root Unit `UnitPrincipal` tem, em sua cláusula `uses`, a
  dependência `UnitA` (Project Unit do `.dpr` aberto), e `UnitA` tem, por
  sua vez, `uses UnitB` (também Project Unit)
- **THEN** o grafo renderizado contém nós para `UnitPrincipal`, `UnitA` e
  `UnitB`, com edges `UnitPrincipal -> UnitA` e `UnitA -> UnitB`

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

#### Scenario: Root Unit escolhida com o controle em `interface` (padrão)
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` na seção
  `interface` e `uses UnitB` só na seção `implementation`
- **THEN** o grafo gerado contém o edge `UnitPrincipal -> UnitA` — a tela
  de busca/listagem não tem mais nenhum controle cujo valor precise ser
  `interface` para isso acontecer, já que não existe mais escolha
  nenhuma nessa tela

#### Scenario: Root Unit escolhida com o controle em `interface + implementation`
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` na seção
  `interface` e `uses UnitB` só na seção `implementation`
- **THEN** o grafo gerado contém também o edge `UnitPrincipal -> UnitB`,
  sempre, sem exigir nenhuma escolha prévia na tela de busca/listagem

#### Scenario: Escopo escolhido na tela vale para toda a expansão, não só a Root Unit
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` (Project Unit) na
  seção `interface`, e `UnitA` tem `uses UnitB` (Project Unit) só na
  seção `implementation`
- **THEN** o grafo renderizado contém os edges `UnitPrincipal -> UnitA` e
  `UnitA -> UnitB` — o comportamento se aplica a toda a expansão, não só
  à Root Unit, e não depende de nenhuma escolha feita nesta tela
