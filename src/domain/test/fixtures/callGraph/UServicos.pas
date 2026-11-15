unit UServicos;

interface

uses
  System.Classes, System.Generics.Collections, UEntidades, UClientes,
  URepositorio;

type
  TComparador = function(A, B: TCliente): Integer;

  TServico = class
  public
    procedure Processar(Repo: TRepositorio<TCliente>; Lista: TObjectList<TCliente>);
    procedure Exportar(Obj: TObject; S: ISalvavel);
    procedure ComWith(Pedido: TPedido);
  end;

procedure Inicializar;
procedure RegistrarClasses;
procedure Ordenar(Lista: TObjectList<TCliente>; Comparar: TComparador);
function CompararPorNome(A, B: TCliente): Integer;

implementation

procedure TServico.Processar(Repo: TRepositorio<TCliente>; Lista: TObjectList<TCliente>);
var
  C: TCliente;

  procedure Interna;
  begin
    Repo.Primeiro.Salvar;
  end;

begin
  Interna;
  Lista[0].Salvar;
  for C in Lista do
    C.Gravar;
  Ordenar(Lista, CompararPorNome);
end;

procedure TServico.Exportar(Obj: TObject; S: ISalvavel);
begin
  (Obj as TCliente).Validar;
  TPedido(Obj).Salvar;
  S.Salvar;
end;

procedure TServico.ComWith(Pedido: TPedido);
begin
  with Pedido.Cliente do
    Gravar;
  UClientes.Fatorial(3);
end;

procedure Inicializar;
begin
  Fatorial(5);
end;

procedure RegistrarClasses;
begin
end;

procedure Ordenar(Lista: TObjectList<TCliente>; Comparar: TComparador);
begin
end;

function CompararPorNome(A, B: TCliente): Integer;
begin
  Result := 0;
end;

initialization
  RegistrarClasses;

end.
