unit uCadastroFilmes;

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
  TfmCadastroFilmes = class(TfmCadastroBase)
    qrDadosNOME: TStringField;
    qrDadosDUBLADO: TSmallintField;
    qrDadosCLASSIFICADO: TSmallintField;
    qrDadosTIPO: TSmallintField;
    Id: TLabel;
    edId: TDBEdit;
    Label1: TLabel;
    edNome: TDBEdit;
    cbClassificacao: TComboBox;
    Label2: TLabel;
    rgTipo: TRadioGroup;
    cbDublado: TCheckBox;
    qrDadosID: TFDAutoIncField;
    qrDadosDUBLADO_CF: TStringField;
    qrDadosCLASSIFICACAO_CF: TStringField;
    qrDadosTIPO_CF: TStringField;
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure qrDadosBeforePost(DataSet: TDataSet);
    procedure qrDadosAfterScroll(DataSet: TDataSet);
    procedure qrDadosCalcFields(DataSet: TDataSet);
  private
    { Private declarations }
  protected
    function ValidarDados: boolean; override;
  public
    { Public declarations }
  end;

var
  fmCadastroFilmes: TfmCadastroFilmes;

implementation

{$R *.dfm}

uses uSystemUtils;

procedure TfmCadastroFilmes.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  inherited;
  fmCadastroFilmes := nil;
end;

procedure TfmCadastroFilmes.qrDadosAfterScroll(DataSet: TDataSet);
begin
  inherited;

  cbClassificacao.ItemIndex := qrDados.FieldByName('CLASSIFICADO').AsInteger;
  rgTipo.ItemIndex := qrDadosTIPO.AsInteger;
  cbDublado.Checked := (qrDadosDUBLADO.AsInteger = 1);
end;

procedure TfmCadastroFilmes.qrDadosBeforePost(DataSet: TDataSet);
begin
  inherited;
  qrDados.FieldByName('CLASSIFICADO').AsInteger := cbClassificacao.ItemIndex;
  qrDadosTIPO.AsInteger := rgTipo.ItemIndex;

  if cbDublado.Checked then
    qrDadosDUBLADO.AsInteger := 1
  else
    qrDadosDUBLADO.AsInteger := 0;
end;

procedure TfmCadastroFilmes.qrDadosCalcFields(DataSet: TDataSet);
begin
  inherited;

  qrDadosCLASSIFICACAO_CF.AsString := cbClassificacao.Items
    [qrDadosCLASSIFICADO.AsInteger];
  qrDadosTIPO_CF.AsString := rgTipo.Items[qrDadosTIPO.AsInteger];

  if qrDadosDUBLADO.AsInteger = 0 then
    qrDadosDUBLADO_CF.AsString := 'Não'
  else
    qrDadosDUBLADO_CF.AsString := 'Sim';
end;

function TfmCadastroFilmes.ValidarDados: boolean;
begin
  if Trim(qrDadosNOME.AsString) = '' then
  begin
    ShowInformation('Informe o nome.');
    edNome.SetFocus;
    Exit(false);
  end;

  Result := true;
end;

end.
