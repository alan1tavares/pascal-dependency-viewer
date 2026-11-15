unit uDialogoLogin;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.StdCtrls, FireDAC.Stan.Intf,
  FireDAC.Stan.Option, FireDAC.Stan.Param, FireDAC.Stan.Error, FireDAC.DatS,
  FireDAC.Phys.Intf, FireDAC.DApt.Intf, FireDAC.Stan.Async, FireDAC.DApt,
  Data.DB, FireDAC.Comp.DataSet, FireDAC.Comp.Client;

type
  TfmDialogoLogin = class(TForm)
    btOk: TButton;
    btCancelar: TButton;
    Label1: TLabel;
    edLogin: TEdit;
    Label2: TLabel;
    edSenha: TEdit;
    qrUserExists: TFDQuery;
    procedure btOkClick(Sender: TObject);
    procedure btCancelarClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  fmDialogoLogin: TfmDialogoLogin;

implementation

{$R *.dfm}

uses uDmConn, uSystemUtils;

procedure TfmDialogoLogin.btOkClick(Sender: TObject);
begin
  qrUserExists.Close;
  qrUserExists.ParamByName('LOGIN').AsString := edLogin.Text;
  qrUserExists.ParamByName('SENHA').AsString := Criptografar(edSenha.Text);
  qrUserExists.Open;

  if qrUserExists.IsEmpty then
    ShowInformation('Usuário não encontrado.')
  else
    ModalResult := mrOk;
end;

procedure TfmDialogoLogin.btCancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

end.
