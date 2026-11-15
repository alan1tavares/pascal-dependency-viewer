unit UFormPrincipal;

interface

uses
  System.Classes, Vcl.Forms, Vcl.StdCtrls, Vcl.ExtCtrls, UClientes;

type
  TFormPrincipal = class(TForm)
    Panel1: TPanel;
    Button1: TButton;
    Button2: TButton;
    procedure Button1Click(Sender: TObject);
    procedure FormCreate(Sender: TObject);
  private
    FPedido: TPedido;
    procedure Button2Click(Sender: TObject);
    procedure Atalho;
  end;

var
  FormPrincipal: TFormPrincipal;

implementation

{$R *.dfm}

procedure TFormPrincipal.Button1Click(Sender: TObject);
begin
  FPedido.Salvar;
end;

procedure TFormPrincipal.FormCreate(Sender: TObject);
begin
  Button2.OnClick := Button2Click;
end;

procedure TFormPrincipal.Button2Click(Sender: TObject);
begin
  // Salvar;
  ShowMessage('Salvar');
end;

procedure TFormPrincipal.Atalho;
begin
  Button1Click(nil);
end;

end.
