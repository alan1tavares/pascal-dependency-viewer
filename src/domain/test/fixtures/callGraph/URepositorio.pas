unit URepositorio;

interface

uses
  System.Generics.Collections, UEntidades;

type
  TRepositorio<T: TEntidade> = class
  private
    FItens: TObjectList<T>;
  public
    function Primeiro: T;
    procedure SalvarTodos;
  end;

implementation

function TRepositorio<T>.Primeiro: T;
begin
  Result := FItens[0];
end;

procedure TRepositorio<T>.SalvarTodos;
var
  Item: T;
begin
  for Item in FItens do
    Item.Salvar;
end;

end.
