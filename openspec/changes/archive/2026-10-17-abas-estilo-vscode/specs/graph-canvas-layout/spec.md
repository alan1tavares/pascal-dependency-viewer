# Spec Delta

## MODIFIED Requirements

### Requirement: A área de renderização preenche a janela
O sistema SHALL fazer com que a área de conteúdo das Tabs (capability
`tabs`) ocupe toda a largura da janela do Electron e toda a altura abaixo
da barra de Tabs, e que o container do grafo de cada Graph Tab e o
conteúdo da Welcome Tab preencham essa área, independentemente do tamanho
ou estado da janela (normal, maximizada ou tela cheia).

#### Scenario: Grafo exibido em janela maximizada
- **WHEN** o usuário escolhe uma Root Unit e depois maximiza a janela do
  app
- **THEN** o grafo renderizado pelo `vis-network` preenche toda a área
  visível abaixo da barra de Tabs, sem sobras de espaço em branco ao redor
  do container

#### Scenario: Grafo exibido em janela no tamanho padrão
- **WHEN** o usuário escolhe uma Root Unit sem redimensionar a janela
- **THEN** o grafo renderizado ocupa toda a área abaixo da barra de Tabs,
  não apenas uma região reduzida no canto da tela

#### Scenario: Tela de seleção de Root Unit em janela maximizada
- **WHEN** o usuário abre um `.dpr` e maximiza a janela antes de escolher a
  Root Unit
- **THEN** a Welcome Tab, sobre a qual a Command Palette é exibida no modo
  `Selecionar Unit`, ocupa toda a área visível abaixo da barra de Tabs

### Requirement: O grafo se redimensiona ao redimensionar a janela
Quando a janela do app é redimensionada — incluindo alternar entre
maximizada, tela cheia e tamanho normal — após o grafo já estar
renderizado, o sistema SHALL ajustar o tamanho do canvas do `vis-network`
para preencher o novo espaço disponível, sem exigir reabrir o arquivo ou
recarregar a janela manualmente. Isso SHALL valer também para Graph Tabs
que não estavam ativas durante o redimensionamento, quando forem ativadas.

#### Scenario: Maximizar a janela após o grafo já estar renderizado
- **WHEN** o grafo já está sendo exibido em uma janela no tamanho padrão e o
  usuário maximiza a janela
- **THEN** o canvas do grafo se redimensiona automaticamente para preencher
  a nova área disponível, sem necessidade de reabrir o arquivo

#### Scenario: Redimensionar com a Graph Tab inativa
- **WHEN** as Graph Tabs `UnitA` e `UnitB` estão abertas, `UnitB` está
  ativa, o usuário maximiza a janela e depois ativa `UnitA`
- **THEN** o canvas do grafo de `UnitA` preenche a nova área disponível
