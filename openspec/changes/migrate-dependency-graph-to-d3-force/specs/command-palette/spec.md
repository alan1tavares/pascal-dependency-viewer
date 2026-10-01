# Spec Delta

## MODIFIED Requirements

### Requirement: Catálogo de Commands e disponibilidade
A lista de Commands SHALL conter, nesta ordem, `Abrir projeto (.dpr)`, `Abrir
recente`, `Selecionar Unit` e `Alternar renderização do grafo`. `Selecionar
Método` e `Sair` NÃO SHALL ser Commands da paleta.

`Selecionar Unit` SHALL ser exibido somente se algum Project já tiver sido
aberto na sessão (mesmo critério usado por `Edição > Selecionar Unit`); caso
contrário SHALL ser omitido da lista. `Alternar renderização do grafo` SHALL
ser exibido sempre, independentemente de haver um Project aberto na sessão.

#### Scenario: Sem Project aberto
- **WHEN** nenhum Project foi aberto na sessão e o usuário abre a paleta
- **THEN** a lista mostra `Abrir projeto (.dpr)`, `Abrir recente` e `Alternar
  renderização do grafo`, nessa ordem

#### Scenario: Com Project aberto
- **WHEN** um Project já foi aberto na sessão e o usuário abre a paleta
- **THEN** a lista mostra `Abrir projeto (.dpr)`, `Abrir recente`,
  `Selecionar Unit` e `Alternar renderização do grafo`, nessa ordem

#### Scenario: Selecionar Unit aparece após abrir um Project pela própria paleta
- **WHEN** o usuário abre um Project pelo Command `Abrir projeto (.dpr)` e
  abre a paleta de novo
- **THEN** `Selecionar Unit` passa a ser exibido

### Requirement: Execução de um Command
Ao executar um Command, a paleta SHALL se fechar antes de a ação ser
disparada, com a única exceção de `Abrir recente`, que troca a paleta para o
modo `Abrir recente`.

- `Abrir projeto (.dpr)` SHALL seguir o mesmo fluxo do item `Arquivo > Abrir
  projeto (.dpr)`: abrir o diálogo nativo de seleção de `.dpr`, parsear o
  arquivo escolhido e notificar o renderer via `app:project-loaded`. Se o
  usuário cancelar o diálogo nativo, nenhum Project é carregado, o estado do
  app permanece como estava e a paleta NÃO SHALL reaparecer.
- `Selecionar Unit` SHALL seguir o mesmo fluxo do item `Edição > Selecionar
  Unit`, reabrindo a tela de seleção de Root Unit do último Project
  carregado.
- `Abrir recente` SHALL trocar o conteúdo da paleta para a lista de Recent
  Projects (modo `Abrir recente`), sem fechar a paleta.
- `Alternar renderização do grafo` SHALL alternar o motor de renderização
  selecionado para o Dependency Graph, com o efeito descrito na capability
  `graph-renderer-selection`.

#### Scenario: Executar "Abrir projeto (.dpr)" pela paleta
- **WHEN** o usuário escolhe `Abrir projeto (.dpr)` na paleta e seleciona um
  `.dpr` no diálogo nativo
- **THEN** a paleta é fechada antes do diálogo nativo, o arquivo é parseado
  e a tela de seleção de Root Unit é exibida com as Project Units dele

#### Scenario: Cancelar o diálogo nativo aberto pela paleta
- **WHEN** o usuário escolhe `Abrir projeto (.dpr)` na paleta e cancela o
  diálogo nativo
- **THEN** nenhum evento `app:project-loaded` é enviado, o estado do app não
  muda e a paleta continua fechada

#### Scenario: Executar "Selecionar Unit" pela paleta
- **WHEN** um Project está aberto e o usuário escolhe `Selecionar Unit` na
  paleta
- **THEN** a paleta é fechada e a tela de seleção de Root Unit é exibida com
  as Project Units do último Project carregado

#### Scenario: Executar "Abrir recente" pela paleta
- **WHEN** o usuário escolhe `Abrir recente` na paleta
- **THEN** a paleta continua aberta e passa a exibir o modo `Abrir recente`,
  com o prefixo fixo `Abrir recente` e a lista de Recent Projects

#### Scenario: Executar "Alternar renderização do grafo" pela paleta
- **WHEN** o usuário escolhe `Alternar renderização do grafo` na paleta
- **THEN** a paleta é fechada e o motor de renderização do Dependency Graph
  é alternado, conforme a capability `graph-renderer-selection`
