import { parseSource } from '../pascalParser/parser.js';
import { listUnitMethods, methodId } from '../methods/index.js';

const methodsOf = (intf, impl) =>
  listUnitMethods(parseSource(`unit UClientes;\ninterface\n${intf}\nimplementation\n${impl}\nend.`));
const labels = (intf, impl) => methodsOf(intf, impl).map((m) => m.label);

const CLIENTE = `type
  TCliente = class
    procedure Salvar(Id: Integer); overload;
    procedure Salvar(Nome: string); overload;
    constructor Create;
  end;`;

test('métodos de classe e soltos na ordem do fonte', () => {
  expect(labels(CLIENTE, `
procedure TCliente.Salvar(Id: Integer); begin end;
function FormatarCpf(const S: string): string; begin Result := S; end;
constructor TCliente.Create; begin end;`)).toEqual(['TCliente.Salvar', 'FormatarCpf', 'TCliente.Create']);
});

test('overloads viram um único Method, na posição do primeiro corpo', () => {
  const methods = methodsOf(CLIENTE, `
procedure TCliente.Salvar(Id: Integer); begin end;
constructor TCliente.Create; begin end;
procedure TCliente.Salvar(Nome: string); begin end;`);
  expect(methods.map((m) => m.label)).toEqual(['TCliente.Salvar', 'TCliente.Create']);
});

test('rotina aninhada não é Method', () => {
  expect(labels(CLIENTE, `
procedure TCliente.Salvar(Id: Integer);
  procedure Validar;
  begin
  end;
begin
  Validar;
end;`)).toEqual(['TCliente.Salvar']);
});

test('método abstrato não é Method', () => {
  expect(labels(`type
  TBase = class
    procedure Salvar; virtual; abstract;
    procedure Carregar; virtual;
  end;`, 'procedure TBase.Carregar; begin end;')).toEqual(['TBase.Carregar']);
});

test('Unit sem Methods', () => {
  expect(methodsOf('type TCor = (Azul, Verde);\nconst Max = 10;', 'const Min = 1;')).toEqual([]);
});

test('id estável, em minúsculas, por Unit + classe + nome', () => {
  const [method, solto] = methodsOf(CLIENTE, `
procedure TCliente.Salvar(Id: Integer); begin end;
procedure Formatar; begin end;`);
  expect(method).toEqual({ id: 'unit:uclientes|tcliente|salvar', label: 'TCliente.Salvar', className: 'TCliente', name: 'Salvar' });
  expect(solto.id).toBe('unit:uclientes||formatar');
  expect(methodId('UClientes', 'TCLIENTE', 'SALVAR')).toBe(method.id);
});

test('método de classe genérica usa o nome da classe sem os parâmetros', () => {
  expect(methodsOf('', 'function TRepositorio<T>.Primeiro: T; begin end;')[0]).toMatchObject({
    id: 'unit:uclientes|trepositorio|primeiro',
    label: 'TRepositorio.Primeiro',
  });
});
