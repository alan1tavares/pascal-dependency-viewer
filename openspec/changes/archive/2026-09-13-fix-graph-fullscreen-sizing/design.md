## Context

O app nunca teve uma folha de estilo: `index.html` não define `<style>` nem
`<link rel="stylesheet">`, tanto antes quanto depois da migração para
Electron Forge + Vite (confirmado comparando o `index.html` do commit
anterior à migração com o atual). Sem CSS, `html` e `body` ficam com altura
`auto` (regida pela folha de estilo padrão do navegador), então uma altura
percentual (`100%`) no container `#mynetwork` não tem base para resolver —
o container acaba com a altura do seu próprio conteúdo em vez da altura da
janela. O `vis-network` dimensiona seu canvas a partir do tamanho do
container no momento da criação da `Network`; se o container não tem uma
altura definida, o canvas nasce pequeno e não há nada reagindo a mudanças
de tamanho depois disso.

Ver `proposal.md` - Why para a motivação completa.

## Goals / Non-Goals

**Goals:**
- Estabelecer uma cadeia de altura/largura 100% de `html` → `body` →
  container ativo (`#mynetwork` ou `#rootUnitSelection`), válida para
  qualquer tamanho de janela.
- Fazer o canvas do `vis-network` acompanhar o tamanho do container quando
  a janela é redimensionada (maximizar, tela cheia, restaurar).

**Non-Goals:**
- Não introduzir um framework de CSS ou build step adicional (ex.:
  PostCSS, Tailwind) — o projeto usa Vite puro e o ajuste cabe em CSS
  simples.
- Não alterar a estrutura de dados do grafo (`{ nodes, edges }`) nem a
  lógica de `src/model/**`.
- Não mudar o comportamento de scroll/zoom/pan já oferecido pelo
  `vis-network`.

## Decisions

**CSS inline em `index.html` via `<style>`, em vez de um arquivo `.css`
separado.** O projeto é pequeno (uma única tela por vez, sem outras regras
de estilo) e não há nenhum arquivo CSS hoje. Um bloco `<style>` mantém o
ajuste visível junto da estrutura HTML que ele afeta, sem exigir configurar
um novo import/estilo no `vite.renderer.config.mjs`. Se o projeto crescer em
complexidade visual, extrair para `src/index.css` fica trivial depois.

**Regra de altura**: `html, body { height: 100%; margin: 0; }` e
`#mynetwork, #rootUnitSelection { width: 100%; height: 100%; }`, com
`box-sizing: border-box` para evitar que padding futuro estoure o
container. Isso resolve a cadeia de altura sem depender de `100vh` (que tem
ressalvas conhecidas em alguns webviews com barras de UI dinâmicas — não é
o caso do Electron, mas `height: 100%` é a forma mais direta já que não há
nenhum outro elemento de UI fixo, como uma toolbar, competindo pelo espaço).

**Redimensionamento dinâmico**: o `vis-network` já observa `window.resize`
por padrão para reajustar o canvas ao tamanho do container (não há opção
`autoResize: false` configurada em `src/renderer.js`). Com a cadeia de
altura 100% em vigor, o container passa a mudar de tamanho junto da janela,
e o listener padrão do `vis-network` cuida do resto — não é necessário
código adicional em `renderGraph`. Caso a verificação manual (passo de
`tasks.md`) mostre que o redimensionamento não acompanha a janela em algum
caso (ex.: maximizar via atalho do SO sem disparar `resize`), o fallback é
chamar `network.setSize('100%', '100%')` + `network.redraw()` explicitamente
num listener de `window.resize` em `src/renderer.js`.

## Risks / Trade-offs

- [Definir `height: 100%` no `body` pode afetar futuras telas/elementos que
  assumam altura de conteúdo (`auto`)] → Como hoje só existem as duas telas
  já cobertas pelos requisitos (`#mynetwork` e `#rootUnitSelection`), e
  ambas devem preencher a janela, o risco é baixo; qualquer tela nova
  precisará considerar essa mesma regra.
- [Confiar no resize automático do `vis-network` em vez de escrever um
  listener próprio] → Mitigado pela verificação manual descrita em
  `tasks.md`; se o comportamento automático não for suficiente, o fallback
  acima cobre o caso.
