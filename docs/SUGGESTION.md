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
não tem testes Jest, só o `src/domain` é testado (per `CLAUDE.md`). Não é
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

# Sugestão — cenários de `welcome-screen` sem teste automatizado

Origem: verificação da change `ocultar-boas-vindas-apos-grafo`
(`/opsx:verify`, 2026-10-11).

## O problema

Nenhum dos 4 cenários da spec `welcome-screen`
(`openspec/changes/ocultar-boas-vindas-apos-grafo/specs/welcome-screen/spec.md`)
— "App aberto sem Projeto", "Projeto carregado sem Root Unit", "Grafo
renderizado ao escolher Root Unit" e "Novo Projeto após o primeiro grafo" —
tem teste automatizado cobrindo o comportamento de `graphRenderedStore`
(`src/renderer/stores/graph.js`) e `Welcome.svelte`. A verificação foi só
manual (`npm start`) e por leitura de código.

Isso é consistente com o resto do projeto: `vitest.config.mjs` ainda
restringe `include` a `src/domain/test/**`, e `@testing-library/svelte`
(já previsto no `CLAUDE.md` para testar componentes Svelte) não está
instalado. Não é uma lacuna introduzida especificamente por esta change.

## Sugestão

Quando a infraestrutura de teste de componentes Svelte for configurada,
adicionar testes para `Welcome.svelte` cobrindo os 4 cenários acima —
em particular, que o componente deixa de renderizar qualquer conteúdo
depois que `graphRenderedStore` vai para `true`, e que isso permanece
assim mesmo após um novo Projeto ser carregado.

Não é bloqueante — é só um lembrete para quando o projeto decidir investir
em testes da camada de renderer.
