import { parseSource, ParseError } from '../pascalParser/parser.js';

const unit = (intf, impl = '', tail = '') =>
  parseSource(`unit U;\ninterface\n${intf}\nimplementation\n${impl}\n${tail}\nend.`);
const implRoutine = (code) => unit('', code).impl.decls.find((d) => d.k === 'routine');
const body = (statements, locals = '') => implRoutine(`procedure P;\n${locals}\nbegin\n${statements}\nend;`).body;
const typeDecl = (code) => unit(`type\n${code}`).intf.decls[0];

describe('estrutura de Unit e Program', () => {
  test('Unit típica de formulário VCL', () => {
    const ast = parseSource(`unit Unit1;

interface

uses
  Winapi.Windows, Vcl.Forms, Vcl.StdCtrls;

type
  TForm1 = class(TForm)
    Button1: TButton;
    procedure Button1Click(Sender: TObject);
  private
    { Private declarations }
  public
  end;

var
  Form1: TForm1;

implementation

{$R *.dfm}

procedure TForm1.Button1Click(Sender: TObject);
begin
  ShowMessage('Olá');
end;

end.`);
    expect(ast.k).toBe('unit');
    expect(ast.name).toBe('Unit1');
    expect(ast.intf.uses.map((u) => u.name)).toEqual(['Winapi.Windows', 'Vcl.Forms', 'Vcl.StdCtrls']);
    expect(ast.resources).toEqual(['*.dfm']);
    const form = ast.intf.decls[0];
    expect(form).toMatchObject({ k: 'type', name: 'TForm1' });
    expect(form.spec.ancestors[0].name).toEqual(['TForm']);
    expect(form.spec.members.map((m) => m.k)).toEqual(['field', 'method']);
    const handler = ast.impl.decls[0];
    expect(handler).toMatchObject({ k: 'routine', className: 'TForm1', name: 'Button1Click' });
    expect(handler.body).toHaveLength(1);
  });

  test('bloco principal do Project', () => {
    const ast = parseSource(`program Projeto;

uses
  Vcl.Forms,
  Unit1 in 'Unit1.pas' {Form1};

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TForm1, Form1);
  Application.Run;
end.`);
    expect(ast.k).toBe('program');
    expect(ast.name).toBe('Projeto');
    expect(ast.uses).toEqual([{ name: 'Vcl.Forms', path: null }, { name: 'Unit1', path: 'Unit1.pas' }]);
    expect(ast.body.map((s) => s.k)).toEqual(['expr', 'expr', 'expr']);
    expect(ast.body[1].expr).toMatchObject({ k: 'call', callee: { k: 'member', name: 'CreateForm' } });
  });

  test('initialization e finalization', () => {
    const ast = unit('', '', 'initialization\n  Registrar;\nfinalization\n  Liberar;');
    expect(ast.init).toHaveLength(1);
    expect(ast.final).toHaveLength(1);
  });

  test('erro de sintaxe vira ParseError com linha e coluna', () => {
    let error;
    try {
      parseSource('unit U;\ninterface\nimplementation\nprocedure P;\nbegin\n  if then\nend;\nend.');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ParseError);
    expect(error.line).toBe(6);
    expect(error.col).toBe(6);
    expect(error.message).toMatch(/linha 6, coluna 6/);
  });
});

describe('declarações de tipos', () => {
  test('classe com ancestral, interfaces, visibilidade, diretivas e properties', () => {
    const decl = typeDecl(`TCliente = class(TEntidade, ICliente)
  strict private
    FNome: string;
    FItens: array of Integer;
    class var Contador: Integer;
  protected
    function GetItem(Index: Integer): TItem;
    procedure Salvar; virtual; abstract;
  public
    constructor Create(const ANome: string); overload;
    destructor Destroy; override;
    class function Novo: TCliente; static;
    procedure Antigo; reintroduce; deprecated 'use Novo';
    property Nome: string read FNome write FNome;
    property Itens[Index: Integer]: TItem read GetItem; default;
  published
    property Tag stored False default 0;
  end;`);
    const spec = decl.spec;
    expect(spec.ancestors.map((a) => a.name[0])).toEqual(['TEntidade', 'ICliente']);
    const methods = spec.members.filter((m) => m.k === 'method');
    expect(methods.map((m) => [m.routine.name, m.routine.directives])).toEqual([
      ['GetItem', []],
      ['Salvar', ['virtual', 'abstract']],
      ['Create', ['overload']],
      ['Destroy', ['override']],
      ['Novo', ['static']],
      ['Antigo', ['reintroduce', 'deprecated']],
    ]);
    expect(methods[4].isClass).toBe(true);
    const props = spec.members.filter((m) => m.k === 'property');
    expect(props.map((p) => [p.name, p.isDefault, p.read])).toEqual([
      ['Nome', false, ['FNome']],
      ['Itens', true, ['GetItem']],
      ['Tag', false, null],
    ]);
    expect(props[1].params[0].names).toEqual(['Index']);
    expect(spec.members.find((m) => m.k === 'field' && m.names[0] === 'FNome').visibility).toBe('private');
  });

  test('record com métodos e parte variante', () => {
    const decl = typeDecl(`TPonto = packed record
    X, Y: Integer;
    function Soma: Integer;
    case Tipo: Byte of
      0: (A: Integer);
      1: (B, C: Word);
  end;`);
    expect(decl.spec.kind).toBe('record');
    expect(decl.spec.members.filter((m) => m.k === 'field').map((m) => m.names)).toEqual([['X', 'Y'], ['A'], ['B', 'C']]);
  });

  test('interface com GUID, class helper e record helper', () => {
    const ast = unit(`type
  ICliente = interface(IInterface)
    ['{6A1F0C1E-2B3D-4E5F-8A9B-0C1D2E3F4A5B}']
    procedure Salvar;
    property Nome: string read GetNome;
  end;
  TClienteHelper = class helper for TCliente
    procedure Imprimir;
  end;
  TIntHelper = record helper for Integer
    function ToText: string;
  end;`);
    const [intf, helper, recHelper] = ast.intf.decls;
    expect(intf.spec).toMatchObject({ kind: 'interface' });
    expect(intf.spec.members.map((m) => m.k)).toEqual(['method', 'property']);
    expect(helper.spec.helperFor.name).toEqual(['TCliente']);
    expect(recHelper.spec.helperFor.name).toEqual(['Integer']);
  });

  test('genéricos com constraints, aliases e tipos procedurais', () => {
    const ast = unit(`type
  TRepositorio<T: TEntidade, constructor; K> = class
    function Primeiro: T;
  end;
  TLista = TObjectList<TCliente>;
  TCor = (Vermelho, Verde = 5, Azul);
  TFaixa = 1..10;
  PCliente = ^TCliente;
  TClasse = class of TCliente;
  TEvento = procedure(Sender: TObject) of object;
  TFunc = reference to function(const A: string): Boolean;
  TCallback = procedure(Code: Integer); stdcall;
  TConjunto = set of TCor;
  TNome = type string;
  TAdiantada = class;`);
    const byName = Object.fromEntries(ast.intf.decls.map((d) => [d.name, d]));
    expect(byName.TRepositorio.typeParams.map((p) => [p.name, p.constraint?.name[0] ?? null])).toEqual([
      ['T', 'TEntidade'],
      ['K', null],
    ]);
    expect(byName.TLista.spec).toMatchObject({ k: 'named', name: ['TObjectList'] });
    expect(byName.TLista.spec.args[0].name).toEqual(['TCliente']);
    expect(byName.TCor.spec.names).toEqual(['Vermelho', 'Verde', 'Azul']);
    expect(byName.TFaixa.spec.k).toBe('subrange');
    expect(byName.PCliente.spec.k).toBe('pointer');
    expect(byName.TClasse.spec.k).toBe('classof');
    expect(byName.TEvento.spec).toMatchObject({ k: 'proc', ofObject: true });
    expect(byName.TFunc.spec).toMatchObject({ k: 'proc', reference: true, kind: 'function' });
    expect(byName.TCallback.spec.k).toBe('proc');
    expect(byName.TConjunto.spec.k).toBe('set');
    expect(byName.TAdiantada.spec.forward).toBe(true);
  });

  test('classe curta sem corpo e constantes tipadas estruturadas', () => {
    const ast = unit(`type
  EMinhaExcecao = class(Exception);
const
  Nomes: array[0..1] of string = ('a', 'b');
  Ponto: TPonto = (X: 1; Y: 2);
  Max = 10;`);
    expect(ast.intf.decls.map((d) => d.k)).toEqual(['type', 'const', 'const', 'const']);
  });
});

describe('corpos de routines', () => {
  test('variáveis locais, rotinas aninhadas e asm', () => {
    const routine = implRoutine(`procedure P;
var
  A, B: Integer;
const
  C = 1;
  procedure Interna(X: Integer);
  begin
    Fazer(X);
  end;
  function Asm: Integer;
  asm
    MOV EAX, 1
  end;
begin
  Interna(A);
end;`);
    expect(routine.decls.map((d) => d.k)).toEqual(['var', 'const', 'routine', 'routine']);
    expect(routine.decls[2].body).toHaveLength(1);
    expect(routine.decls[3].body[0].k).toBe('asm');
  });

  test('todas as instruções', () => {
    const stmts = body(`
  A := 1;
  if A > 0 then B else C;
  case A of
    1, 2: X;
    3..5: begin Y; Z; end;
  else
    W;
  end;
  for I := 0 to 10 do Foo(I);
  for I := 10 downto 0 do ;
  for C in Lista do C.Salvar;
  for var J := 1 to 2 do;
  while A < 10 do Inc(A);
  repeat Dec(A); until A = 0;
  with Pedido.Cliente, Outro do Salvar;
  try
    Arriscado;
  except
    on E: EConvertError do Log(E.Message);
    on Exception do raise;
  else
    Outro;
  end;
  try Foo; finally Bar; end;
  try Foo; except Bar; end;
  raise Exception.Create('x') at Endereco;
  inherited;
  inherited Salvar(1);
  Exit(False);
  var K: Integer := 3;
  Fim: Foo;
  goto Fim;
  asm NOP end;`);
    expect(stmts.map((s) => s.k)).toEqual([
      'assign', 'if', 'case', 'for', 'for', 'forin', 'for', 'while', 'repeat', 'with', 'try', 'try', 'try',
      'raise', 'expr', 'expr', 'expr', 'localvar', 'expr', 'asm',
    ]);
    expect(stmts[2].branches).toHaveLength(2);
    expect(stmts[2].else).toHaveLength(1);
    expect(stmts[10].handlers.map((h) => [h.name, h.type.name[0]])).toEqual([['E', 'EConvertError'], [null, 'Exception']]);
    expect(stmts[14].expr).toEqual(expect.objectContaining({ k: 'inherited', name: null }));
    expect(stmts[15].expr).toMatchObject({ k: 'call', callee: { k: 'inherited', name: 'Salvar' } });
  });

  test('expressões com designadores, @, as, casts e genéricos', () => {
    const stmts = body(`
  X := a.b[i].c(x);
  Y := @Salvar;
  (Obj as TCliente).Salvar;
  TCliente(Obj).Salvar;
  L := TObjectList<TCliente>.Create(True);
  if (A < B) and (C > D) then;
  P := Ptr^.Campo;
  S := string(Buffer);
  Q := [1, 3..5];
  R := not Ok or (X in [1, 2]) and (Obj is TCliente);
  F := function(A: Integer): Integer begin Result := A; end;
  WriteLn(X:10:2);`);
    expect(stmts[0].value).toMatchObject({
      k: 'call',
      callee: { k: 'member', name: 'c', obj: { k: 'index', obj: { k: 'member', name: 'b', obj: { k: 'name', name: 'a' } } } },
    });
    expect(stmts[1].value).toMatchObject({ k: 'addr', expr: { k: 'name', name: 'Salvar' } });
    expect(stmts[2].expr).toMatchObject({ k: 'member', name: 'Salvar', obj: { k: 'paren', expr: { k: 'as' } } });
    expect(stmts[3].expr).toMatchObject({ k: 'member', name: 'Salvar', obj: { k: 'call', callee: { name: 'TCliente' } } });
    expect(stmts[4].value).toMatchObject({ k: 'call', callee: { k: 'member', name: 'Create', obj: { k: 'generic' } } });
    expect(stmts[5].cond).toMatchObject({ k: 'binop', op: 'and' });
    expect(stmts[6].value).toMatchObject({ k: 'member', obj: { k: 'deref' } });
    expect(stmts[10].value).toMatchObject({ k: 'anon' });
    expect(stmts[10].value.routine.body).toHaveLength(1);
  });

  test('cabeçalhos de implementação de métodos genéricos e de classe', () => {
    const ast = unit('', `function TRepositorio<T>.Primeiro: T;
begin
  Result := FItens[0];
end;

class procedure TFoo.Bar;
begin
end;

procedure Externa; external 'lib.dll' name 'X';
procedure Adiantada; forward;`);
    const [primeiro, bar, externa, adiantada] = ast.impl.decls;
    expect([primeiro.className, primeiro.name]).toEqual(['TRepositorio', 'Primeiro']);
    expect(bar.isClass).toBe(true);
    expect(externa.body).toBeNull();
    expect(adiantada.body).toBeNull();
  });
});
