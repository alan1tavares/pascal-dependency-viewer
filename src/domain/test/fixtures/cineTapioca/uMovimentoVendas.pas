unit uMovimentoVendas;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.ExtCtrls, FireDAC.Stan.Intf,
  FireDAC.Stan.Option, FireDAC.Stan.Param, FireDAC.Stan.Error, FireDAC.DatS,
  FireDAC.Phys.Intf, FireDAC.DApt.Intf, FireDAC.Stan.Async, FireDAC.DApt,
  Data.DB, Vcl.DBCtrls, FireDAC.Comp.DataSet, FireDAC.Comp.Client, Vcl.StdCtrls,
  Vcl.Mask, Vcl.ButtonGroup, System.ImageList, Vcl.ImgList, Data.FMTBcd,
  Data.SqlExpr;

type
  TfmMovimentoVendas = class(TForm)
    pnTop: TPanel;
    qrSessoes: TFDQuery;
    dsSessoes: TDataSource;
    qrSessoesID: TIntegerField;
    qrSessoesNOME: TStringField;
    qrSessoesHORA: TTimeField;
    qrSessoesFILME: TIntegerField;
    qrSessoesSALA: TIntegerField;
    btCancelar: TButton;
    btFinalizar: TButton;
    pnDados: TPanel;
    Label1: TLabel;
    lkSessoes: TDBLookupComboBox;
    edHora: TDBEdit;
    Label2: TLabel;
    lkFilmes: TDBLookupComboBox;
    qrFilmes: TFDQuery;
    dsFilmes: TDataSource;
    Label3: TLabel;
    qrFilmesID: TIntegerField;
    qrFilmesNOME: TStringField;
    qrFilmesDUBLADO: TSmallintField;
    qrFilmesCLASSIFICADO: TSmallintField;
    qrFilmesTIPO: TSmallintField;
    Label4: TLabel;
    edSala: TDBEdit;
    qrSessoesNOME_SALA: TStringField;
    ilCadeiras: TImageList;
    bgCadeiras: TButtonGroup;
    Label5: TLabel;
    qrSessoesCAPACIDADE: TIntegerField;
    Label6: TLabel;
    qrVendas: TFDQuery;
    qrCadeirasVendidas: TFDQuery;
    procedure FormShow(Sender: TObject);
    procedure qrFilmesAfterScroll(DataSet: TDataSet);
    procedure bgCadeirasButtonClicked(Sender: TObject; Index: Integer);
    procedure btFinalizarClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure lkSessoesCloseUp(Sender: TObject);
    procedure lkSessoesKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
  private
    FCadeirasSelecionadas: TStringList;
    procedure RenderizarCadeiras;
    procedure ReiniciarVenda;
    { Private declarations }
  public
    { Public declarations }
  end;

var
  fmMovimentoVendas: TfmMovimentoVendas;

implementation

{$R *.dfm}

uses uDmConn, uSystemUtils;

const
  CADEIRA_DESOCUPADA = 0;
  CADEIRA_OCUPADA = 1;

procedure TfmMovimentoVendas.FormCreate(Sender: TObject);
begin
  FCadeirasSelecionadas := TStringList.Create;
end;

procedure TfmMovimentoVendas.FormDestroy(Sender: TObject);
begin
  FCadeirasSelecionadas.Free;
end;

procedure TfmMovimentoVendas.bgCadeirasButtonClicked(Sender: TObject;
  Index: Integer);
begin
  // Verificando se a cadeira já foi vendida
  qrCadeirasVendidas.IndexFieldNames := 'CADEIRA';
  if qrCadeirasVendidas.FindKey([Index]) then
    ShowInformation('Cadeira já vendida.')
  else
  begin
    // Se não foi vendida
    if bgCadeiras.Items[Index].ImageIndex = CADEIRA_DESOCUPADA then
    begin
      bgCadeiras.Items[Index].ImageIndex := CADEIRA_OCUPADA;
      FCadeirasSelecionadas.Add(IntToStr(Index));
    end
    else
    begin
      bgCadeiras.Items[Index].ImageIndex := CADEIRA_DESOCUPADA;
      FCadeirasSelecionadas.Delete
        (FCadeirasSelecionadas.IndexOf(IntToStr(Index)));
    end;
  end;
end;

procedure TfmMovimentoVendas.FormShow(Sender: TObject);
begin
  qrFilmes.Open;
end;

procedure TfmMovimentoVendas.qrFilmesAfterScroll(DataSet: TDataSet);
begin
  bgCadeiras.Items.Clear;
  qrSessoes.Close;
  qrSessoes.ParamByName('FILME').AsInteger := qrFilmesID.AsInteger;
  qrSessoes.Open;
end;

procedure TfmMovimentoVendas.lkSessoesCloseUp(Sender: TObject);
begin
  RenderizarCadeiras;
end;

procedure TfmMovimentoVendas.lkSessoesKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  if Key in [VK_UP, VK_DOWN] then
    RenderizarCadeiras;
end;

procedure TfmMovimentoVendas.RenderizarCadeiras;
var
  I: Integer;
  Cadeira: TGrpButtonItem;
  CadeiraVendida: Integer;
begin
  FCadeirasSelecionadas.Clear;
  bgCadeiras.Items.Clear;

  // Adicionando as caderias
  for I := 0 to qrSessoesCAPACIDADE.AsInteger - 1 do
  begin
    Cadeira := bgCadeiras.Items.Add;
    Cadeira.ImageIndex := CADEIRA_DESOCUPADA;
    Cadeira.Caption := IntToStr(I + 1);
  end;

  // Validando as cadeiras ocupadas
  qrCadeirasVendidas.Close;
  qrCadeirasVendidas.SQL.Text := 'SELECT VI.CADEIRA ' + 'FROM VENDAS_ITENS VI '
    + 'INNER JOIN VENDAS VE ON VE.ID = VI.VENDA_ID ' +
    'INNER JOIN SESSOES SE ON SE.ID = VE.SESSAO ' + 'WHERE SE.ID = :SESSAO ' +
    'AND SE.FILME = :FILME ' + 'AND VE.DATA = :DATA';
  qrCadeirasVendidas.ParamByName('SESSAO').AsInteger := qrSessoesID.AsInteger;
  qrCadeirasVendidas.ParamByName('FILME').AsInteger := qrFilmesID.AsInteger;
  qrCadeirasVendidas.ParamByName('DATA').AsDate := Now;
  qrCadeirasVendidas.Open;

  while not(qrCadeirasVendidas.Eof) do
  begin
    CadeiraVendida := qrCadeirasVendidas.FieldByName('CADEIRA').AsInteger;
    bgCadeiras.Items[CadeiraVendida].ImageIndex := CADEIRA_OCUPADA;
    qrCadeirasVendidas.Next;
  end;
end;

procedure TfmMovimentoVendas.btFinalizarClick(Sender: TObject);
var
  I: Integer;
  VendaId: Integer;
  TransOk: boolean;
begin
  TransOk := false;
  dmConn.fcConn.StartTransaction;
  try
    try
      if FCadeirasSelecionadas.Count > 0 then
      begin
        // Esse código a seguir inseri uma venda e retorna o ID da venda
        qrVendas.SQL.Text := 'INSERT INTO VENDAS(DATA, SESSAO, TOTAL) ' +
          'VALUES(:DATA, :SESSAO, :TOTAL) ' + 'RETURNING ID {INTO :ID};';

        qrVendas.ParamByName('DATA').AsDate := Now;
        qrVendas.ParamByName('SESSAO').AsInteger := qrSessoesID.AsInteger;
        qrVendas.ParamByName('TOTAL').AsCurrency := FCadeirasSelecionadas.Count * 15;
        qrVendas.ExecSQL;
        VendaId := qrVendas.ParamByName('ID').AsInteger;

        // Esse código a seguir inserir os itens da venda de riba
        qrVendas.SQL.Text :=
          'INSERT INTO VENDAS_ITENS(VENDA_ID, CADEIRA, QUANTIDADE, VALOR) ' +
          'VALUES(:VENDA_ID, :CADEIRA, :QUANTIDADE, :VALOR)';

        for I := 0 to FCadeirasSelecionadas.Count - 1 do
        begin
          qrVendas.ParamByName('VENDA_ID').AsInteger := VendaId;
          qrVendas.ParamByName('CADEIRA').AsInteger :=
            StrToInt(FCadeirasSelecionadas[I]);
          qrVendas.ParamByName('QUANTIDADE').AsInteger := 1;
          qrVendas.ParamByName('VALOR').AsCurrency := 15;
          qrVendas.ExecSQL;
        end;

        ShowInformation('Venda finalizada com sucesso.');
        TransOk := true;
        ReiniciarVenda;
      end
      else
      begin
        ShowInformation('Nenhum item selecionado para venda.');
        lkFilmes.SetFocus;
      end;
    except
      on E: exception do
        ShowInformation('Evento inesperado: ' + E.Message);
    end;
  finally
    if TransOk then
      dmConn.fcConn.Commit
    else
      dmConn.fcConn.Rollback;
  end;
end;

procedure TfmMovimentoVendas.ReiniciarVenda;
begin
  bgCadeiras.Items.Clear;
  lkSessoes.KeyValue := null;
  lkFilmes.KeyValue := null;
  lkFilmes.SetFocus;
end;

end.
