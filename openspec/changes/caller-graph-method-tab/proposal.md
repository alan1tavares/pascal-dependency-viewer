# Proposal

## Why

Hoje o app só mostra para quem uma Unit olha (o Dependency Graph, de cima para
baixo). Falta a pergunta inversa, essencial para analisar impacto em código
Delphi: "quem chega até este Method?". A change `pascal-parser-and-call-index`
entrega o parser, o índice de chamadas e o Caller Graph como dados; esta change
expõe isso ao usuário — o Command `Selecionar Método`, hoje um placeholder no
menu `Edição`, e uma Method Tab que desenha o Caller Graph de baixo para cima.

## What Changes

- `Selecionar Método` passa a ser um Command do catálogo e um novo modo da
  Command Palette, oferecido só quando a Tab ativa é uma Unit Tab. Sem atalho.
- O modo `Selecionar Método` lista os Methods da Root Unit da Unit Tab ativa
  (rótulo `TCliente.Salvar` ou `Salvar`, ordem do fonte, mesmo filtro dos
  outros modos), mostra `Analisando Project…` enquanto o índice de chamadas é
  montado e uma mensagem quando a Unit não tem Methods. `Esc` fecha a paleta
  sem interromper a análise.
- **BREAKING** (comportamento): `Edição > Selecionar Método` deixa de exibir o
  alerta "ainda será implementado" e passa a abrir o modo `Selecionar Método`;
  o item fica desabilitado no menu nativo quando a Tab ativa não é uma Unit
  Tab. O renderer passa a informar o main do tipo da Tab ativa a cada troca.
- Novo tipo de Tab, a Method Tab: identificada pelo Target Method (reescolher
  apenas a ativa), título `TCliente.Salvar`, tooltip `Unit — caminho do .pas`;
  abrir um Project fecha todas as Method Tabs, junto com as Unit Tabs.
- Nova visualização do Caller Graph na Method Tab: layout de baixo para cima,
  Target Method destacado na base, setas do Caller para o Method chamado,
  self-loops, back-edges tracejados, Polymorphic Calls com cor própria e
  tooltip `via TBase.Salvar`, Entry Points com cor própria, blocos especiais
  (`Programa`, `UnitX (initialization)`) com a cor de Entry Point e outro
  formato, e aviso com as Units que não puderam ser analisadas. Sem View
  Filter e sem navegação por clique nos nós.

## Capabilities

### New Capabilities
- `caller-graph-view`: como a Method Tab desenha o Caller Graph de um Target
  Method — orientação, destaque, estilos de nós e arestas, rótulos, tooltips
  e aviso de Units não analisadas.

### Modified Capabilities
- `command-palette`: `Selecionar Método` entra no catálogo de Commands, com
  disponibilidade condicionada à Tab ativa, e ganha um modo próprio na paleta.
- `application-menu`: `Edição > Selecionar Método` deixa de ser um aviso de
  funcionalidade pendente; abre o modo `Selecionar Método` e fica
  desabilitado fora de uma Unit Tab.
- `tabs`: novo tipo de Tab (Method Tab) — abertura, identidade, título e
  tooltip, preservação de estado e fechamento ao abrir um Project.

## Impact

- **Código**: `src/domain/commands` (catálogo e `availableCommands` com o tipo
  da Tab ativa), `src/domain/tabs` (Method Tab), `src/main/menu.js`,
  `src/main/commands.js`, `src/main/index.js` (estado habilitado do item de
  menu), `src/preload/api.js`, `src/renderer/components/{App,CommandPalette,TabBar}.svelte`,
  novo componente de visualização do Caller Graph, `src/renderer/stores/tabs.js`
  e os testes correspondentes.
- **IPC**: novo canal renderer→main para informar o tipo da Tab ativa
  (`tabs:active-kind`) e novo push main→renderer (`app:show-method-selection`),
  além do consumo dos canais `methods:list` (preload `listUnitMethods`) e
  `callerGraph:expand` (preload `expandCallerGraph`) definidos por
  `pascal-parser-and-call-index`.
- **Dependências entre changes**: requer `rename-graph-tab-to-unit-tab`
  (vocabulário Unit Tab, `unitTabId`, prefixo `unit:`) e
  `pascal-parser-and-call-index` (parser, índice em cache no main e contrato
  do Caller Graph) aplicadas antes.
- **Bibliotecas**: nenhuma nova; reutiliza `vis-network`/`vis-data`.
