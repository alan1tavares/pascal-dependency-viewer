## Context

`selectUsesFromSource(source)` hoje é uma função de uma linha de lógica:
`/uses\s*(\w*\.\w*|\w*|\s|\,)*;/gi` casado contra o arquivo inteiro,
pegando `[0]`. Isso funciona por acidente para todo fixture existente
porque nenhum deles tem `uses` na `implementation` — o primeiro match
sempre é o da `interface`. Não há nenhuma noção de "seção" no código hoje.

Todos os call sites atuais (`Menu/index.js`, `index.html`,
`mountDependenceGraphStructure` indiretamente via
`expandDependencyGraph`) chamam `selectUsesFromSource(source)` com um
argumento só, e nenhuma tela do app tem UI para escolher escopo — a
`root-unit-selection` (única tela de "busca/listagem" que existe) monta o
grafo de 1 nível direto no clique, sem nenhuma etapa intermediária de
configuração.

## Goals / Non-Goals

**Goals:**
- Tornar `selectUsesFromSource` ciente das seções `interface` e
  `implementation`, em vez de "primeiro match no arquivo inteiro".
- Suportar os dois escopos que o `CONTEXT.md` define, com a mesma
  nomenclatura (`interface`, `interfaceAndImplementation`).
- Preservar 100% do comportamento atual quando nenhum escopo é passado
  (default `interface`) — nenhum call site existente muda.
- Lidar sem exceção com uma seção sem `uses` (a `implementation` quase
  sempre não tem), já que isso passa a ser um caminho normal ao combinar
  as duas seções.

**Non-Goals:**
- Adicionar UI de seleção de escopo na tela de busca/listagem — não existe
  hoje um passo "configurar antes de gerar" em nenhum fluxo; criar um
  exigiria decisões de UI (onde colocar o controle, como persistir a
  escolha "por geração") que são ortogonais ao parsing e melhor tratadas
  isoladamente numa change futura, quando o fluxo de expansão também for
  ligado à UI.
- Passar o escopo adiante para `mountDependenceGraphStructure` ou
  `expandDependencyGraph` — nenhuma das duas assinaturas muda aqui.
- Resolver o caso de um arquivo sem `unit`/`uses` nenhum
  (`getUnitName`/`.match(...)[0]` já lança hoje, documentado como
  limitação conhecida no `CLAUDE.md`) — fora de escopo, não é o problema
  que este change resolve.
- Detectar `uses` dentro de blocos aninhados (ex.: dentro de uma função
  local com sua própria seção `uses` — inválido em Object Pascal fora do
  topo de `interface`/`implementation`) — não é uma construção real da
  linguagem, não precisa de tratamento.

## Decisions

**1. Seções são delimitadas por regex de palavra-limite em
`interface`/`implementation`, não por um parser de Pascal completo.**
`source.split(/\binterface\b/i)` e depois `\bimplementation\b` dividem o
texto em até três pedaços: antes de `interface` (ignorado — é só o
cabeçalho `unit X;`), a seção `interface`, e a seção `implementation`. Um
`.pas` sem a palavra `implementation` (incomum, mas possível em teoria)
deixa a seção `implementation` vazia. Isso é consistente com o resto do
parsing do projeto, que já é regex-based e documentado como tal no
`CLAUDE.md` — não introduz uma técnica nova, só aplica o mesmo nível de
"bom o suficiente" a um problema novo (delimitar seção em vez de delimitar
cláusula).
_Alternativa considerada_: escrever/importar um parser de Pascal real para
delimitar seções com precisão. Rejeitada por desproporcional ao problema —
nenhum outro parsing do projeto faz isso, e o regex de word-boundary já
resolve o caso real (arquivos `.pas` bem formados, que é a única entrada
que o app suporta hoje).

**2. Extração por seção reaproveita o mesmo regex de cláusula `uses` já
existente, só que aplicado a um texto menor (a seção) em vez do arquivo
inteiro, e retorna lista vazia (não lança) quando não há match.**
Isso é o que possibilita o merge no escopo `interfaceAndImplementation`
sem tratamento especial de erro no caller: as duas extrações sempre
devolvem um array, nunca lançam por "esta seção não tem uses".

**3. Escopo é uma string simples com dois valores nomeados, exportados
como constante (`USES_CLAUSE_SCOPE.INTERFACE` /
`USES_CLAUSE_SCOPE.INTERFACE_AND_IMPLEMENTATION`), não um enum de
biblioteca externa nem um boolean.**
Usa a linguagem exata do `CONTEXT.md` (evita um segundo vocabulário tipo
`includeImplementation: boolean`), e como é só um `default = INTERFACE`,
todo call site existente continua funcionando sem tocar em nada.
_Alternativa considerada_: parâmetro boolean
`includeImplementationUses`. Rejeitada porque diverge do nome que o
domínio já usa (`CONTEXT.md`) e não cresce bem se um dia existir um
terceiro escopo.

**4. Merge de `interfaceAndImplementation` é `interface` primeiro, depois
`implementation`, deduplicado case-insensitive por nome, mantendo a
primeira ocorrência.**
Segue a mesma convenção de case-insensitividade que
`classifyExternalUnits` e `mountDependenceGraphStructure` já usam para
comparar nomes de unit — nenhuma convenção nova.

## Risks / Trade-offs

- [Regex de word-boundary pode errar em source com comentários ou strings
  contendo literalmente a palavra `interface`/`implementation`] → Mesmo
  nível de risco que o parsing atual já aceita (o regex de `uses` também
  não entende comentários/strings); não piora o que já existe, e nenhum
  fixture real do projeto tem esse caso.
- [`interfaceAndImplementation` pode reintroduzir a mesma unit duas vezes
  se ela aparecer em ambas as seções] → Mitigado pela dedup
  case-insensitive na decisão 4.

## Open Questions

- Nenhuma bloqueante. Quando/como expor o escopo na UI fica em aberto para
  a change que finalmente ligar `expandDependencyGraph` à tela de
  busca/listagem — só faz sentido decidir isso junto da UI real que vai
  hospedar o controle.
