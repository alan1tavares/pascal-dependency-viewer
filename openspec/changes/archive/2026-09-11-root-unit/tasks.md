## 1. Main process — abrir Projeto (`.dpr`)

- [x] 1.1 Adicionar `handleOpenDialogSelectProject` em
      `src/components/Main/Menu/events`, mesmo padrão de
      `handleOpenDialogSelectFile`, com filtro de extensão `dpr`
- [x] 1.2 Adicionar item "Open Project" no submenu `File` de
      `src/components/Main/Menu/index.js`
- [x] 1.3 No handler do novo item: ler o `.dpr` com `fs.readFileSync`,
      parsear com `parseDprSource` (já existente), e derivar o diretório do
      `.dpr` (`path.dirname`) para resolver os paths relativos das Project
      Units depois

## 2. Estado compartilhado (`electron-store`)

- [x] 2.1 Ao abrir um Projeto: `store.delete('nodes')` +
      `store.delete('edges')`, seguido de
      `store.set({ view: 'rootUnitSelection', projectUnits, projectDir })`,
      depois `reloadMainWindow()` (NÃO usar `store.clear()` — apagaria
      `mainWindowId`, que `reloadMainWindow()` precisa)
- [x] 2.2 Atualizar o handler existente de `File > Open` (`.pas` avulso)
      para deletar `projectUnits`/`projectDir` antes de gravar
      `{ view: 'graph', nodes, edges }`, garantindo que nenhuma chave de um
      fluxo anterior sobreviva à troca de modo

## 3. Renderer — tela de busca/listagem de Root Unit

- [x] 3.1 Em `index.html`, ramificar a renderização inicial conforme
      `store.get('view')`: `'graph'` desenha o `vis-network` como hoje;
      `'rootUnitSelection'` monta a nova tela
- [x] 3.2 Renderizar a lista de `projectUnits` (nome + caminho) lida do
      store
- [x] 3.3 Adicionar campo de texto que filtra a lista em memória por
      substring case-insensitive no `unitName`

## 4. Renderer — seleção da Root Unit e montagem do grafo

- [x] 4.1 Ao clicar numa Project Unit da lista: resolver o path do `.pas`
      com `path.resolve(projectDir, projectUnit.path)` e ler o arquivo com
      `fs.readFileSync`
- [x] 4.2 Chamar `getUnitName` + `selectUsesFromSource` (de
      `parsePascalSource`) e `mountDependenceGraphStructure` diretamente no
      renderer (via `require`, sem IPC) para montar `{ nodes, edges }`
- [x] 4.3 Persistir o resultado no `electron-store` (deletar
      `projectUnits`/`projectDir` + `store.set({ view: 'graph', nodes,
      edges })`) para manter o estado consistente em caso de reload manual
      da janela
- [x] 4.4 Substituir a tela de busca/listagem pelo `vis-network` renderizado
      com o grafo recém-montado, sem precisar recarregar a janela

## 5. Verificação manual

- [x] 5.1 Rodar `yarn start`, abrir um `.dpr` de teste, confirmar que a
      lista de Project Units aparece e o filtro de texto funciona
- [x] 5.2 Escolher uma Root Unit e confirmar que o grafo de 1 nível
      renderiza corretamente (mesmo resultado visual do fluxo `File > Open`
      para o mesmo `.pas`)
- [x] 5.3 Confirmar que abrir um `.pas` avulso depois de ter aberto um
      Projeto (e vice-versa) não deixa estado do fluxo anterior vazando na
      tela
