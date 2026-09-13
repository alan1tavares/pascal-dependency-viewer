## 1. Controle de Uses Clause Scope na tela

- [x] 1.1 Adicionar em `index.html`, dentro de `#rootUnitSelection` e antes
      de `#rootUnitList`, dois `<input type="radio" name="usesScope">` (um
      com `value="interface"` e `checked`, outro com
      `value="interfaceAndImplementation"`), cada um com um `<label>`
      visível ("Interface" / "Interface + Implementation"). Verificar
      abrindo o app, clicando em "Open Project" com um `.dpr` de teste e
      conferindo visualmente que os dois radios aparecem entre o filtro e
      a lista, com "Interface" marcado por padrão.

## 2. Repasse do escopo escolhido para a extração do `uses`

- [x] 2.1 Em `selectRootUnit` (`index.html`), ler o valor do radio marcado
      (`document.querySelector('input[name="usesScope"]:checked').value`)
      e passá-lo como segundo argumento de `selectUsesFromSource(source,
      scope)`, substituindo a chamada atual de um argumento só. Verificar
      que `yarn start` continua abrindo normalmente e que escolher uma
      Root Unit com o radio em "Interface" (padrão) produz o mesmo grafo
      de antes desta change.
- [x] 2.2 Testar manualmente o caminho novo: usar (ou criar) um fixture
      `.pas` com `uses` diferentes em `interface` e `implementation` como
      Project Unit de um `.dpr` de teste; selecioná-lo como Root Unit com
      o radio em "Interface + Implementation" marcado e confirmar que o
      grafo renderizado inclui edges para as dependências de ambas as
      seções; repetir com "Interface" marcado e confirmar que só as
      dependências da `interface` aparecem.

## 3. Specs e regressão

- [x] 3.1 Rodar `yarn test` e confirmar que a suíte Jest existente
      continua passando sem alteração (nenhum módulo de `src/model` foi
      tocado por esta change).
- [x] 3.2 Rodar `openspec validate wire-uses-clause-scope-ui --strict` e
      confirmar que a change e a delta spec de `root-unit-selection`
      passam sem erros.
