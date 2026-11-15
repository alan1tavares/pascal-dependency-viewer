unit uCadastroUsuarios;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, uCadastroBase, Data.DB,
  FireDAC.Stan.Intf, FireDAC.Stan.Option, FireDAC.Stan.Param,
  FireDAC.Stan.Error, FireDAC.DatS, FireDAC.Phys.Intf, FireDAC.DApt.Intf,
  FireDAC.Stan.Async, FireDAC.DApt, FireDAC.Comp.DataSet, FireDAC.Comp.Client,
  Vcl.StdCtrls, Vcl.Grids, Vcl.DBGrids, Vcl.DBCtrls, Vcl.ExtCtrls, Vcl.ComCtrls,
  Vcl.Mask;

type
  TfmCadastroUsuarios = class(TfmCadastroBase)
    Label1: TLabel;
    edUser: TDBEdit;
    Label2: TLabel;
    edNome: TDBEdit;
    Label3: TLabel;
    edSenha: TEdit;
    qrUserExists: TFDQuery;
    qrDadosLOGIN: TStringField;
    qrDadosNOME: TStringField;
    qrDadosSENHA: TStringField;
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure qrDadosBeforePost(DataSet: TDataSet);
    procedure qrDadosAfterScroll(DataSet: TDataSet);
  private
    { Private declarations }
  protected
    function ValidarDados: boolean; override;
  public
    { Public declarations }
  end;

var
  fmCadastroUsuarios: TfmCadastroUsuarios;

implementation

{$R *.dfm}

uses uDmConn, uSystemUtils;

{ TfmCadastroUsuarios }

procedure TfmCadastroUsuarios.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  inherited;
  fmCadastroUsuarios := nil;
end;

procedure TfmCadastroUsuarios.qrDadosAfterScroll(DataSet: TDataSet);
begin
  inherited;
  edSenha.Text := Criptografar(qrDadosSENHA.AsString);
end;

procedure TfmCadastroUsuarios.qrDadosBeforePost(DataSet: TDataSet);
begin
  inherited;
  qrDadosSENHA.AsString := Criptografar(edSenha.Text);
end;

function TfmCadastroUsuarios.ValidarDados: boolean;
begin
  qrUserExists.Close;
  qrUserExists.ParamByName('LOGIN').AsString := qrDadosLOGIN.AsString;
  qrUserExists.Open;

  if not(qrUserExists.IsEmpty) then
    if qrDadosLOGIN.AsString <> qrUserExists.FieldByName('LOGIN').AsString then
    begin
      ShowMessage('Usuário já cadastrado.');
      edUser.SetFocus;
      Exit(False);
    end;

  Result := true;
end;

end.
