## Context

Hoje o app tem um único fluxo, todo orquestrado em
`src/components/Main/Menu/index.js`: o main process lê um `.pas`, faz o
parsing, monta `{ nodes, edges }`, grava tudo em `electron-store` e recarrega
a janela; `index.html` só lê `nodes`/`edges` do store no load e desenha o
grafo. Não existe canal de IPC (`ipcMain`/`ipcRenderer`) no projeto — toda a
comunicação main → renderer passa pelo `electron-store` como blob
compartilhado, e é unidirecional (o renderer nunca "responde" nada ao main).

Este change introduz um segundo fluxo (abrir um `.dpr`, listar Project
Units, escolher a Root Unit) que precisa de uma interação nova: o usuário
seleciona algo *dentro do renderer*, e essa escolha precisa disparar leitura
de arquivo + parsing + montagem do grafo. A decisão central deste design é
onde essa lógica roda.

## Goals / Non-Goals

**Goals:**
- Abrir um `.dpr`, listar suas Project Units numa tela de busca/listagem no
  renderer, e ao escolher uma, renderizar o grafo de 1 nível dessa unidade
  (mesmo resultado visual que `File > Open` já produz para um `.pas`
  avulso).
- Reaproveitar `parseDprSource`, `parsePascalSource` e
  `mountDependenceGraphStructure` sem alterá-los.
- Manter a convenção arquitetural existente (`electron-store` como estado
  compartilhado, main process fino) em vez de introduzir infraestrutura
  nova.

**Non-Goals:**
- Expansão transitiva do grafo (Dependency Graph com múltiplos níveis,
  DAG deduplicado) — change futuro.
- Distinção visual de External Unit — change futuro.
- Uses Clause Scope (`interface` vs `interface`+`implementation`) — change
  futuro.
- Validação de `.dpr` malformado ou Project Units cujo arquivo `.pas` não
  existe no disco — fora de escopo, mesmo padrão de tolerância a erro (ou
  falta dela) que o resto do parsing já tem hoje.

## Decisions

**1. A seleção da Root Unit é resolvida inteiramente no renderer, sem IPC
novo.**
`nodeIntegration: true` já permite ao `index.html` fazer `require(...)`
diretamente — hoje já usa isso para `vis-network`, `vis-data` e
`electron-store`. Como `parsePascalSource` e `mountDependenceGraphStructure`
são puros (sem dependência de Electron), o renderer pode `require`-los
também, e usar `fs`/`path` (Node, disponível pelo mesmo nodeIntegration)
para ler o `.pas` da unidade escolhida direto no clique do usuário.
_Alternativa considerada_: criar um canal `ipcRenderer.invoke` para o main
process reconstruir o grafo e regravar o store. Rejeitada por introduzir o
primeiro uso de IPC do projeto só para uma interação que o padrão atual
(nodeIntegration + lógica pura no `src/model`) já resolve sem nova
infraestrutura.

**2. O main process só faz o que só o main process pode fazer: abrir o
diálogo nativo do `.dpr` e ler seu conteúdo.**
Novo handler em `src/components/Main/Menu/events` (mesmo padrão de
`handleOpenDialogSelectFile`, mas com filtro de extensão `dpr`). Depois de
`parseDprSource`, o main grava no `electron-store` a lista de Project Units
e o diretório do `.dpr` (para resolver os paths relativos), e recarrega a
janela — mesma mecânica que o fluxo de `.pas` já usa.

**3. `electron-store` precisa de um campo explícito para o renderer saber
qual UI desenhar.**
Hoje o store só guarda `{ nodes, edges }`; este change adiciona um segundo
formato de estado (`{ projectUnits, projectDir }`). Em vez de o renderer
inferir o modo pela presença de uma chave (frágil: uma chave de um fluxo
anterior pode sobrar), o main process grava um campo `view` (`'graph'` ou
`'rootUnitSelection'`) e, antes de gravar o novo estado, deleta
especificamente as chaves do outro fluxo (`store.delete('projectUnits')` +
`store.delete('projectDir')`, ou `store.delete('nodes')` +
`store.delete('edges')`), para garantir que nenhuma chave de um fluxo
anterior sobreviva à troca de modo. `index.html` lê `view` no load e decide
qual UI montar.
_Correção feita durante a implementação_: a ideia original era
`store.clear()` antes de cada gravação, mas o store também guarda
`mainWindowId` (usado por `reloadMainWindow()` logo em seguida) — um
`clear()` apagaria essa chave e quebraria o reload. Por isso a limpeza é
seletiva, só nas chaves do fluxo que está sendo substituído.

**4. Ao escolher a Root Unit, o renderer também persiste o grafo resultante
no `electron-store` (deletando `projectUnits`/`projectDir` e gravando
`view: 'graph'`, `nodes`, `edges`), mesmo não precisando recarregar a janela
para mostrar o resultado.**
Isso evita estado inconsistente se a janela for recarregada manualmente
depois da seleção — sem isso, um reload devolveria a tela de busca/listagem
em vez do grafo já montado.

**5. UI de busca/listagem é HTML/JS vanilla, sem nova dependência.**
A lista de Project Units de um `.dpr` real é pequena (dezenas a poucas
centenas de itens) — um filtro case-insensitive por substring no
`unitName`, em memória, é suficiente. Segue o estilo do `index.html` atual
(script inline, sem framework).

**6. Novo item de menu "Open Project" ao lado do "Open" existente**, dentro
do mesmo submenu `File`, com filtro de extensão `dpr` em vez de `pas`.

## Risks / Trade-offs

- [Lógica de negócio duplicada entre main e renderer — hoje o fluxo de
  `.pas` avulso constrói o grafo no main, o novo fluxo de Root Unit constrói
  no renderer] → Mitigado por reaproveitar exatamente as mesmas funções
  puras de `src/model` nos dois lugares; a diferença é só onde elas são
  chamadas, não o que fazem.
- [`nodeIntegration: true` expõe `fs`/`require` completos ao renderer] → Já
  é o modelo de segurança aceito neste app (documentado em `CLAUDE.md`);
  este change não piora essa superfície, só reaproveita o que já existe.
- [Paths de Project Unit no `.dpr` podem usar `\` (Windows) mesmo rodando
  em outro SO] → Fora de escopo resolver aqui; mesmo comportamento que
  `parseDprSource` já tem hoje (retorna o path cru, sem normalizar).

## Open Questions

- Nenhuma bloqueante para implementar este change; a normalização de path
  entre SOs fica como possível follow-up, não decisão pendente aqui.
