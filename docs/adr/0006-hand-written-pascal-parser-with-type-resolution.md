# O Caller Graph usa um parser Pascal escrito à mão, com resolução de tipos

Para montar o Caller Graph é preciso saber, para cada chamada `x.Salvar`,
qual Method ela realmente invoca — o que depende do tipo de `x`. Decidimos
escrever em `src/domain/` um parser recursivo-descendente para Delphi, em
JavaScript puro, acompanhado de um resolvedor de símbolos (variáveis locais,
parâmetros, fields, properties, `Self`, `inherited`, referências de classe,
encadeamentos de retorno, `with`, herança, interfaces e generics). Uma chamada
cujo receptor não pode ter o tipo resolvido não gera aresta: preferimos perder
um Caller a mostrar um que não existe.

O parsing por regex do restante do app (`unit`/`uses`, Dependency Graph)
continua como está; migrá-lo para o parser novo é uma mudança separada.

## Opções consideradas

- **Casar chamadas pelo nome (regex)**: barato e coerente com o resto do app,
  mas gera falsos positivos sempre que classes diferentes têm métodos de mesmo
  nome — comum em código Delphi (`Salvar`, `Executar`, `Create`).
- **`tree-sitter-pascal` + `web-tree-sitter`**: dá a árvore sintática pronta,
  mas a gramática é imatura (v0.0.1, sem atualização desde 2023) e ainda
  exigiria escrever toda a resolução de tipos; uma falha da gramática num
  construto Delphi ficaria fora do nosso controle.
- **Parser escrito à mão** (escolhida): mais trabalho inicial, mas controle
  total sobre os construtos suportados, sem dependência nativa/WASM, e
  testável como o resto do domínio.

## Consequências

- Diretivas `{$IFDEF}` são avaliadas com um conjunto fixo de símbolos padrão
  do Delphi, já que não lemos `.dproj` (ADR 0001); os demais símbolos contam
  como não definidos.
- External Units não têm fonte, então tipos vindos da RTL/VCL não são
  resolvidos — exceto os containers mais usados (`TList<T>`,
  `TObjectList<T>`, `TDictionary<K,V>`, `TStringList` etc.), cujas assinaturas
  o app embute como stubs. Analisar a pasta `source` de uma instalação do
  Delphi fica para o futuro.
- Uma Unit que o parser não consegue analisar é pulada, e a Method Tab avisa
  quais Units ficaram de fora — o grafo é gerado com o restante.
