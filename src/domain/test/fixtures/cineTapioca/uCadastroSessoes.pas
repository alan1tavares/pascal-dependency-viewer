unit uCadastroSessoes;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, uCadastroBase, Data.DB,
  FireDAC.Stan.Intf, FireDAC.Stan.Option, FireDAC.Stan.Param,
  FireDAC.Stan.Error, FireDAC.DatS, FireDAC.Phys.Intf, FireDAC.DApt.Intf,
  FireDAC.Stan.Async, FireDAC.DApt, FireDAC.Comp.DataSet, FireDAC.Comp.Client,
  Vcl.StdCtrls, Vcl.Grids, Vcl.DBGrids, Vcl.DBCtrls, Vcl.ExtCtrls, Vcl.ComCtrls,
  Vcl.Mask, Vcl.Buttons;

type
  TfmCadastroSessoes = class(TfmCadastroBase)
    qrDadosNOME: TStringField;
    qrDadosHORA: TTimeField;
    qrDadosFILME: TIntegerField;
    qrDadosSALA: TIntegerField;
    qrDadosID: TFDAutoIncField;
    Id: TLabel;
    edId: TDBEdit;
    Label1: TLabel;
    edNome: TDBEdit;
    Label2: TLabel;
    tpHora: TDateTimePicker;
    lkSalas: TDBLookupComboBox;
    qrSalas: TFDQuery;
    dsSalas: TDataSource;
    qrSalasID: TIntegerField;
    qrSalasNOME: TStringField;
    qrSalasCAPACIDADE: TIntegerField;
    Label3: TLabel;
    qrFilmes: TFDQuery;
    qrFilmesID: TIntegerField;
    qrFilmesNOME: TStringField;
    qrFilmesDUBLADO: TSmallintField;
    qrFilmesCLASSIFICADO: TSmallintField;
    qrFilmesTIPO: TSmallintField;
    dsFilmes: TDataSource;
    Label4: TLabel;
    lkFilmes: TDBLookupComboBox;
    qrDadosFILME_NOME: TStringField;
    qrDadosSALA_NOME: TStringField;
    btSalasRefresh: TSpeedButton;
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure FormShow(Sender: TObject);
    procedure qrDadosBeforePost(DataSet: TDataSet);
    procedure qrDadosAfterScroll(DataSet: TDataSet);
    procedure btSalasRefreshClick(Sender: TObject);
  private
    { Private declarations }
  protected
    function ValidarDados: boolean; override;
  public
    { Public declarations }
  end;

var
  fmCadastroSessoes: TfmCadastroSessoes;

implementation

{$R *.dfm}

uses uDmConn, uSystemUtils;

{ TfmCadastroSessoes }

procedure TfmCadastroSessoes.btSalasRefreshClick(Sender: TObject);
begin
  inherited;
  qrSalas.Refresh;
end;

procedure TfmCadastroSessoes.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  inherited;
  fmCadastroSessoes := nil;
end;

procedure TfmCadastroSessoes.FormShow(Sender: TObject);
begin
  inherited;
  qrSalas.Open;
  qrFilmes.Open;
end;

procedure TfmCadastroSessoes.qrDadosAfterScroll(DataSet: TDataSet);
begin
  inherited;
  tpHora.Time := qrDadosHORA.AsDateTime;
end;

procedure TfmCadastroSessoes.qrDadosBeforePost(DataSet: TDataSet);
begin
  inherited;
  qrDadosHORA.AsDateTime := tpHora.Time;
end;

function TfmCadastroSessoes.ValidarDados: boolean;
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
