## 1. CSS de layout em tela cheia

- [x] 1.1 Adicionar um bloco `<style>` em `index.html` com
      `html, body { height: 100%; margin: 0; }` e regras de
      `width: 100%; height: 100%; box-sizing: border-box;` para
      `#mynetwork` e `#rootUnitSelection`, e verificar visualmente (via
      `npm start`) que ambos os elementos ocupam toda a janela em modo dev.
      Verificado de forma automatizada (ver nota de metodologia abaixo):
      `#mynetwork` passou de 154px de altura (de 573px disponíveis) sem o
      CSS para 573px/573px com o CSS aplicado, no tamanho padrão da janela.

## 2. Verificação manual do comportamento em tela cheia

- [x] 2.1 Rodar `npm start`, abrir um `.pas` de teste (ex.:
      `src/test/souceUsesInInterface.pas`) e confirmar que o grafo
      preenche a janela no tamanho padrão (800x600) logo após ser aberto.
      Confirmado: `#mynetwork` = 800x573 (igual a `window.innerWidth`/
      `innerHeight`) após o grafo ser carregado via `app:graph-loaded`.
- [x] 2.2 Com o grafo já renderizado, maximizar a janela e confirmar que o
      canvas do `vis-network` se redimensiona automaticamente para
      preencher a nova área, sem precisar reabrir o arquivo.
      Confirmado: ao redimensionar a janela para 1600x1000 (área útil
      1600x973) com o grafo já renderizado, `#mynetwork` acompanhou para
      1600x973 automaticamente, sem reabrir o arquivo.
- [x] 2.3 Repetir a verificação do passo 2.2 para a tela de seleção de Root
      Unit: abrir um `.dpr` de teste (`src/test/sourceDprWithProjectUnits.dpr`),
      maximizar a janela antes de escolher a Root Unit e confirmar que a
      lista/filtro preenche a janela.
      Confirmado via medição de `#rootUnitSelection`: preencheu a largura
      da janela (menos a largura da scrollbar) tanto no tamanho padrão
      quanto após o redimensionamento para 1600x1000 — mesma regra de CSS
      de `#mynetwork`, sem tratamento especial por conteúdo.
- [x] 2.4 Se o redimensionamento automático do passo 2.2 não ocorrer (ex.:
      canvas não acompanha o novo tamanho da janela ao maximizar via SO),
      implementar o fallback descrito em `design.md` - Decisions: um
      listener de `window.resize` em `src/renderer.js` chamando
      `network.setSize('100%', '100%')` seguido de `network.redraw()` - e
      repetir a verificação.
      Não necessário: o passo 2.2 confirmou que o `vis-network` já
      acompanha o redimensionamento da janela automaticamente assim que a
      cadeia de altura 100% existe; nenhum listener adicional foi
      implementado em `src/renderer.js`.

## 3. Regressão

- [x] 3.1 Rodar `npm test` e confirmar que a suíte Jest existente
      (`src/test/**`) continua passando sem alterações, já que a mudança é
      restrita a CSS/renderer e não toca `src/model/**`.
      Confirmado: 5 suites / 22 testes passando.

---

**Nota de metodologia (tarefas 1.1, 2.1-2.4):** este ambiente é um sandbox
Linux headless sem interação manual com GUI. A verificação foi feita
executando o app real via `xvfb-run` (Electron + Vite reais, sem mocks),
com uma instrumentação temporária em `src/main.js` que disparava
`app:graph-loaded` com um grafo real (evitando apenas o diálogo nativo de
arquivo) e media `getBoundingClientRect()` de `#mynetwork`/
`#rootUnitSelection` antes e depois de um `setBounds` na janela. Essa
instrumentação foi revertida após a verificação — `src/main.js` não tem
nenhuma alteração permanente. Um teste adicional, revertendo
temporariamente o CSS via `git stash`, reproduziu o bug original (grafo
ocupando 154/573px de altura) e confirmou que o fix o resolve.
