unit uRelatorioVendas;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, RLReport, FireDAC.Stan.Intf,
  FireDAC.Stan.Option, FireDAC.Stan.Param, FireDAC.Stan.Error, FireDAC.DatS,
  FireDAC.Phys.Intf, FireDAC.DApt.Intf, FireDAC.Stan.Async, FireDAC.DApt,
  Data.DB, FireDAC.Comp.DataSet, FireDAC.Comp.Client;

type
  TfmRelatorioVendas = class(TForm)
    RLReport1: TRLReport;
    qrVendas: TFDQuery;
    dsVendas: TDataSource;
    qrVendasID: TIntegerField;
    qrVendasDATA: TDateField;
    qrVendasCADEIRA: TIntegerField;
    RLBand1: TRLBand;
    RLLabel1: TRLLabel;
    RLSystemInfo1: TRLSystemInfo;
    RLGroup1: TRLGroup;
    RLBand2: TRLBand;
    RLLabel2: TRLLabel;
    RLDBText1: TRLDBText;
    RLLabel3: TRLLabel;
    RLDBText2: TRLDBText;
    RLBand3: TRLBand;
    RLLabel4: TRLLabel;
    RLDBText3: TRLDBText;
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  fmRelatorioVendas: TfmRelatorioVendas;

implementation

{$R *.dfm}

uses uDmConn;

end.
