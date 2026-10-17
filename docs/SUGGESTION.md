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

# Sugestão — evoluções futuras do recurso de abas

Origem: sessão de design do recurso de Tabs (`/grill-with-docs`, 2026-10-15).

## O problema

A primeira versão das Tabs (Welcome Tab + Graph Tabs, no estilo do VSCode)
deixou de fora, de propósito, vários comportamentos que o VSCode tem:

- arrastar abas para reordenar;
- abas "preview" (em itálico, substituídas pela próxima aberta);
- fixar (pin) abas;
- dividir a área principal em mais de um painel (split editor);
- menu de contexto da aba (fechar outras, fechar à direita, fechar todas);
- restaurar as abas abertas ao reiniciar o app.

## Sugestão

Tratar cada item como uma change separada, se e quando houver demanda. A
restauração entre sessões é a mais delicada: exige persistir as Root Units
abertas por Project (hoje só os Recent Projects são persistidos) e decidir o
que fazer quando uma Root Unit deixou de existir no `.dpr`.

Não é bloqueante — é só um registro do escopo deixado de fora.

# Sugestão — física da vis-network às vezes não para

Origem: implementação da change `abas-estilo-vscode` (`/opsx:apply`,
2026-10-17).

## O problema

Em parte das execuções do e2e (cerca de metade, rodando 4 workers em
paralelo), o canvas do grafo continua mudando por mais de 20 s depois de a
Root Unit ser escolhida: a simulação de física não chega a ser desligada. O
`NetworkRenderer` só desliga a física no primeiro
`stabilizationIterationsDone` (`networkRenderer.js`, `initialize()`), e esse
evento parece às vezes não vir depois que os dados são adicionados. Acontece
também na `main`, com um único grafo, então não foi introduzido pelas Tabs.

Efeito para o usuário: os nós podem continuar se mexendo sozinhos, e o
teste `voltar a uma Graph Tab mantém zoom e posições do grafo`
(`e2e/tabs.spec.ts`) se pula nesses casos, porque não há grafo parado para
comparar.

## Sugestão

Investigar a ordem entre `new Network(...)` com dados vazios, o
`once('stabilizationIterationsDone')` e o `renderGraph` que adiciona os
dados — por exemplo, chamar `network.stabilize()` explicitamente depois de
adicionar os dados, ou desligar a física também em `stabilized`.

Depois de corrigir, tirar o `test.skip(!stable, ...)` do teste `voltar a uma
Graph Tab mantém zoom e posições do grafo` (`e2e/tabs.spec.ts`), para que o
requisito "Graph Tab preserva seu estado de exibição" (capability `tabs`)
volte a ser verificado em toda execução, e não só quando a física para.

Não é bloqueante.

# Sugestão — testes de `src/main/test/` e de componentes Svelte não rodam

Origem: implementação da change `abas-estilo-vscode` (`/opsx:apply`,
2026-10-17).

## O problema

O `npm test` (`vitest run`) só executa `src/domain/test/**`, por causa do
`include` do `vitest.config.mjs`. Ficam de fora, sem rodar nunca:

- `src/main/test/*.test.js` (`menu`, `commands`, `project`, `keySequence`,
  `recentProjects`): foram escritos para o Jest — importam `jest` de
  `@jest/globals` e usam `jest.unstable_mockModule` —, mas o Jest não está
  instalado no projeto. Mesmo incluídos no Vitest, falhariam no import.
- `src/renderer/components/GraphView.test.js`: usa `@testing-library/svelte`
  e precisa de ambiente DOM (`jsdom`/`happy-dom`), enquanto o Vitest roda com
  `environment: 'node'`.

Nesta change, `menu.test.js` e `commands.test.js` foram atualizados e
rodados uma vez com uma configuração temporária do Vitest que mapeava
`@jest/globals` para um shim (`jest.fn` → `vi.fn`,
`jest.unstable_mockModule` → `vi.doMock`); os 23 testes passaram. Mas a
configuração não ficou no projeto, então uma regressão nesses arquivos
continua passando despercebida.

## Sugestão

- Migrar `src/main/test/` para a API do Vitest (`vi.fn`, `vi.doMock` antes
  do `await import(...)`) e acrescentar `src/main/test/**/*.test.js` ao
  `include`.
- Para os componentes Svelte, instalar um ambiente DOM e usar
  `environmentMatchGlobs` (ou um `projects` separado) para rodar
  `src/renderer/**/*.test.js` com ele, incluindo esses arquivos no `include`.
- Conferir que o `npm test` passa a listar os novos arquivos.

Não é bloqueante, mas hoje esses testes dão uma falsa sensação de cobertura.
