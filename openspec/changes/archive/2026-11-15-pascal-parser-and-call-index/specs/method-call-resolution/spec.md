# Spec Delta

## Purpose

Descobrir, com resolução de tipos, quais Callers chamam cada Method de um
Project — distinguindo chamadas diretas de Polymorphic Calls — e quais
Methods e blocos são Entry Points, formando o índice de chamadas do Project.

## ADDED Requirements

### Requirement: Índice de chamadas do Project
O sistema SHALL, a partir do `.dpr` de um Project, de suas Project Units e de
uma função de leitura de arquivos injetada, montar um índice de chamadas que
responda, para qualquer Method do Project: quais Callers o chamam (e se cada
chamada é direta ou uma Polymorphic Call) e se ele é um Entry Point. O índice
SHALL também listar as Units não analisadas. Callers SHALL ser procurados em
todas as Project Units e no bloco principal do `.dpr`; External Units nunca
SHALL ser lidas. Callers SHALL ser: Methods; o bloco principal do Project
(rótulo `Programa`); e cada seção `initialization` e `finalization` de uma
Unit (rótulos `UnitX (initialization)` e `UnitX (finalization)`). Uma chamada
feita dentro de uma rotina aninhada ou de um anonymous method SHALL ser
atribuída ao Method (ou bloco) que a envolve.

#### Scenario: Chamada direta entre Units
- **WHEN** `UnitA` tem `uses UnitB`, e `TTela.Gravar` (em `UnitA`) declara
  `C: TCliente` e executa `C.Salvar`, onde `TCliente.Salvar` está em `UnitB`
- **THEN** o índice registra `TTela.Gravar` como Caller direto de
  `TCliente.Salvar`

#### Scenario: Chamada dentro de rotina aninhada
- **WHEN** `TTela.Gravar` declara uma `procedure Interna` local que chama
  `TCliente.Salvar`
- **THEN** o Caller registrado é `TTela.Gravar`

#### Scenario: Chamada no bloco principal do Project
- **WHEN** o bloco principal do `.dpr` chama a function solta `Inicializar`
  de `UnitA`
- **THEN** o índice registra `Programa` como Caller de `Inicializar`

#### Scenario: Chamada em initialization
- **WHEN** a seção `initialization` de `UnitA` chama `RegistrarClasses`
- **THEN** o índice registra `UnitA (initialization)` como Caller de
  `RegistrarClasses`

### Requirement: Resolução de tipos do receptor
Para identificar o Method chamado, o sistema SHALL resolver o tipo do
receptor de cada chamada considerando: variáveis locais, parâmetros, campos,
properties (incluindo indexadas e a property `default`), `Self` (explícito
ou implícito dentro de um método), `inherited` (com ou sem nome),
referências de classe (`TFoo.Create`, class methods), encadeamentos de
retorno (`GetCliente.Endereco.Validar`), blocos `with` (do mais interno para
o mais externo), casts (`TFoo(x)` e `x as TFoo`), herança (membros herdados
de ancestrais), interfaces, tipos genéricos instanciados (`TRepositorio<TCliente>`)
e routines soltas visíveis pelas `uses` (respeitando qualificação por Unit,
`UnitB.Formatar`). Para tipos de External Units, o sistema SHALL conhecer
apenas as assinaturas de um conjunto embutido de stubs da RTL — no mínimo
`TList<T>`, `TObjectList<T>`, `TDictionary<K,V>`, `TObjectDictionary<K,V>`,
`TQueue<T>`, `TStack<T>`, `TEnumerable<T>` e `TStringList`/`TStrings` —
suficiente para resolver indexadores, enumeradores (`for..in`) e retornos
desses containers. Uma chamada cujo receptor não puder ser resolvido NÃO
SHALL gerar registro no índice.

#### Scenario: Mesmo nome em classes diferentes
- **WHEN** `TCliente.Salvar` e `TPedido.Salvar` existem, e um Method executa
  `P.Salvar` com `P: TPedido`
- **THEN** o índice registra a chamada apenas para `TPedido.Salvar`

#### Scenario: Self implícito
- **WHEN** dentro de `TCliente.Gravar` há uma chamada `Salvar;` sem
  qualificação
- **THEN** a chamada é resolvida para `TCliente.Salvar` (ou para o
  `Salvar` herdado, se `TCliente` não declarar um)

#### Scenario: Encadeamento de retorno
- **WHEN** `function TPedido.Cliente: TCliente` existe e um Method executa
  `Pedido.Cliente.Salvar`
- **THEN** a chamada é resolvida para `TCliente.Salvar`

#### Scenario: Bloco with
- **WHEN** um Method executa `with Pedido.Cliente do Salvar;`
- **THEN** a chamada é resolvida para `TCliente.Salvar`

#### Scenario: Cast
- **WHEN** um Method executa `(Obj as TCliente).Salvar` ou
  `TCliente(Obj).Salvar`
- **THEN** a chamada é resolvida para `TCliente.Salvar`

#### Scenario: Container genérico da RTL
- **WHEN** um Method declara `Lista: TObjectList<TCliente>` e executa
  `Lista[0].Salvar` e `for C in Lista do C.Salvar`
- **THEN** as duas chamadas são resolvidas para `TCliente.Salvar`

#### Scenario: Genérico do próprio Project
- **WHEN** `TRepositorio<T: TEntidade>` declara `function Primeiro: T` e um
  Method executa `Repo.Primeiro.Salvar` com `Repo: TRepositorio<TCliente>`
- **THEN** a chamada é resolvida para `TCliente.Salvar`

#### Scenario: Receptor de tipo desconhecido
- **WHEN** um Method executa `X.Salvar`, onde `X` é de um tipo de uma
  External Unit sem stub
- **THEN** nenhuma chamada é registrada para nenhum `Salvar`

#### Scenario: inherited
- **WHEN** `TDerived.Salvar` executa `inherited;` e `TBase.Salvar` tem corpo
- **THEN** `TDerived.Salvar` é registrado como Caller direto de
  `TBase.Salvar`

### Requirement: Polymorphic Calls
Quando uma chamada é resolvida para um método `virtual`/`dynamic` (ou já
`override`) de uma classe, o sistema SHALL registrá-la também como
Polymorphic Call de cada `override` desse método nas classes descendentes do
Project, indicando o Method declarado por onde a chamada passou (o "via").
Quando uma chamada é resolvida para um método de uma interface, o sistema
SHALL registrá-la como Polymorphic Call de cada Method que implementa esse
método nas classes do Project que implementam a interface (diretamente ou
por herança), também com o "via". A chamada ao próprio método declarado,
quando ele tem corpo, SHALL continuar registrada como direta.

#### Scenario: Override alcançado pela classe base
- **WHEN** `TBase.Salvar` é `virtual`, `TDerived.Salvar` é `override`, e um
  Method executa `B.Salvar` com `B: TBase`
- **THEN** o índice registra esse Method como Caller direto de
  `TBase.Salvar` e como Polymorphic Call de `TDerived.Salvar`, via
  `TBase.Salvar`

#### Scenario: Chamada por interface
- **WHEN** `ICliente` declara `Salvar`, `TCliente` implementa `ICliente`, e
  um Method executa `I.Salvar` com `I: ICliente`
- **THEN** o índice registra esse Method como Polymorphic Call de
  `TCliente.Salvar`, via `ICliente.Salvar`

#### Scenario: Método não virtual não gera Polymorphic Call
- **WHEN** `TBase.Salvar` não é virtual, `TDerived` declara outro `Salvar`,
  e um Method executa `B.Salvar` com `B: TBase`
- **THEN** a chamada é registrada apenas para `TBase.Salvar`

### Requirement: Referências sem chamada marcam Entry Points
Quando um Method é referenciado sem ser chamado — atribuído a um evento ou
variável procedural (`Botao.OnClick := Salvar`), passado como argumento para
um parâmetro procedural/de método (`Lista.Sort(Comparar)`), ou com o operador
`@` — o sistema NÃO SHALL registrar essa referência como chamada, e SHALL
marcar o Method referenciado como Entry Point.

#### Scenario: Atribuição a evento
- **WHEN** `TForm1.FormCreate` executa `Botao.OnClick := BotaoClick`
- **THEN** `TForm1.FormCreate` não é Caller de `TForm1.BotaoClick`, e
  `TForm1.BotaoClick` é Entry Point

#### Scenario: Método passado como parâmetro
- **WHEN** um Method executa `Ordenar(Lista, CompararPorNome)`, cujo segundo
  parâmetro é de tipo procedural
- **THEN** `CompararPorNome` é Entry Point e não recebe Caller por essa
  referência

### Requirement: Handlers de formulário são Entry Points
Para cada Unit cuja `implementation` contém `{$R *.dfm}` ou `{$R *.fmx}`
(ou o nome explícito do arquivo), o sistema SHALL ler o formulário
correspondente quando ele estiver em formato texto, e SHALL marcar como
Entry Point cada Method da classe do formulário atribuído a um evento de
componente (`OnClick = Button1Click`), inclusive em componentes aninhados e
em objetos `inherited`/`inline`. Um formulário em formato binário ou ausente
SHALL ser ignorado sem marcar a Unit como não analisada.

#### Scenario: Handler ligado no .dfm
- **WHEN** `Unit1.pas` tem `{$R *.dfm}` e `Unit1.dfm` (texto) contém
  `OnClick = Button1Click` dentro de `object Button1: TButton`
- **THEN** `TForm1.Button1Click` é Entry Point

#### Scenario: .dfm binário
- **WHEN** `Unit1.dfm` está em formato binário
- **THEN** nenhum Entry Point é marcado a partir dele e `Unit1` continua
  analisada normalmente

### Requirement: Blocos especiais são sempre Entry Points
O bloco principal do Project e as seções `initialization`/`finalization`
SHALL ser sempre Entry Points. Um Method que é Entry Point SHALL continuar
podendo ter Callers próprios.

#### Scenario: Entry Point que também é chamado
- **WHEN** `TForm1.Button1Click` está ligado no `.dfm` e também é chamado
  por `TForm1.Atalho`
- **THEN** `TForm1.Button1Click` é Entry Point e tem `TForm1.Atalho` como
  Caller
