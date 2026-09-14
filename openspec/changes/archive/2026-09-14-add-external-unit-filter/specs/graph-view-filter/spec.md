## MODIFIED Requirements

### Requirement: Painel flutuante de View Filter sobre o grafo
Sempre que a tela do grafo (`#mynetwork`) é exibida, o sistema SHALL
mostrar um painel flutuante compacto, ancorado no canto superior direito
da área do grafo, contendo três checkboxes independentes rotulados
"Interface", "Implementação" e "Unidades Externas". O painel SHALL
permanecer visível sobre o grafo independentemente de pan, zoom ou
redimensionamento da janela.

#### Scenario: Painel aparece junto com o grafo
- **WHEN** o usuário seleciona uma Root Unit e o grafo é renderizado
- **THEN** o painel de View Filter aparece no canto superior direito da
  tela, sobreposto ao grafo, com os três checkboxes visíveis

#### Scenario: Painel permanece visível ao interagir com o grafo
- **WHEN** o grafo já está sendo exibido e o usuário arrasta ou dá zoom
  nele
- **THEN** o painel de View Filter continua visível no canto superior
  direito, sem ser coberto nem se mover junto com o conteúdo do grafo

### Requirement: Estado inicial do View Filter
Ao exibir o grafo pela primeira vez, os checkboxes "Interface" e
"Implementação" SHALL iniciar marcados, mostrando todas as Uses Clause
Origins. O checkbox "Unidades Externas" SHALL iniciar desmarcado,
ocultando as External Units do grafo já na primeira exibição.

#### Scenario: Grafo exibido pela primeira vez
- **WHEN** o usuário seleciona uma Root Unit e o grafo é exibido pela
  primeira vez
- **THEN** os checkboxes "Interface" e "Implementação" aparecem
  marcados, o checkbox "Unidades Externas" aparece desmarcado, e nenhuma
  External Unit é exibida no grafo inicial

## ADDED Requirements

### Requirement: Checkbox de Unidades Externas sem trava de mínimo
Diferente dos checkboxes de Uses Clause Origin, o sistema SHALL permitir
desmarcar o checkbox "Unidades Externas" livremente, em qualquer
combinação de estado dos demais checkboxes do View Filter, inclusive com
"Interface" e "Implementação" ambos desmarcados.

#### Scenario: Desmarcar Unidades Externas nunca é bloqueado
- **WHEN** o checkbox "Unidades Externas" está marcado, independentemente
  do estado de "Interface" e "Implementação"
- **THEN** o usuário consegue desmarcá-lo normalmente, e o clique não é
  revertido

### Requirement: Filtro dinâmico de visibilidade de External Units
Quando o checkbox "Unidades Externas" está desmarcado, o sistema SHALL
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
  porque "Unidades Externas" está desmarcada, "Interface" está marcada,
  e o usuário marca "Unidades Externas" novamente
- **THEN** a aresta `UnitA -> Vcl.Forms` e o node `Vcl.Forms` voltam a
  ser exibidos, sem nova leitura de arquivos do disco

#### Scenario: Unidades Externas marcada não sobrepõe o filtro de origem
- **WHEN** a aresta `UnitA -> Vcl.Forms` tem origem `implementation`,
  "Unidades Externas" está marcada, mas "Implementação" está desmarcada
- **THEN** a aresta `UnitA -> Vcl.Forms` continua oculta, pois o filtro
  de Uses Clause Origin ainda esconde arestas `implementation`
