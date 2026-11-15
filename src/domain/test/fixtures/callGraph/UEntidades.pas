unit UEntidades;

interface

type
  ISalvavel = interface
    ['{6A1F0C1E-2B3D-4E5F-8A9B-0C1D2E3F4A5B}']
    procedure Salvar;
  end;

  TEntidade = class(TInterfacedObject, ISalvavel)
  public
    procedure Salvar; virtual;
    procedure Validar; virtual; abstract;
  end;

implementation

procedure TEntidade.Salvar;
begin
  Validar;
end;

end.
