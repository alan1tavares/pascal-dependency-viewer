# graph-view-filter

## Purpose

Permitir que o usuário alterne, na própria tela do grafo, quais Uses
Clause Origins (`interface`, `implementation`, ou ambas) ficam visíveis,
através de um painel flutuante fixo, refletindo a escolha dinamicamente
no grafo já carregado — sem nova leitura de arquivos do disco.

## Requirements

### Requirement: Painel flutuante de View Filter sobre o grafo
Sempre que uma Graph Tab está ativa, o sistema SHALL mostrar, sobre o grafo
dela, um painel flutuante compacto, ancorado no canto superior direito da
área do grafo (abaixo da barra de Tabs), contendo três checkboxes
independentes rotulados "Interface", "Implementation" e "Unidades
Externas". O painel SHALL permanecer visível sobre o grafo
independentemente de pan, zoom ou redimensionamento da janela, e SHALL não
ser exibido quando a Tab ativa não é uma Graph Tab.

#### Scenario: Painel aparece junto com o grafo
- **WHEN** o usuário seleciona uma Root Unit e o grafo é renderizado na
  nova Graph Tab
- **THEN** o painel de View Filter aparece no canto superior direito da
  área do grafo, abaixo da barra de Tabs, sobreposto ao grafo, com os três
  checkboxes visíveis

#### Scenario: Painel permanece visível ao interagir com o grafo
- **WHEN** o grafo já está sendo exibido e o usuário arrasta ou dá zoom
  nele
- **THEN** o painel de View Filter continua visível no canto superior
  direito, sem ser coberto nem se mover junto com o conteúdo do grafo

#### Scenario: Painel não aparece na Welcome Tab
- **WHEN** há Graph Tabs abertas e o usuário ativa a Welcome Tab
- **THEN** nenhum painel de View Filter é exibido

### Requirement: Estado inicial do View Filter
Ao abrir uma nova Graph Tab, os checkboxes "Interface" e "Implementation"
dela SHALL iniciar marcados, mostrando todas as Uses Clause Origins. O
checkbox "External" SHALL iniciar desmarcado, ocultando as
External Units do grafo já na primeira exibição. O estado do View Filter
de outras Graph Tabs abertas SHALL não influenciar o estado inicial.

#### Scenario: Grafo exibido pela primeira vez
- **WHEN** o usuário seleciona uma Root Unit e o grafo é exibido pela
  primeira vez numa nova Graph Tab
- **THEN** os checkboxes "Interface" e "Implementation" aparecem
  marcados, o checkbox "External" aparece desmarcado, e nenhuma
  External Unit é exibida no grafo inicial

#### Scenario: Nova Graph Tab ignora o filtro das outras
- **WHEN** na Graph Tab `UnitA` o usuário marcou "External" e
  depois escolhe a Root Unit `UnitB`
- **THEN** a nova Graph Tab `UnitB` abre com "External"
  desmarcada

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
  `implementation`, e o usuário desmarca "Implementation" mantendo
  "Interface" marcada
- **THEN** a aresta `UnitA -> UnitB` deixa de ser exibida

#### Scenario: Aresta de origem `both` permanece visível com qualquer uma marcada
- **WHEN** o grafo tem uma aresta `UnitA -> UnitC` com origem `both`, e o
  usuário desmarca "Implementation" mantendo "Interface" marcada
- **THEN** a aresta `UnitA -> UnitC` continua sendo exibida

#### Scenario: Remarcar uma origem reexibe as arestas correspondentes
- **WHEN** a aresta `UnitA -> UnitB` (origem `implementation`) está
  oculta porque "Implementation" está desmarcada, e o usuário marca
  "Implementation" novamente
- **THEN** a aresta `UnitA -> UnitB` volta a ser exibida imediatamente,
  sem nova leitura de arquivos do disco

### Requirement: Node sem aresta visível some do grafo, exceto a Root Unit
Depois de aplicar o View Filter, o sistema SHALL ocultar todo node que
não tenha mais nenhuma aresta visível — à exceção da Root Unit, que o
sistema SHALL manter sempre visível mesmo sem nenhuma aresta visível
remanescente.

#### Scenario: Unit só alcançável via implementation some ao desmarcar Implementação
- **WHEN** `UnitB` só é alcançável a partir da Root Unit por uma aresta
  de origem `implementation`, e o usuário desmarca "Implementation"
- **THEN** o node `UnitB` deixa de ser exibido no grafo

#### Scenario: Root Unit permanece visível mesmo isolada
- **WHEN**, depois de desmarcar uma das origens, a Root Unit fica sem
  nenhuma aresta visível porque todas as suas dependências eram
  daquela origem
- **THEN** o node da Root Unit continua sendo exibido no grafo

### Requirement: Checkbox de Unidades Externas sem trava de mínimo
Diferente dos checkboxes de Uses Clause Origin, o sistema SHALL permitir
desmarcar o checkbox "External" livremente, em qualquer
combinação de estado dos demais checkboxes do View Filter, inclusive com
"Interface" e "Implementation" ambos desmarcados.

#### Scenario: Desmarcar Unidades Externas nunca é bloqueado
- **WHEN** o checkbox "External" está marcado, independentemente
  do estado de "Interface" e "Implementation"
- **THEN** o usuário consegue desmarcá-lo normalmente, e o clique não é
  revertido

### Requirement: Filtro dinâmico de visibilidade de External Units
Quando o checkbox "External" está desmarcado, o sistema SHALL
ocultar todo node do grupo External Unit e toda aresta que aponte para
um node desse grupo, independentemente do estado dos checkboxes de Uses
Clause Origin. Quando marcado, essas arestas e nodes voltam a ficar
sujeitos apenas ao filtro de Uses Clause Origin, combinado por E lógico
com este filtro.

#### Scenario: Desmarcar Unidades Externas oculta as External Units
- **WHEN** o grafo tem uma aresta `UnitA -> Vcl.Forms` visível, sendo
  `Vcl.Forms` uma External Unit, e o usuário desmarca "Unidades
  Externas"
- **THEN** a aresta `UnitA -> Vcl.Forms` e o node `Vcl.Forms` deixam de
  ser exibidos

#### Scenario: Remarcar Unidades Externas reexibe as External Units elegíveis
- **WHEN** a aresta `UnitA -> Vcl.Forms` (origem `interface`) está oculta
  porque "External" está desmarcada, "Interface" está marcada,
  e o usuário marca "External" novamente
- **THEN** a aresta `UnitA -> Vcl.Forms` e o node `Vcl.Forms` voltam a
  ser exibidos, sem nova leitura de arquivos do disco

#### Scenario: Unidades Externas marcada não sobrepõe o filtro de origem
- **WHEN** a aresta `UnitA -> Vcl.Forms` tem origem `implementation`,
  "External" está marcada, mas "Implementation" está desmarcada
- **THEN** a aresta `UnitA -> Vcl.Forms` continua oculta, pois o filtro
  de Uses Clause Origin ainda esconde arestas `implementation`

### Requirement: View Filter independente por Graph Tab
Cada Graph Tab (capability `tabs`) SHALL ter seu próprio View Filter. Mudar
os checkboxes numa Graph Tab SHALL afetar só o grafo dessa Graph Tab, e o
estado escolhido SHALL ser mantido enquanto ela estiver aberta, mesmo
quando outra Tab for ativada.

#### Scenario: Filtro de uma Graph Tab não afeta a outra
- **WHEN** as Graph Tabs `UnitA` e `UnitB` estão abertas e, na `UnitA`, o
  usuário desmarca "Implementation"
- **THEN** ao ativar `UnitB`, "Implementation" aparece marcada e as arestas
  de origem `implementation` de `UnitB` continuam visíveis

#### Scenario: Filtro mantido ao voltar para a Graph Tab
- **WHEN** na Graph Tab `UnitA` o usuário marca "External", ativa
  outra Tab e volta para `UnitA`
- **THEN** "External" continua marcada em `UnitA`
