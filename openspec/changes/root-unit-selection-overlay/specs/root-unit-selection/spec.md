# Spec Delta

## MODIFIED Requirements

### Requirement: Listagem e busca de Project Units para escolha da Root Unit
Após abrir um Projeto, o sistema SHALL exibir todas as Project Units do
`.dpr` (nome e caminho) como um overlay flutuante sobreposto à tela atual
(grafo ou o que estiver visível), no mesmo estilo visual do diálogo `Abrir
recente` (capability `recent-projects`): card centralizado com backdrop,
cada item exibindo o nome da unit em destaque e o caminho do arquivo como
subtexto secundário. O sistema SHALL permitir filtrar a lista por um texto
digitado pelo usuário, comparado de forma case-insensitive contra o nome da
unit **e** contra o caminho do arquivo.

#### Scenario: Tela lista todas as Project Units do `.dpr` aberto
- **WHEN** o Projeto aberto tem Project Units `UnitA`, `UnitB` e `UnitC`
- **THEN** o overlay de Seleção de Unit exibe as três, cada uma com o nome
  em destaque e o caminho do arquivo como subtexto

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

### Requirement: Navegação por teclado e fechamento condicional do overlay de Seleção de Unit
O overlay de Seleção de Unit SHALL suportar navegação por teclado: `↑` e `↓`
SHALL mover o destaque entre os itens da lista filtrada, com wrap-around (do
último item o destaque volta ao primeiro, e vice-versa), e `Enter` SHALL
selecionar o item destacado como Root Unit, com o mesmo efeito de clicar
nele.

`Esc` e o clique fora do card SHALL fechar o overlay sem selecionar nada,
mas somente quando o overlay foi (re)aberto sobre uma tela de grafo já
renderizada (via `Edição > Selecionar Unit`, capability
`application-menu`) — nesse caso o grafo exibido antes de abrir o overlay
SHALL permanecer inalterado. Quando o overlay é exibido automaticamente
logo após abrir um Projeto — antes de qualquer Root Unit ter sido escolhida
nessa sessão de Projeto e sem nenhum grafo renderizado — `Esc` e o clique
fora do card SHALL não ter efeito algum: a escolha de uma Root Unit
continua obrigatória.

#### Scenario: Navegar e confirmar com o teclado
- **WHEN** a lista filtrada é `[UnitA, UnitB]` e o usuário pressiona `↓` e
  depois `Enter`
- **THEN** `UnitB` é selecionada como Root Unit e seu grafo é exibido

#### Scenario: Wrap-around na navegação
- **WHEN** o último item da lista filtrada está destacado e o usuário
  pressiona `↓`
- **THEN** o destaque volta para o primeiro item da lista

#### Scenario: Fechar com Esc quando já existe grafo renderizado
- **WHEN** o usuário reabre a Seleção de Unit via `Edição > Selecionar
  Unit` com um grafo já exibido na tela, e pressiona `Esc`
- **THEN** o overlay fecha, nenhuma nova Root Unit é selecionada, e o
  grafo que estava sendo exibido permanece o mesmo

#### Scenario: Fechar clicando fora do card quando já existe grafo renderizado
- **WHEN** o usuário reabre a Seleção de Unit via `Edição > Selecionar
  Unit` com um grafo já exibido, e clica fora do card do overlay
- **THEN** o overlay fecha da mesma forma que ao pressionar `Esc`

#### Scenario: Esc não tem efeito na primeira abertura automática
- **WHEN** o usuário acabou de abrir um `.dpr` (nenhuma Root Unit
  escolhida ainda nessa sessão de Projeto, nenhum grafo renderizado) e o
  overlay de Seleção de Unit é exibido automaticamente, e o usuário
  pressiona `Esc`
- **THEN** o overlay permanece aberto e nenhuma mudança ocorre

#### Scenario: Clique fora do card não tem efeito na primeira abertura automática
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card
- **THEN** o overlay permanece aberto e nenhuma mudança ocorre
