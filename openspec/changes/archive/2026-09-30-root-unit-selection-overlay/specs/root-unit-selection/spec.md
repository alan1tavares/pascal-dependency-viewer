# Spec Delta

## MODIFIED Requirements

### Requirement: Listagem e busca de Project Units para escolha da Root Unit
Após abrir um Projeto, o sistema SHALL exibir todas as Project Units do
`.dpr` (nome e caminho) no modo `Selecionar Unit` da Command Palette
(capability `command-palette`): mesmo overlay/card já usado pelos demais
modos da paleta, cada item exibindo o nome da unit em destaque e o caminho
do arquivo como subtexto secundário. O sistema SHALL permitir filtrar a
lista por um texto digitado pelo usuário, comparado de forma
case-insensitive contra o nome da unit **e** contra o caminho do arquivo.

#### Scenario: Tela lista todas as Project Units do `.dpr` aberto
- **WHEN** o Projeto aberto tem Project Units `UnitA`, `UnitB` e `UnitC`
- **THEN** o modo `Selecionar Unit` da Command Palette exibe as três, cada
  uma com o nome em destaque e o caminho do arquivo como subtexto

#### Scenario: Usuário filtra a lista por texto
- **WHEN** o usuário digita `unitb` no campo de busca
- **THEN** somente as Project Units cujo nome contém `unitb`
  (case-insensitive) permanecem visíveis na lista

#### Scenario: Usuário filtra a lista por caminho do arquivo
- **WHEN** as Project Units listadas são `Vendas` (caminho
  `modulos/vendas/Vendas.pas`) e `Relatorios` (caminho
  `modulos/estoque/Relatorios.pas`), e o usuário digita `estoque`
- **THEN** somente `Relatorios` permanece visível, porque seu caminho
  contém `estoque` mesmo que seu nome não contenha

## ADDED Requirements

### Requirement: Navegação por teclado no modo Selecionar Unit
No modo `Selecionar Unit`, `↑` e `↓` SHALL mover o destaque entre os itens
da lista filtrada, com wrap-around (do último item o destaque volta ao
primeiro, e vice-versa), e `Enter` SHALL selecionar o item destacado como
Root Unit, com o mesmo efeito de clicar nele.

#### Scenario: Navegar e confirmar com o teclado
- **WHEN** a lista filtrada é `[UnitA, UnitB]` e o usuário pressiona `↓` e
  depois `Enter`
- **THEN** `UnitB` é selecionada como Root Unit e seu grafo é exibido

#### Scenario: Wrap-around na navegação
- **WHEN** o último item da lista filtrada está destacado e o usuário
  pressiona `↓`
- **THEN** o destaque volta para o primeiro item da lista

### Requirement: Origem da entrada no modo Selecionar Unit decide o fechamento condicional
O sistema SHALL abrir o modo `Selecionar Unit` da Command Palette a partir
de três origens distintas, cada uma com sua própria regra de fechamento sem
selecionar (o mecanismo de modo/entrada e o estado "não-fechável" em si são
definidos pela capability `command-palette`):

- **Automática, ao carregar um Projeto**: exibida automaticamente logo após
  abrir um `.dpr`, antes de qualquer Root Unit ter sido escolhida nessa
  sessão de Projeto (nenhum grafo renderizado ainda). `Esc`, o clique fora
  do card e os atalhos que trocam de modo da paleta SHALL não ter efeito
  algum: a escolha de uma Root Unit continua obrigatória.
- **Pelo Command `Selecionar Unit` da Command Palette**: só disponível
  depois de um Projeto já carregado (portanto sempre com pelo menos uma
  Root Unit já escolhida antes). `Esc` SHALL fechar o modo e voltar à lista
  de Commands da paleta (com o input vazio), sem selecionar nada e sem
  alterar o grafo exibido antes. O clique fora do card SHALL fechar a
  paleta inteira (sem voltar à lista de Commands), também sem selecionar
  nada e sem alterar o grafo exibido antes.
- **Pelo menu `Edição > Selecionar Unit`** (capability `application-menu`):
  disponível apenas com um grafo já renderizado para o Projeto atual.
  `Esc` e o clique fora do card SHALL igualmente fechar a paleta inteira,
  sem selecionar nada e sem alterar o grafo exibido antes.

#### Scenario: Esc e clique fora não têm efeito na abertura automática
- **WHEN** o usuário acabou de abrir um `.dpr` (nenhuma Root Unit escolhida
  ainda nessa sessão de Projeto) e o modo `Selecionar Unit` é exibido
  automaticamente, e o usuário pressiona `Esc` ou clica fora do card
- **THEN** o modo permanece aberto e nenhuma mudança ocorre

#### Scenario: Cmd/Ctrl+P e Cmd/Ctrl+K R não têm efeito na abertura automática
- **WHEN** nas mesmas condições do cenário anterior, o usuário pressiona
  `Cmd/Ctrl+P` ou aciona `Cmd/Ctrl+K R`
- **THEN** a paleta permanece no modo `Selecionar Unit` e nenhuma mudança
  ocorre

#### Scenario: Esc volta à lista de Commands quando aberto pelo Command da paleta
- **WHEN** o usuário abre a Command Palette, executa o Command `Selecionar
  Unit` e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands (input vazio), nenhuma nova
  Root Unit é selecionada e o grafo exibido antes permanece o mesmo

#### Scenario: Clique fora fecha tudo quando aberto pelo Command da paleta
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card em vez de pressionar `Esc`
- **THEN** a paleta fecha inteiramente (não volta à lista de Commands),
  nenhuma nova Root Unit é selecionada e o grafo exibido antes permanece o
  mesmo

#### Scenario: Esc fecha tudo quando aberto pelo menu Edição
- **WHEN** o usuário reabre a Seleção de Unit via `Edição > Selecionar
  Unit` com um grafo já exibido na tela, e pressiona `Esc`
- **THEN** a paleta fecha inteiramente, nenhuma nova Root Unit é
  selecionada e o grafo que estava sendo exibido permanece o mesmo

#### Scenario: Clique fora fecha tudo quando aberto pelo menu Edição
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card em vez de pressionar `Esc`
- **THEN** o mesmo efeito do cenário anterior ocorre
