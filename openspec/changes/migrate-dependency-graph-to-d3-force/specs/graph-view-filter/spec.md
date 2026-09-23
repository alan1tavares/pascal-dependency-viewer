# Spec Delta

## ADDED Requirements

### Requirement: Alternar o View Filter reaquece a física do grafo
Quando o estado de qualquer um dos três checkboxes do View Filter
muda, o sistema SHALL reativar a simulação de física do grafo,
permitindo que os nós atualmente visíveis se reorganizem, e SHALL
estabilizar e desligar a física automaticamente ao final — do mesmo
modo que ocorre na exibição inicial do grafo, sem exigir nenhuma ação
adicional do usuário.

#### Scenario: Alternar um checkbox reaquece a física
- **WHEN** o grafo já está estabilizado (física desligada) e o usuário
  altera o estado de qualquer checkbox do View Filter
- **THEN** a simulação de física é reativada, os nós visíveis podem se
  reposicionar, e a física se estabiliza e desliga novamente ao final,
  sem intervenção do usuário

#### Scenario: Nó arrastado anteriormente não fica fixo durante o reaquecimento
- **WHEN** um nó foi arrastado manualmente antes da mudança de filtro,
  e o usuário altera o estado de um checkbox do View Filter
- **THEN** esse nó não permanece fixo na posição em que foi arrastado —
  ele participa do reaquecimento da física como qualquer outro nó
  visível
