## 1. Markup do painel

- [x] 1.1 Adicionar o terceiro `<label><input type="checkbox" id="viewFilterExternal" /> Unidades Externas</label>` em `#viewFilterPanel` (`index.html`), sem o atributo `checked` (estado inicial desmarcado); verificar abrindo `index.html`/rodando `npm start` que o painel mostra os três checkboxes, com "Unidades Externas" desmarcado.

## 2. Lógica de filtragem em `graphView.js`

- [x] 2.1 Em `setUpViewFilter`, capturar `viewFilterExternal` via `getElementById` e montar um `nodeGroupById` (`Map`) a partir de `nodesData` (`id -> group`), para consultar o grupo do node de destino de cada aresta; verificar que o mapa contém uma entrada `'externalUnit'` para cada node desse grupo.
- [x] 2.2 Estender a checagem de visibilidade de arestas para exigir também que, quando o node de destino é `externalUnit`, `viewFilterExternal.checked` esteja marcado (E lógico com o resultado atual de `isOriginVisible`); verificar com o cenário "Desmarcar Unidades Externas oculta as External Units" do spec `graph-view-filter`.
- [x] 2.3 Em `handleCheckboxChange` (ou equivalente), garantir que a trava de "pelo menos um marcado" continue avaliando somente `interfaceCheckbox`/`implementationCheckbox`, e que `viewFilterExternal` dispare `applyViewFilter()` sem passar por essa trava; verificar manualmente que desmarcar "Unidades Externas" nunca é revertido, mesmo com os outros dois desmarcados.
- [x] 2.4 Registrar `viewFilterExternal.onchange` chamando `applyViewFilter()` (mesmo padrão dos outros dois checkboxes).

## 3. Verificação end-to-end

- [x] 3.1 Rodar `npm start`, abrir um `.dpr` de exemplo, escolher uma Root Unit com pelo menos uma External Unit nas dependências, e confirmar: grafo abre já sem as External Units; marcar "Unidades Externas" reexibe essas units e arestas; desmarcar de novo as oculta; alternar Interface/Implementação continua funcionando como antes e combinando corretamente com o novo filtro (cenário "Unidades Externas marcada não sobrepõe o filtro de origem").
- [x] 3.2 Rodar `npm test` e confirmar que a suíte de domínio (`src/domain/**`) continua passando sem alterações, já que nenhum arquivo de domínio foi tocado.
