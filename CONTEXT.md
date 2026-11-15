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
e, opcionalmente, um atalho de teclado. Commands: `Abrir projeto (.dpr)`,
`Abrir recente`, `Selecionar Unit`, `Selecionar Método` e `Bem-vindo`. Um
Command que não pode fazer nada no estado atual (ex.: `Selecionar Unit` antes
de qualquer Project ter sido aberto, ou `Selecionar Método` quando a Tab ativa
não é uma Unit Tab) não é oferecido na Command Palette, e fica desabilitado
no menu nativo.
_Evitar_: "item de menu" ou "ação" — impreciso; o menu nativo é apenas um dos
lugares de onde um Command pode ser disparado.

**Command Palette**:
O overlay de busca, exibido no topo da tela, onde o usuário filtra e dispara
um Command. Além da lista de Commands, tem um modo próprio para cada Command
que exige uma escolha: a lista de Recent Projects (`Abrir recente`), a de
Project Units (`Selecionar Unit`) e a de Methods da Root Unit da Unit Tab
ativa (`Selecionar Método`).
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
Quais partes do Dependency Graph já calculado são exibidas no momento em uma
Unit Tab. É escolhido na própria Unit Tab, vale só para ela e não é
persistido — alterá-lo renderiza novamente o grafo existente sem percorrer o
sistema de arquivos de novo. São dois eixos independentes, cada um alternado separadamente:
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

**Method**:
Uma procedure ou function com corpo na seção `implementation` de uma Unit,
seja de uma classe (`TFoo.Bar`) ou solta. Os overloads de mesmo nome dentro
da mesma classe (ou soltos na mesma Unit) formam um único Method. Rotinas
aninhadas não são Methods próprios: o que acontece dentro delas pertence à
rotina que as envolve.
_Evitar_: "rotina", "função" ou "procedure" como termo genérico.

**Target Method**:
O Method escolhido pelo usuário como ponto de partida de um Caller Graph —
a base do grafo.

**Caller**:
Um trecho de código que chama um Method: outro Method, o bloco principal do
Project ou a seção `initialization`/`finalization` de uma Unit. Só uma Project
Unit (ou o próprio Project) pode conter Callers. Passar um Method adiante
sem chamá-lo (atribuí-lo a um evento, passá-lo como parâmetro) não faz de quem
o passa um Caller.

**Polymorphic Call**:
Uma chamada que alcança um Method através de uma declaração mais genérica —
o Method virtual de uma classe ancestral ou o método de uma interface que a
classe implementa — e não pela própria classe do Method. Conta como chamada
desse Method, mas é distinguida das chamadas diretas.

**Entry Point**:
Um Caller por onde a execução pode entrar sem ser chamada pelo código Pascal
do Project: um Method ligado a um evento de componente no formulário da sua
Unit (`.dfm`/`.fmx`), um Method passado adiante sem ser chamado, o bloco
principal do Project ou uma seção `initialization`/`finalization`. Um Method
que é Entry Point ainda pode ter Callers próprios.

**Caller Graph**:
A expansão transitiva dos Callers de um Target Method, subindo até os
Methods sem Callers encontrados. Como no Dependency Graph, cada Method aparece
uma única vez: chamadas a um Method já presente apontam para o nó existente,
de modo que recursão e ciclos de chamadas se fecham em vez de expandir
infinitamente.
_Evitar_: "Inverted Call Graph", "Reverse Call Graph", "Call Tree" (árvore
de chamadas).

**Tab**:
Uma das telas abertas na área principal da janela, selecionável pela barra
de abas, no estilo das abas de editor do VSCode. Apenas uma Tab fica ativa
(visível) por vez, e o usuário pode fechar qualquer uma; se todas forem
fechadas, a Welcome Tab volta a ser exibida. Há três tipos: Welcome Tab,
Unit Tab e Method Tab.
_Evitar_: "janela", "view" ou "tela" para se referir a uma Tab — a janela é
uma só, e "tela" é genérico demais.

**Welcome Tab**:
A Tab de boas-vindas, aberta ao iniciar o app. Continua aberta depois que um
Project é carregado, até o usuário fechá-la; pode ser reaberta pelo Command
`Bem-vindo`. Existe no máximo uma, e não pode ser fechada quando é a única
Tab aberta.

**Unit Tab**:
Uma Tab que exibe o Dependency Graph de uma Root Unit do Project aberto, e é
identificada por essa Root Unit: escolher uma Root Unit que já tem Unit Tab
apenas a ativa, e escolher uma nova abre uma nova Unit Tab. Cada Unit Tab
guarda seu próprio View Filter e o enquadramento do grafo enquanto estiver
aberta. Abrir um Project fecha todas as Unit Tabs existentes.
_Evitar_: "Graph Tab" — tanto a Unit Tab quanto a Method Tab exibem grafos.

**Method Tab**:
Uma Tab que exibe o Caller Graph de um Target Method, e é identificada por
esse Target Method: escolher um Method que já tem Method Tab apenas a ativa.
Abrir um Project fecha todas as Method Tabs existentes.

**Svelte Component**:
Um componente de interface do usuário escrito em Svelte (arquivo `.svelte`),
compilado via `vite-plugin-svelte`. Dentro deste projeto, componentes Svelte
coexistem com componentes vanilla JavaScript e são o caminho gradual para
modernizar a camada de renderização. Novos componentes devem ser Svelte por
padrão.

**IPC Bridge**:
Um módulo em `src/renderer/services/` que encapsula chamadas `ipcRenderer.invoke`
para o main process. Expõe funções puras (ex.: `openProject()`, `expandGraph()`)
que componentes Svelte chamam sem conhecer detalhes de IPC. A Bridge isola
a complexidade de comunicação inter-processo e facilita testes.
_Evitar_: chamar `ipcRenderer` diretamente de componentes — sempre passar por
uma Bridge.

**Svelte Store**:
Um estado reativo gerenciado via `svelte/store` (readable, writable, ou derived).
Usado para estado que é:
- Compartilhado entre múltiplos componentes (ex.: projeto atual, unidades carregadas)
- Atualizado reativamentequando dados chegam via IPC

Stores geralmente são alimentados pela IPC Bridge e observados por componentes
Svelte. Não são persistidos — um reload da aplicação restaura do main process
via IPC.
_Evitar_: guardar estado local em variáveis do componente quando ele precisa
ser compartilhado.
