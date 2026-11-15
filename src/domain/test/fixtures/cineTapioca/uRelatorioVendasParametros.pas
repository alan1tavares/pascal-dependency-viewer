unit uRelatorioVendasParametros;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.ExtCtrls, Vcl.StdCtrls;

type
  TfmRelatorioVendasParametros = class(TForm)
    pnButtons: TPanel;
    btVisualizar: TButton;
    btImprimir: TButton;
    procedure btVisualizarClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  fmRelatorioVendasParametros: TfmRelatorioVendasParametros;

implementation

{$R *.dfm}

uses uRelatorioVendas;

procedure TfmRelatorioVendasParametros.btVisualizarClick(Sender: TObject);
begin
  fmRelatorioVendas := TfmRelatorioVendas.Create(Self);
  try
    fmRelatorioVendas.RLReport1.PreviewModal;
  finally
    fmRelatorioVendas.Free;
  end;
end;

end.
