# Spec Delta

## Purpose

Ler o fonte Delphi de Units (`.pas`) e do Project (`.dpr`) com um parser
completo — não regex — e expor os Methods de cada Unit, servindo de base para
a análise de chamadas do Caller Graph.

## ADDED Requirements

### Requirement: Diretivas condicionais avaliadas com símbolos padrão do Delphi
Antes de analisar um fonte, o sistema SHALL resolver as diretivas
`{$IFDEF}`, `{$IFNDEF}`, `{$IF Defined(...)}`, `{$ELSE}`, `{$ELSEIF}` e
`{$ENDIF}` (também na forma `(*$...*)`), mantendo apenas os ramos ativos. Os
símbolos considerados definidos SHALL ser um conjunto fixo de símbolos padrão
do Delphi (no mínimo `MSWINDOWS`, `WIN32`, `CONDITIONALEXPRESSIONS`,
`UNICODE` e `DCC`), somado aos símbolos definidos por `{$DEFINE}` e removidos
por `{$UNDEF}` no próprio arquivo, na ordem em que aparecem. Qualquer outro
símbolo SHALL contar como não definido.

#### Scenario: Ramo com símbolo padrão é mantido
- **WHEN** o fonte contém `{$IFDEF MSWINDOWS} A; {$ELSE} B; {$ENDIF}`
- **THEN** apenas `A;` é analisado

#### Scenario: Ramo com símbolo desconhecido é descartado
- **WHEN** o fonte contém `{$IFDEF DEBUG_LOG} Log; {$ENDIF}`
- **THEN** `Log;` não é analisado

#### Scenario: DEFINE no próprio arquivo ativa o ramo seguinte
- **WHEN** o fonte contém `{$DEFINE USE_CACHE}` e, depois,
  `{$IFDEF USE_CACHE} Cache; {$ENDIF}`
- **THEN** `Cache;` é analisado

#### Scenario: Diretivas aninhadas
- **WHEN** um `{$IFDEF X}` desconhecido contém um `{$IFDEF MSWINDOWS}`
  interno
- **THEN** nada do bloco externo é analisado, inclusive o ramo interno

### Requirement: Parsing de Units e do Project
O sistema SHALL analisar uma Unit `.pas` reconhecendo, no mínimo: as seções
`interface`, `implementation`, `initialization` e `finalization`; cláusulas
`uses`; declarações de tipos (classes, records, interfaces, class helpers,
tipos genéricos, ponteiros/aliases), com campos, métodos, properties
(incluindo indexadas e `default`) e diretivas (`virtual`, `override`,
`abstract`, `overload`, `reintroduce`, `static`, `class`); declarações de
variáveis, constantes e routines; corpos de routines com rotinas aninhadas,
anonymous methods e todas as instruções da linguagem (incluindo `with`,
`try`/`except`/`finally`, `case`, `for..in`, `raise`, `inherited`, `asm`
tratado como bloco opaco). O sistema SHALL analisar um `.dpr` reconhecendo
seu bloco principal `begin..end.`. Comentários (`//`, `{ }`, `(* *)`) e
strings SHALL ser ignorados para fins de análise. Identificadores SHALL ser
comparados sem diferenciar maiúsculas de minúsculas.

#### Scenario: Unit típica de formulário VCL
- **WHEN** o parser recebe uma Unit com `TForm1 = class(TForm)`, campos de
  componentes, um handler `procedure Button1Click(Sender: TObject);`, uma
  seção `implementation` com `{$R *.dfm}` e o corpo do handler
- **THEN** a análise conclui sem erro e reconhece a classe, o handler e seu
  corpo

#### Scenario: Chamada dentro de comentário ou string é ignorada
- **WHEN** um corpo contém `// Salvar;` e `ShowMessage('Salvar');`
- **THEN** nenhum dos dois conta como ocorrência do identificador `Salvar`

#### Scenario: Bloco principal do Project
- **WHEN** o parser recebe um `.dpr` com `begin Application.Initialize;
  Application.CreateForm(TForm1, Form1); Application.Run; end.`
- **THEN** a análise reconhece o bloco principal e suas instruções

### Requirement: Falha de parse é reportada por Unit, sem abortar o Project
Quando o sistema não conseguir analisar um arquivo (sintaxe não suportada,
fonte inválido ou erro de leitura), o sistema SHALL registrar essa Unit como
não analisada, com o nome da Unit e o motivo (incluindo linha e coluna
quando houver), e SHALL continuar analisando as demais. Uma Unit não analisada
SHALL ser tratada como se não tivesse Methods nem Callers.

#### Scenario: Uma Unit inválida entre várias
- **WHEN** um Project tem `UnitA`, `UnitB` e `UnitC`, e `UnitB` contém um
  construto que o parser não aceita
- **THEN** `UnitA` e `UnitC` são analisadas normalmente e `UnitB` aparece na
  lista de Units não analisadas, com o motivo

### Requirement: Extração dos Methods de uma Unit
O sistema SHALL listar os Methods de uma Unit: toda procedure ou function
com corpo na seção `implementation`, seja de uma classe/record
(`TFoo.Bar`, incluindo construtores, destrutores e class methods) ou solta.
A lista SHALL seguir a ordem em que os corpos aparecem no fonte. Overloads de
mesmo nome dentro da mesma classe (ou soltos na mesma Unit) SHALL formar um
único Method, posicionado na ordem do primeiro corpo. Rotinas aninhadas e
anonymous methods NÃO SHALL ser Methods próprios. Métodos sem corpo
(`abstract`, de interface, `external`) NÃO SHALL ser Methods. Cada Method
SHALL ser identificado de forma estável por Unit + classe (quando houver) +
nome, sem diferenciar maiúsculas de minúsculas, e SHALL expor um rótulo
(`TCliente.Salvar` para métodos de classe, `Salvar` para soltos) com a grafia
original.

#### Scenario: Métodos de classe e soltos na ordem do fonte
- **WHEN** a `implementation` contém, nesta ordem, os corpos de
  `TCliente.Salvar`, `FormatarCpf` e `TCliente.Create`
- **THEN** a lista é `TCliente.Salvar`, `FormatarCpf`, `TCliente.Create`

#### Scenario: Overloads viram um único Method
- **WHEN** `TCliente` tem `Salvar(Id: Integer); overload;` e
  `Salvar(Nome: string); overload;`, ambos com corpo
- **THEN** a lista contém um único `TCliente.Salvar`

#### Scenario: Rotina aninhada não é Method
- **WHEN** o corpo de `TCliente.Salvar` declara uma `procedure Validar`
  local
- **THEN** a lista contém `TCliente.Salvar` e não contém `Validar`

#### Scenario: Método abstrato não é Method
- **WHEN** `TBase` declara `procedure Salvar; virtual; abstract;` sem corpo
- **THEN** a lista de Methods da Unit não contém `TBase.Salvar`

#### Scenario: Unit sem Methods
- **WHEN** a Unit só declara tipos e constantes, sem nenhum corpo de routine
- **THEN** a lista de Methods é vazia
