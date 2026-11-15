unit uCadastroSalas;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, uCadastroBase, Data.DB,
  FireDAC.Stan.Intf, FireDAC.Stan.Option, FireDAC.Stan.Param,
  FireDAC.Stan.Error, FireDAC.DatS, FireDAC.Phys.Intf, FireDAC.DApt.Intf,
  FireDAC.Stan.Async, FireDAC.DApt, FireDAC.Comp.DataSet, FireDAC.Comp.Client,
  Vcl.StdCtrls, Vcl.Grids, Vcl.DBGrids, Vcl.DBCtrls, Vcl.ExtCtrls, Vcl.ComCtrls,
  Vcl.Mask;

type
  TfmCadastroSalas = class(TfmCadastroBase)
    qrDadosNOME: TStringField;
    qrDadosCAPACIDADE: TIntegerField;
    Id: TLabel;
    edId: TDBEdit;
    Label1: TLabel;
    edNome: TDBEdit;
    Label2: TLabel;
    edCapacidade: TDBEdit;
    qrDadosID: TFDAutoIncField;
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
  private
    { Private declarations }
  protected
    function ValidarDados: boolean; override;
  public
    { Public declarations }
  end;

var
  fmCadastroSalas: TfmCadastroSalas;

implementation

{$R *.dfm}

uses uDmConn, uSystemUtils;

procedure TfmCadastroSalas.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  inherited;
  fmCadastroSalas := nil;
end;

function TfmCadastroSalas.ValidarDados: boolean;
begin
  if Trim(qrDadosNOME.AsString) = '' then
  begin
    ShowInformation('Informe o nome.');
    edNome.SetFocus;
    Exit(false);
  end;

  if qrDadosCAPACIDADE.AsInteger <= 0 then
  begin
    ShowInformation('Capacidade inválida.');
    edCapacidade.SetFocus;
    Exit(false);
  end;

  Result := true;
end;

end.
