unit UFormLegado;

interface

uses
  Vcl.Forms, UClientes;

type
  TFormLegado = class(TForm)
    procedure FormShow(Sender: TObject);
  end;

implementation

{$R *.dfm}

procedure TFormLegado.FormShow(Sender: TObject);
begin
  Ping(3);
end;

end.
