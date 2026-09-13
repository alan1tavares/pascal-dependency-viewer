## Purpose

Garantir que a área de renderização do grafo de dependências — e as demais
telas do app — ocupem todo o espaço disponível da janela do Electron, em
qualquer tamanho ou estado (normal, maximizada ou tela cheia).

## ADDED Requirements

### Requirement: A área de renderização preenche a janela
O sistema SHALL fazer com que o container do grafo (`#mynetwork`) e a tela
de seleção de Root Unit (`#rootUnitSelection`) ocupem 100% da largura e da
altura da janela do Electron, independentemente do tamanho ou estado da
janela (normal, maximizada ou tela cheia).

#### Scenario: Grafo exibido em janela maximizada
- **WHEN** o usuário abre um arquivo `.pas` e depois maximiza a janela do
  app
- **THEN** o grafo renderizado pelo `vis-network` preenche toda a área
  visível da janela, sem sobras de espaço em branco ao redor do container

#### Scenario: Grafo exibido em janela no tamanho padrão
- **WHEN** o usuário abre um arquivo `.pas` sem redimensionar a janela
- **THEN** o grafo renderizado ocupa toda a área do container da janela,
  não apenas uma região reduzida no canto da tela

#### Scenario: Tela de seleção de Root Unit em janela maximizada
- **WHEN** o usuário abre um `.dpr` e maximiza a janela antes de escolher a
  Root Unit
- **THEN** a tela de listagem/filtro de Project Units (`#rootUnitSelection`)
  ocupa toda a área visível da janela

### Requirement: O grafo se redimensiona ao redimensionar a janela
Quando a janela do app é redimensionada — incluindo alternar entre
maximizada, tela cheia e tamanho normal — após o grafo já estar
renderizado, o sistema SHALL ajustar o tamanho do canvas do `vis-network`
para preencher o novo espaço disponível, sem exigir reabrir o arquivo ou
recarregar a janela manualmente.

#### Scenario: Maximizar a janela após o grafo já estar renderizado
- **WHEN** o grafo já está sendo exibido em uma janela no tamanho padrão e o
  usuário maximiza a janela
- **THEN** o canvas do grafo se redimensiona automaticamente para preencher
  a nova área disponível, sem necessidade de reabrir o arquivo
