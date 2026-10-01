# Pascal Dependency Viewer

Visualiza como as units Pascal/Delphi dependem umas das outras, a partir de
uma Root Unit escolhida dentro de um projeto Delphi inteiro.

## Linguagem

**Unit**:
Um único arquivo-fonte Pascal (`.pas`), declarado pelo seu cabeçalho
`unit Name;`. O nó básico de todo grafo de dependências que o app desenha.

**Project**:
Um arquivo `.dpr` do Delphi. Sua cláusula `uses` enumera as units próprias do
projeto, cada uma junto com o caminho do seu arquivo (`UnitA in 'UnitA.pas'`),
fornecendo um mapeamento direto Unit → arquivo.
_Evitar_: `.dproj`, `.groupproj` — não são suportados como o artefato de
"projeto".

**Recent Project**:
Um Project que o usuário já abriu com sucesso anteriormente, identificado pelo
caminho do seu arquivo `.dpr`. Os Recent Projects são listados do aberto mais
recentemente para o mais antigo, sem duplicatas — reabrir um deles o move para
o topo — e apenas os 10 mais recentes são mantidos. São persistidos entre
sessões, ao contrário do Project aberto no momento.

**Command**:
Uma ação nomeada do app que o usuário pode disparar pelo nome. Tem um rótulo
e, opcionalmente, um atalho de teclado. Commands iniciais: `Abrir projeto
(.dpr)`, `Abrir recente` e `Selecionar Unit`. Um Command que não pode fazer
nada no estado atual (ex.: `Selecionar Unit` antes de qualquer Project ter
sido aberto) não é oferecido.
_Evitar_: "item de menu" ou "ação" — impreciso; o menu nativo é apenas um dos
lugares de onde um Command pode ser disparado.

**Command Palette**:
O overlay de busca, exibido no topo da tela, onde o usuário filtra e dispara
um Command. Tem dois modos: a lista de Commands e a lista de Recent Projects
(o modo `Abrir recente`, acessado ao escolher esse Command ou diretamente pelo
seu próprio atalho).
_Evitar_: "diálogo de projetos recentes" — essa lista agora é um modo da
Command Palette, e não uma janela própria.

**Project Unit**:
Uma entrada de `uses` dentro do `.dpr` de um Project que possui um
`in 'caminho'` explícito. Essas são as units próprias do projeto — as únicas
que podem ser buscadas/selecionadas como Root Unit, já que são as únicas com
um arquivo a ser aberto.
_Evitar_: confundir com entradas sem `in 'caminho'` (units da RTL/VCL, que
não fazem parte do projeto).

**Root Unit**:
A Project Unit que o usuário escolhe na tela de busca/listagem para iniciar um
Dependency Graph.

**External Unit**:
Uma unit referenciada por alguma cláusula `uses` durante a expansão do grafo
que não é uma Project Unit (não há entrada correspondente no `.dpr` com
`in 'caminho'`) — ex.: RTL/VCL ou uma biblioteca de terceiros. É renderizada
como um nó folha, com estilo distinto das Project Units, para sinalizar que o
grafo não pôde ser expandido além dali.

**Dependency Graph**:
A expansão transitiva das referências `uses` de uma Root Unit em outras
Project Units, recursivamente, sempre seguindo as `uses` tanto de `interface`
quanto de `implementation` (veja Uses Clause Origin), independentemente de
como o resultado é exibido depois. Cada unit é expandida no máximo uma vez —
uma unit alcançada novamente a partir de outro ponto da travessia recebe uma
aresta apontando para o seu nó já existente, em vez de uma subárvore
duplicada, de modo que o resultado é um DAG, e não uma árvore literal
(dependências em diamante se fundem; ciclos se fecham em vez de recorrer
infinitamente).
_Evitar_: "Dependency Tree" (árvore de dependências) — impreciso, já que os
nós podem ter vários pais.

**Uses Clause Origin**:
Qual seção do fonte de uma Unit — `interface` ou `implementation` — declarou
uma determinada referência `uses`. É registrada em cada aresta do Dependency
Graph à medida que a travessia faz o parsing de cada Unit; uma aresta
declarada em ambas as seções carrega ambas as origens. É uma propriedade dos
dados do grafo, independente do que a tela do grafo exibe no momento.

**View Filter**:
Quais partes do Dependency Graph já calculado são exibidas no momento na tela
do grafo. É escolhido na própria tela do grafo e não é persistido — alterá-lo
renderiza novamente o grafo existente sem percorrer o sistema de arquivos de
novo. São dois eixos independentes, cada um alternado separadamente:
- **Uses Clause Origin** (`interface`, `implementation` ou ambos): ao menos
  uma está sempre selecionada; o padrão é ambas.
- **Visibilidade das External Units**: exibe ou oculta todos os nós de
  External Unit, junto com qualquer aresta que aponte para um deles. Não há
  restrição de seleção mínima (pode ser desligado sozinho); o padrão é oculto.
_Evitar_: "Uses Clause Scope" — a antiga configuração única que misturava a
travessia no momento da geração com a filtragem no momento da exibição; foi
substituída pela Uses Clause Origin, agora que a visibilidade por origem varia
independentemente da geração do grafo e, também de forma independente, da
visibilidade das External Units.
