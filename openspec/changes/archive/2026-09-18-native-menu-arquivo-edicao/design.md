## Context

`src/main/menu.js` hoje exporta `buildMenu(mainWindow, { performOpenProject
})`, que monta um template com um único menu `File` (`Open Project`) e o
menu nativo `{ role: "viewMenu" }` do Electron. `performOpenProject`
(`src/main/ipc/project.js`) já é reaproveitável tal como está — o rótulo
muda, a lógica não. Ver `proposal.md` para a motivação completa.

## Goals / Non-Goals

**Goals:**
- Definir a forma final do template de menu (`Arquivo` com 2 itens,
  `Edição` com 2 itens) de forma implementável em uma futura mudança de
  código, sem ambiguidade sobre rótulos, ordem ou o handler de cada um
  dos quatro itens.
- Deixar explícita a decisão sobre o menu `{ role: "viewMenu" }` existente
  (mantido).
- Definir o mecanismo (IPC) pelo qual `Selecionar Unit` reabre a tela de
  seleção de Root Unit já existente, sem introduzir um segundo lugar que
  guarde o Projeto aberto.

**Non-Goals:**
- Implementar qualquer código (`src/main/menu.js` ou qualquer outro
  arquivo) — este change entrega só os artefatos de planejamento.
- Mudar o comportamento da própria tela de seleção de Root Unit
  (`rootUnitSelection.js`) ou do fluxo `expandFromRootUnit` — `Selecionar
  Unit` reabre a tela existente tal como ela já se comporta hoje, sem
  alterá-la.

## Decisions

### `Sair` usa `role: "quit"` do Electron, não `app.quit()` direto
O template do Electron `Menu.buildFromTemplate` aceita `role: "quit"`, que
já lida com o atalho de teclado convencional por plataforma (`Cmd+Q` no
macOS, etc.) e com o texto do item ajustado pelo próprio Electron quando o
`label` é omitido. Como este change fixa o rótulo em português (`Sair`),
o item combina `label: "Sair"` com `role: "quit"` — o `role` cuida do
efeito (`app.quit()` internamente) e do atalho, o `label` cuida do texto
em português. Alternativa considerada: chamar `app.quit()` manualmente em
um `click` handler, descartada por duplicar o que `role: "quit"` já
oferece de graça (atalho, comportamento por plataforma).

### `Selecionar Método` usa `dialog.showMessageBox`, sem canal IPC novo
Como o clique só precisa exibir um aviso e não precisa de nenhum dado do
renderer, o alerta é mostrado inteiramente no processo main via
`dialog.showMessageBox(mainWindow, { message: "Selecionar Método ainda
será implementado" })`, dentro do próprio `click` handler do item de menu
— sem round-trip de IPC. Isso segue o mesmo padrão já usado por `Abrir
Projeto`, cujo `click` também roda a lógica direto no processo main.

### `{ role: "viewMenu" }` é mantido sem alteração
O usuário não pediu para alterá-lo, e ele não tem relação funcional com
`Arquivo` nem com `Edição`. Removê-lo ou reposicioná-lo seria uma decisão
não solicitada; a proposta trata "mantê-lo como está" como a decisão
padrão explícita, documentada aqui em vez de deixá-la implícita. O menu
final terá três entradas de topo, nesta ordem: `Arquivo`, `Edição`, e o
menu `View` nativo do Electron (rótulo controlado pelo próprio Electron
via `role: "viewMenu"`).

### `Selecionar Unit` reabre a tela de seleção de Root Unit via um novo evento IPC main→renderer
Decisão confirmada pelo usuário real: `Selecionar Unit` reaproveita a tela
de busca/listagem de Root Unit já existente (`renderRootUnitSelection`,
`src/renderer/components/rootUnitSelection.js`), permitindo trocar a Root
Unit do Projeto já carregado sem reabrir o `.dpr` pelo menu `Arquivo`.

Mecanismo (mesma forma já usada por `app:project-loaded`, sem introduzir
nenhum armazenamento novo do lado do processo main — o processo main
continua sem guardar o Projeto aberto, exatamente como hoje):
- O `click` de `Selecionar Unit` (`src/main/menu.js`) dispara
  `mainWindow.webContents.send('app:show-root-unit-selection')`, sem
  payload — o processo main não sabe (e não precisa saber) qual Projeto
  está carregado; quem sabe é o renderer.
- `src/preload/api.js` ganha um novo listener, análogo a
  `onProjectLoaded`: `onShowRootUnitSelection(callback)`, escutando o
  canal `app:show-root-unit-selection`.
- `src/renderer/index.js` passa a guardar o último `{ projectUnits,
  projectDir }` recebido por `onProjectLoaded` em uma variável de módulo,
  e o listener de `onShowRootUnitSelection` chama
  `renderRootUnitSelection(projectUnits, projectDir)` de novo com esses
  mesmos valores — reaproveitando o componente e o fluxo
  `expandFromRootUnit` exatamente como já funcionam hoje, sem nenhuma
  mudança neles.
- **Caso nenhum Projeto tenha sido aberto ainda na sessão** (variável de
  módulo ainda vazia): o clique em `Selecionar Unit` não tem efeito
  visível nenhum (no-op). Alternativa considerada — desabilitar
  (`enabled: false`) o item de menu até um Projeto ser aberto — descartada
  porque exigiria o processo main saber se há um Projeto carregado
  (reconstruindo o menu a cada `app:project-loaded`, ou passando esse
  estado ao main), complexidade não pedida pelo usuário para um detalhe
  menor; o no-op simples é suficiente e mantém o processo main sem
  estado, como já é hoje.

Alternativa descartada: fazer o processo main manter uma cópia de
`{ projectUnits, projectDir }` (recebida ao lidar com `Abrir Projeto`) e
enviá-la de volta ao renderer junto com `app:show-root-unit-selection`.
Rejeitada porque duplicaria estado que já vive no renderer, sem nenhum
benefício — o renderer já é o único lugar que precisa desses dados para
desenhar a tela.

### `application-menu` como capability nova, separada de `root-unit-selection`
A estrutura do menu (`Arquivo`/`Edição`, os 4 itens e seus rótulos) é
tratada como uma capability própria (`application-menu`) em vez de ser
inteiramente absorvida por `root-unit-selection`, porque `Edição` não tem
nenhuma relação com o fluxo de abrir um Projeto — só o item `Abrir
Projeto` tem. A requirement de `root-unit-selection` que menciona o menu
é atualizada (delta `MODIFIED`) apenas para trocar os rótulos `File`/`Open
Project` por `Arquivo`/`Abrir Projeto`, sem duplicar a definição completa
do menu `Arquivo` — essa definição completa (incluindo `Sair`) vive em
`application-menu`.

## Risks / Trade-offs

- [Risco] `Selecionar Unit` clicado antes de qualquer Projeto ser aberto
  não tem nenhum feedback visual (é um no-op silencioso), o que pode
  confundir o usuário → Mitigação: aceito como trade-off deliberado (ver
  "Decisões" acima) para manter o processo main sem estado; pode ser
  revisitado em uma mudança futura caso vire um problema real de uso (ex.
  trocando o no-op por um `dialog.showMessageBox` avisando que nenhum
  Projeto está aberto, mesmo padrão já usado por `Selecionar Método`).
- [Risco] Rótulos em português (`Arquivo`, `Edição`, `Abrir Projeto`,
  `Sair`) divergem do padrão em inglês usado no resto do código-fonte
  (nomes de função, testes, etc.) → Mitigação: nenhuma ação necessária —
  o pedido do usuário é especificamente sobre o texto exibido ao usuário
  final, não sobre nomes internos; `performOpenProject` e demais
  identificadores continuam em inglês.

## Open Questions

Nenhuma. A única questão em aberto desta proposta — o comportamento de
`Selecionar Unit` — foi respondida pelo usuário real: reabrir a tela de
seleção de Root Unit já existente (ver "Decisões" acima, seção
"`Selecionar Unit` reabre a tela de seleção de Root Unit via um novo
evento IPC main→renderer"). Os quatro itens de menu desta proposta estão
totalmente especificados.
