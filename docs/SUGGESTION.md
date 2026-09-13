# Sugestão — tratamento de cancelamento do diálogo nativo

Origem: verificação da change `root-unit` (`/opsx:verify`, 2026-09-11).

## O problema

`handleOpenDialogSelectFile` (`src/components/Main/Menu/events/index.js`) e
`handleOpenDialogSelectProject`, adicionado pela change `root-unit`, não
tratam o caso do usuário cancelar o diálogo nativo de seleção de arquivo.

Quando o diálogo é cancelado, `dialog.showOpenDialog` retorna
`filePaths: []`, então `filePath.filePaths[0]` é `undefined`. Em seguida,
`fs.readFileSync(undefined, 'utf-8')` lança uma exceção não tratada.

Isso não é uma regressão introduzida pela change `root-unit` —
`handleOpenDialogSelectProject` só replica o padrão que
`handleOpenDialogSelectFile` já tinha. Mas agora existem dois pontos com o
mesmo comportamento em vez de um.

## Sugestão

Se algum dia decidirem endurecer esse ponto, tratar os dois fluxos juntos
(não só um): checar se `filePaths` veio vazio antes de prosseguir com
`fs.readFileSync`, e simplesmente abortar a ação (sem gravar nada no
`electron-store` nem chamar `reloadMainWindow()`) quando o usuário cancelar
o diálogo.

Não é bloqueante — é só um lembrete para quando o projeto decidir investir
em tratamento de erro nos handlers de menu.

# Sugestão — wiring de `index.html` sem teste automatizado

Origem: verificação da change `external-unit` (`/opsx:verify`, 2026-09-11).

## O problema

A ligação `selectRootUnit` → `projectUnits` → `mountDependenceGraphStructure`
e a configuração `options.groups` do `vis-network` (ambas em `index.html`),
que fazem a distinção visual entre Project Unit e External Unit, só foram
verificadas manualmente (screenshot via driver Playwright/Electron nesta
sessão) — não há teste automatizado cobrindo esse wiring.

Isso é consistente com o resto do projeto: a camada de renderer/Electron
não tem testes Jest, só o `src/model` é testado (per `CLAUDE.md`). Não é
uma lacuna introduzida por esta change especificamente.

## Sugestão

Se algum dia decidirem cobrir a camada de renderer com testes (ex.:
Playwright/Electron), incluir um caso que abra um `.dpr` de teste, escolha
uma Root Unit com dependências dentro e fora da lista de Project Units, e
confirme programaticamente (via `store.get('nodes')` ou inspeção do DOM)
que os nós recebem o `group` correto e que o `Network` foi criado com as
opções de estilo esperadas.

Não é bloqueante — é só um lembrete para quando o projeto decidir investir
em testes da camada de renderer.

# Sugestão — cenários de Uses Clause Scope sem teste automatizado

Origem: verificação da change `wire-uses-clause-scope-ui` (`/opsx:verify`,
2026-09-13).

## O problema

Os dois cenários novos do requirement modificado em
`specs/root-unit-selection/spec.md` — Root Unit escolhida com o controle
de Uses Clause Scope em `interface` e em `interface + implementation` —
foram confirmados só manualmente (`selectRootUnit`, `index.html`). Não há
teste Jest ou E2E cobrindo esse wiring.

Isso é consistente com a mesma lacuna já registrada acima para o wiring de
External Unit: a camada de renderer não tem testes automatizados, só
`src/model` é testado (per `CLAUDE.md`). Não é uma lacuna introduzida
especificamente por esta change.

## Sugestão

Se algum dia decidirem cobrir a camada de renderer com testes (mesmo
esforço sugerido na entrada anterior), incluir um caso que abra um `.dpr`
de teste cuja Root Unit tenha `uses` divergente entre `interface` e
`implementation`, alterne o radio de escopo entre os dois valores e
confirme programaticamente (via `store.get('edges')`) que o grafo muda de
acordo com o escopo selecionado.

Não é bloqueante — é só um lembrete para quando o projeto decidir investir
em testes da camada de renderer.

# Sugestão — controle de Uses Clause Scope sem rótulo/agrupamento visual

Origem: verificação da change `wire-uses-clause-scope-ui` (`/opsx:verify`,
2026-09-13).

## O problema

Os dois radios de Uses Clause Scope (`index.html`, dentro de
`#usesScopeControl`) têm labels próprios ("Interface" / "Interface +
Implementation"), mas não há um texto agrupando visualmente as duas
opções (ex.: "Uses Clause Scope:"). Não viola nenhum requirement — a spec
não define texto de UI — é só uma questão de clareza visual.

## Sugestão

Se a tela de busca/listagem ganhar mais controles no futuro, envolver o
`<div id="usesScopeControl">` num `<fieldset>` com `<legend>Uses Clause
Scope</legend>` para deixar explícito o que aquele grupo de radios
representa.

Não é bloqueante — é só uma sugestão de polimento visual.
