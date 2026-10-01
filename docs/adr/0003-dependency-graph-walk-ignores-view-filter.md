# A travessia do Dependency Graph sempre segue ambas as Uses Clause Origins

O View Filter da tela do grafo (interface / implementation / ambos, veja
`CONTEXT.md`) pode ser alternado a qualquer momento e precisa renderizar o
grafo novamente de forma instantânea, sem uma nova ida e volta de
`expandFromRootUnit`. Para tornar isso possível, `expandDependencyGraph`
sempre percorre a união das `uses` de `interface` e de `implementation` de
cada Unit visitada — nunca apenas o subconjunto que o View Filter está
exibindo no momento — e marca cada aresta com sua(s) Uses Clause Origin(s).
O View Filter apenas oculta/exibe nós e arestas já calculados no lado do
cliente; ele nunca muda o que é lido do disco.

Isso substitui o comportamento anterior, em que escolher "Interface" no
antigo rádio de Uses Clause Scope limitava quais arquivos chegavam a ser
lidos durante a travessia. O trade-off é deliberado: cada expansão do grafo
agora lê potencialmente mais arquivos `.pas` do que uma travessia apenas de
interface leria, em troca de o View Filter nunca mais precisar acessar o
sistema de arquivos após o carregamento inicial. Os tamanhos típicos de
projetos Delphi tornam o I/O extra desprezível diante do custo de UX de um
filtro que precisa esperar pelo disco.
