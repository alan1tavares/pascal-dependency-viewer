# Spec Delta

## Purpose

Permitir que o usuário escolha qual motor de renderização (`vis-network`
ou `d3-force`) desenha o Dependency Graph, e alterne entre eles a
qualquer momento pela Command Palette, sem perder o grafo atualmente
exibido.

## ADDED Requirements

### Requirement: Renderer padrão ao iniciar o app
Ao iniciar, o sistema SHALL selecionar `vis-network` como motor de
renderização do Dependency Graph.

#### Scenario: App inicia com vis-network selecionado
- **WHEN** o app é iniciado
- **THEN** o motor de renderização selecionado é `vis-network`

### Requirement: Alternar motor re-renderiza o grafo atual
Ao executar o Command `Alternar renderização do grafo`, o sistema SHALL
trocar o motor de renderização selecionado para o outro (`vis-network`
↔ `d3-force`). Se um Dependency Graph já estiver sendo exibido, o
sistema SHALL re-renderizá-lo imediatamente com o novo motor, reusando
os mesmos nodes/edges/Root Unit já carregados — sem nova leitura de
arquivos do disco nem nova chamada de expansão do grafo. Se nenhum
grafo estiver sendo exibido, o sistema SHALL apenas guardar a nova
seleção para a próxima renderização.

#### Scenario: Alternar com um grafo em exibição
- **WHEN** um Dependency Graph está sendo exibido com o motor
  `vis-network` e o usuário executa `Alternar renderização do grafo`
- **THEN** o mesmo grafo (mesmos nodes/edges/Root Unit) é re-renderizado
  imediatamente com o motor `d3-force`, sem nenhuma leitura de arquivo
  do disco

#### Scenario: Alternar sem nenhum grafo em exibição
- **WHEN** nenhum Dependency Graph está sendo exibido e o usuário
  executa `Alternar renderização do grafo`
- **THEN** nenhum grafo é renderizado nesse momento, e o motor
  selecionado passa a ser usado na próxima vez que um Dependency Graph
  for exibido

### Requirement: Seleção de motor não persiste entre sessões
O sistema NÃO SHALL salvar em disco qual motor está selecionado. A cada
novo início do app, a seleção SHALL voltar ao padrão (`vis-network`),
independentemente do motor selecionado na sessão anterior.

#### Scenario: Reabrir o app depois de alternar para d3-force
- **WHEN** o usuário alterna para `d3-force` durante uma sessão e depois
  fecha e reabre o app
- **THEN** o app inicia com `vis-network` selecionado novamente
