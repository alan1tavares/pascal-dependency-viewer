# graph-view-filter

## Purpose

Permitir que o usuário alterne, na própria tela do grafo, quais Uses
Clause Origins (`interface`, `implementation`, ou ambas) ficam visíveis,
através de um painel flutuante fixo, refletindo a escolha dinamicamente
no grafo já carregado — sem nova leitura de arquivos do disco.

## Requirements

### Requirement: Painel flutuante de View Filter sobre o grafo
Sempre que a tela do grafo (`#mynetwork`) é exibida, o sistema SHALL
mostrar um painel flutuante compacto, ancorado no canto superior direito
da área do grafo, contendo dois checkboxes independentes rotulados
"Interface" e "Implementação". O painel SHALL permanecer visível sobre o
grafo independentemente de pan, zoom ou redimensionamento da janela.

#### Scenario: Painel aparece junto com o grafo
- **WHEN** o usuário seleciona uma Root Unit e o grafo é renderizado
- **THEN** o painel de View Filter aparece no canto superior direito da
  tela, sobreposto ao grafo

#### Scenario: Painel permanece visível ao interagir com o grafo
- **WHEN** o grafo já está sendo exibido e o usuário arrasta ou dá zoom
  nele
- **THEN** o painel de View Filter continua visível no canto superior
  direito, sem ser coberto nem se mover junto com o conteúdo do grafo

### Requirement: Estado inicial do View Filter
Ao exibir o grafo pela primeira vez, os dois checkboxes do View Filter
("Interface" e "Implementação") SHALL iniciar marcados, mostrando o
Dependency Graph completo (todas as Uses Clause Origins).

#### Scenario: Grafo exibido pela primeira vez
- **WHEN** o usuário seleciona uma Root Unit e o grafo é exibido pela
  primeira vez
- **THEN** os checkboxes "Interface" e "Implementação" aparecem ambos
  marcados

### Requirement: Pelo menos uma origem sempre marcada
O sistema SHALL impedir que os dois checkboxes do View Filter fiquem
desmarcados ao mesmo tempo: ao tentar desmarcar o único checkbox ainda
marcado, essa ação SHALL ser ignorada e o checkbox permanece marcado.

#### Scenario: Tentativa de desmarcar o último checkbox marcado
- **WHEN** apenas "Interface" está marcada e o usuário clica nela para
  desmarcá-la
- **THEN** o clique não tem efeito e "Interface" continua marcada

### Requirement: Filtro dinâmico do grafo por Uses Clause Origin
Quando o estado do View Filter muda, o sistema SHALL atualizar a exibição
do grafo já carregado — sem nova chamada de expansão nem nova leitura de
arquivos — mostrando somente as arestas cuja Uses Clause Origin tenha
pelo menos uma das origens marcadas nos checkboxes. Uma aresta com origem
`both` permanece visível enquanto pelo menos um dos dois checkboxes
estiver marcado.

#### Scenario: Desmarcar Implementação esconde arestas de origem só-implementation
- **WHEN** o grafo tem uma aresta `UnitA -> UnitB` com origem
  `implementation`, e o usuário desmarca "Implementação" mantendo
  "Interface" marcada
- **THEN** a aresta `UnitA -> UnitB` deixa de ser exibida

#### Scenario: Aresta de origem `both` permanece visível com qualquer uma marcada
- **WHEN** o grafo tem uma aresta `UnitA -> UnitC` com origem `both`, e o
  usuário desmarca "Implementação" mantendo "Interface" marcada
- **THEN** a aresta `UnitA -> UnitC` continua sendo exibida

#### Scenario: Remarcar uma origem reexibe as arestas correspondentes
- **WHEN** a aresta `UnitA -> UnitB` (origem `implementation`) está
  oculta porque "Implementação" está desmarcada, e o usuário marca
  "Implementação" novamente
- **THEN** a aresta `UnitA -> UnitB` volta a ser exibida imediatamente,
  sem nova leitura de arquivos do disco

### Requirement: Node sem aresta visível some do grafo, exceto a Root Unit
Depois de aplicar o View Filter, o sistema SHALL ocultar todo node que
não tenha mais nenhuma aresta visível — à exceção da Root Unit, que o
sistema SHALL manter sempre visível mesmo sem nenhuma aresta visível
remanescente.

#### Scenario: Unit só alcançável via implementation some ao desmarcar Implementação
- **WHEN** `UnitB` só é alcançável a partir da Root Unit por uma aresta
  de origem `implementation`, e o usuário desmarca "Implementação"
- **THEN** o node `UnitB` deixa de ser exibido no grafo

#### Scenario: Root Unit permanece visível mesmo isolada
- **WHEN**, depois de desmarcar uma das origens, a Root Unit fica sem
  nenhuma aresta visível porque todas as suas dependências eram
  daquela origem
- **THEN** o node da Root Unit continua sendo exibido no grafo
