import { indexProject, callersOf, isEntryPoint } from './support/memoryProject.js';

const unit = (name, intf, impl, extra = '') => `unit ${name};\ninterface\n${intf}\nimplementation\n${impl}\n${extra}\nend.`;

const CLIENTES = unit('UClientes', `
uses System.Generics.Collections;
type
  TEndereco = class
    procedure Validar;
  end;
  TCliente = class
    procedure Salvar;
    procedure Gravar;
    function Endereco: TEndereco;
  end;
  TPedido = class
    procedure Salvar;
    function Cliente: TCliente;
  end;
  TRepositorio<T: class> = class
    function Primeiro: T;
  end;
function Formatar: string;`, `
procedure TEndereco.Validar; begin end;
procedure TCliente.Salvar; begin end;
procedure TCliente.Gravar; begin end;
function TCliente.Endereco: TEndereco; begin Result := nil; end;
procedure TPedido.Salvar; begin end;
function TPedido.Cliente: TCliente; begin Result := nil; end;
function TRepositorio<T>.Primeiro: T; begin Result := nil; end;
function Formatar: string; begin Result := ''; end;`);

async function callersIn(body, label, { vars = '', uses = 'UClientes, System.Generics.Collections, Vcl.Forms' } = {}) {
  const tela = unit('UTela', `uses ${uses};
type
  TTela = class
    procedure Gravar(Obj: TObject);
  end;`, `procedure TTela.Gravar(Obj: TObject);
${vars ? `var\n${vars}` : ''}
begin
${body}
end;`);
  const { index } = await indexProject({ UClientes: CLIENTES, UTela: tela });
  return callersOf(index, label);
}

describe('Resolução de tipos do receptor', () => {
  test('chamada direta entre Units', async () => {
    expect(await callersIn('  C.Salvar;', 'TCliente.Salvar', { vars: '  C: TCliente;' })).toEqual(['TTela.Gravar']);
  });

  test('mesmo nome em classes diferentes', async () => {
    const vars = '  P: TPedido;';
    expect(await callersIn('  P.Salvar;', 'TPedido.Salvar', { vars })).toEqual(['TTela.Gravar']);
    expect(await callersIn('  P.Salvar;', 'TCliente.Salvar', { vars })).toEqual([]);
  });

  test('Self implícito (e Salvar herdado quando a classe não declara)', async () => {
    const { index } = await indexProject({
      UClientes: CLIENTES,
      UFilho: unit('UFilho', `uses UClientes;
type
  TFilho = class(TCliente)
    procedure Usar;
  end;
  TPropria = class
    procedure Salvar;
    procedure Usar;
  end;`, `procedure TFilho.Usar; begin Salvar; end;
procedure TPropria.Salvar; begin end;
procedure TPropria.Usar; begin Salvar; Self.Salvar; end;`),
    });
    expect(callersOf(index, 'TCliente.Salvar')).toEqual(['TFilho.Usar']);
    expect(callersOf(index, 'TPropria.Salvar')).toEqual(['TPropria.Usar']);
  });

  test('encadeamento de retorno', async () => {
    const vars = '  Pedido: TPedido;';
    expect(await callersIn('  Pedido.Cliente.Salvar;', 'TCliente.Salvar', { vars })).toEqual(['TTela.Gravar']);
    expect(await callersIn('  Pedido.Cliente.Endereco.Validar;', 'TEndereco.Validar', { vars })).toEqual(['TTela.Gravar']);
  });

  test('bloco with', async () => {
    expect(await callersIn('  with Pedido.Cliente do Salvar;', 'TCliente.Salvar', { vars: '  Pedido: TPedido;' })).toEqual(['TTela.Gravar']);
  });

  test('cast com as e com TFoo(x)', async () => {
    expect(await callersIn('  (Obj as TCliente).Salvar;', 'TCliente.Salvar')).toEqual(['TTela.Gravar']);
    expect(await callersIn('  TCliente(Obj).Salvar;', 'TCliente.Salvar')).toEqual(['TTela.Gravar']);
  });

  test('container genérico da RTL: indexador e for..in', async () => {
    const vars = '  Lista: TObjectList<TCliente>;\n  C: TCliente;\n  D: TDictionary<string, TPedido>;';
    expect(await callersIn('  Lista[0].Salvar;', 'TCliente.Salvar', { vars })).toEqual(['TTela.Gravar']);
    expect(await callersIn('  for C in Lista do C.Gravar;', 'TCliente.Gravar', { vars })).toEqual(['TTela.Gravar']);
    expect(await callersIn("  D['x'].Salvar;", 'TPedido.Salvar', { vars })).toEqual(['TTela.Gravar']);
    expect(await callersIn('  Lista.First.Salvar;', 'TCliente.Salvar', { vars })).toEqual(['TTela.Gravar']);
  });

  test('genérico do próprio Project', async () => {
    const vars = '  Repo: TRepositorio<TCliente>;';
    expect(await callersIn('  Repo.Primeiro.Salvar;', 'TCliente.Salvar', { vars })).toEqual(['TTela.Gravar']);
  });

  test('receptor de tipo desconhecido não gera chamada', async () => {
    const vars = '  X: TButton;';
    expect(await callersIn('  X.Salvar;', 'TCliente.Salvar', { vars })).toEqual([]);
    expect(await callersIn('  X.Salvar;', 'TPedido.Salvar', { vars })).toEqual([]);
    expect(await callersIn('  Desconhecido.Salvar;', 'TCliente.Salvar')).toEqual([]);
  });

  test('routine solta visível pelas uses, com e sem qualificação por Unit', async () => {
    expect(await callersIn('  Formatar;', 'Formatar')).toEqual(['TTela.Gravar']);
    expect(await callersIn('  UClientes.Formatar;', 'Formatar')).toEqual(['TTela.Gravar']);
  });

  test('variáveis locais declaradas inline e property indexada default', async () => {
    expect(await callersIn('  var C := TCliente.Create;\n  C.Salvar;', 'TCliente.Salvar')).toEqual(['TTela.Gravar']);
    expect(await callersIn('  var C: TCliente;\n  C.Salvar;', 'TCliente.Salvar')).toEqual(['TTela.Gravar']);
  });

  test('inherited com e sem nome é chamada direta ao ancestral', async () => {
    const { index } = await indexProject({
      UBase: unit('UBase', `type
  TBase = class
    procedure Salvar; virtual;
    procedure Carregar(X: Integer); virtual;
  end;
  TDerived = class(TBase)
    procedure Salvar; override;
    procedure Carregar(X: Integer); override;
  end;`, `procedure TBase.Salvar; begin end;
procedure TBase.Carregar(X: Integer); begin end;
procedure TDerived.Salvar; begin inherited; end;
procedure TDerived.Carregar(X: Integer); begin inherited Carregar(X); end;`),
    });
    expect(callersOf(index, 'TBase.Salvar')).toEqual(['TDerived.Salvar']);
    expect(callersOf(index, 'TBase.Carregar')).toEqual(['TDerived.Carregar']);
    // inherited é estático: não volta para o override como Polymorphic Call.
    expect(callersOf(index, 'TDerived.Salvar')).toEqual([]);
  });

  test('chamada em comentário ou string não conta', async () => {
    expect(await callersIn("  // C.Salvar;\n  { C.Salvar; }\n  WriteLn('C.Salvar');", 'TCliente.Salvar', { vars: '  C: TCliente;' })).toEqual([]);
  });
});

describe('Polymorphic Calls', () => {
  const BASE = unit('UBase', `type
  ICliente = interface
    procedure Salvar;
  end;
  TBase = class(TInterfacedObject, ICliente)
    procedure Salvar; virtual;
    procedure Fixo;
  end;
  TDerived = class(TBase)
    procedure Salvar; override;
    procedure Fixo;
  end;
  TNeto = class(TDerived)
    procedure Salvar; override;
  end;
  TOutro = class(TInterfacedObject, ICliente)
    procedure Salvar;
  end;`, `procedure TBase.Salvar; begin end;
procedure TBase.Fixo; begin end;
procedure TDerived.Salvar; begin end;
procedure TDerived.Fixo; begin end;
procedure TNeto.Salvar; begin end;
procedure TOutro.Salvar; begin end;`);

  async function callers(body, label, vars) {
    const { index } = await indexProject({
      UBase: BASE,
      UUso: unit('UUso', 'uses UBase;\nprocedure Usar;', `procedure Usar;\nvar\n${vars}\nbegin\n${body}\nend;`),
    });
    return callersOf(index, label);
  }

  test('override alcançado pela classe base', async () => {
    const vars = '  B: TBase;';
    expect(await callers('  B.Salvar;', 'TBase.Salvar', vars)).toEqual(['Usar']);
    expect(await callers('  B.Salvar;', 'TDerived.Salvar', vars)).toEqual(['Usar (via TBase.Salvar)']);
    expect(await callers('  B.Salvar;', 'TNeto.Salvar', vars)).toEqual(['Usar (via TBase.Salvar)']);
  });

  test('receptor de tipo derivado não alcança overrides fora da sua hierarquia', async () => {
    const vars = '  D: TDerived;';
    expect(await callers('  D.Salvar;', 'TDerived.Salvar', vars)).toEqual(['Usar']);
    expect(await callers('  D.Salvar;', 'TNeto.Salvar', vars)).toEqual(['Usar (via TDerived.Salvar)']);
    expect(await callers('  D.Salvar;', 'TBase.Salvar', vars)).toEqual([]);
  });

  test('chamada por interface', async () => {
    const vars = '  I: ICliente;';
    expect(await callers('  I.Salvar;', 'TBase.Salvar', vars)).toEqual(['Usar (via ICliente.Salvar)']);
    expect(await callers('  I.Salvar;', 'TOutro.Salvar', vars)).toEqual(['Usar (via ICliente.Salvar)']);
    expect(await callers('  I.Salvar;', 'TDerived.Salvar', vars)).toEqual(['Usar (via ICliente.Salvar)']);
  });

  test('método não virtual não gera Polymorphic Call', async () => {
    const vars = '  B: TBase;';
    expect(await callers('  B.Fixo;', 'TBase.Fixo', vars)).toEqual(['Usar']);
    expect(await callers('  B.Fixo;', 'TDerived.Fixo', vars)).toEqual([]);
  });
});

describe('Referências sem chamada marcam Entry Points', () => {
  const FORM = unit('UForm', `uses Vcl.StdCtrls;
type
  TComparador = function(A, B: Integer): Integer;
  TForm1 = class
    Botao: TButton;
    procedure FormCreate(Sender: TObject);
    procedure BotaoClick(Sender: TObject);
    function Comparar(A, B: Integer): Integer;
  end;
procedure Ordenar(Lista: TObject; C: TComparador);
function CompararPorNome(A, B: Integer): Integer;`, `procedure TForm1.FormCreate(Sender: TObject);
begin
  Botao.OnClick := BotaoClick;
  Ordenar(nil, CompararPorNome);
  Registrar(@Comparar);
end;
procedure TForm1.BotaoClick(Sender: TObject); begin end;
function TForm1.Comparar(A, B: Integer): Integer; begin Result := 0; end;
procedure Ordenar(Lista: TObject; C: TComparador); begin end;
function CompararPorNome(A, B: Integer): Integer; begin Result := 0; end;`);

  test('atribuição a evento', async () => {
    const { index } = await indexProject({ UForm: FORM });
    expect(callersOf(index, 'TForm1.BotaoClick')).toEqual([]);
    expect(isEntryPoint(index, 'TForm1.BotaoClick')).toBe(true);
  });

  test('método passado como parâmetro procedural', async () => {
    const { index } = await indexProject({ UForm: FORM });
    expect(callersOf(index, 'CompararPorNome')).toEqual([]);
    expect(isEntryPoint(index, 'CompararPorNome')).toBe(true);
    expect(callersOf(index, 'Ordenar')).toEqual(['TForm1.FormCreate']);
  });

  test('operando de @', async () => {
    const { index } = await indexProject({ UForm: FORM });
    expect(callersOf(index, 'TForm1.Comparar')).toEqual([]);
    expect(isEntryPoint(index, 'TForm1.Comparar')).toBe(true);
  });

  test('na dúvida, function sem parênteses conta como chamada', async () => {
    const { index } = await indexProject({
      UForm: FORM,
      UUso: unit('UUso', 'uses UForm;\nprocedure Usar;', 'procedure Usar;\nvar X: Integer;\nbegin\n  Desconhecida(CompararPorNome);\nend;'),
    });
    expect(callersOf(index, 'CompararPorNome')).toEqual(['Usar']);
  });
});
