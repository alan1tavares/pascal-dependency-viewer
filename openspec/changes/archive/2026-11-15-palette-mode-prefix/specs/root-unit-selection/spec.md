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

O modo SHALL exibir, junto ao input, o texto `Selecionar Unit` como prefixo
fixo, não editável, que continua visível enquanto o usuário digita — com o
mesmo aspecto e a mesma posição do prefixo dos modos `Abrir recente` e
`Selecionar Método` — e, enquanto o input estiver vazio, o texto de ajuda
`Filtrar por nome ou caminho da unit`.

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

#### Scenario: Prefixo fixo do modo Selecionar Unit
- **WHEN** o modo `Selecionar Unit` é exibido e o usuário digita `unitb`
- **THEN** o prefixo `Selecionar Unit` continua visível junto ao input, que
  contém `unitb`, e o texto digitado não inclui o prefixo

#### Scenario: Texto de ajuda com o input vazio
- **WHEN** o modo `Selecionar Unit` é exibido com o input vazio
- **THEN** o input mostra o texto de ajuda `Filtrar por nome ou caminho da
  unit`, além do prefixo `Selecionar Unit`
