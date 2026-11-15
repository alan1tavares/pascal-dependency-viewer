unit uPrincipal;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.ComCtrls, Vcl.Menus, Vcl.ToolWin;

type
  TfmPrincipal = class(TForm)
    mmPrincipal: TMainMenu;
    Cadastros1: TMenuItem;
    Movimentos1: TMenuItem;
    Relatrios1: TMenuItem;
    Salas1: TMenuItem;
    Filmes1: TMenuItem;
    Produtos1: TMenuItem;
    N1: TMenuItem;
    Sair1: TMenuItem;
    stPrincipal: TStatusBar;
    tbPrincipal: TToolBar;
    ToolButton1: TToolButton;
    ToolButton2: TToolButton;
    Sesses1: TMenuItem;
    Vendas1: TMenuItem;
    Vendas2: TMenuItem;
    Usurios1: TMenuItem;
    Configuraes1: TMenuItem;
    procedure Salas1Click(Sender: TObject);
    procedure Produtos1Click(Sender: TObject);
    procedure Filmes1Click(Sender: TObject);
    procedure Sesses1Click(Sender: TObject);
    procedure Vendas1Click(Sender: TObject);
    procedure Vendas2Click(Sender: TObject);
    procedure Usurios1Click(Sender: TObject);
    procedure Configuraes1Click(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  fmPrincipal: TfmPrincipal;

implementation

{$R *.dfm}

uses
  uCadastroSalas, uCadastroProdutos, uCadastroFilmes, uCadastroSessoes,
  uMovimentoVendas, uRelatorioVendasParametros, uCadastroUsuarios,
  uSistemaConfiguracoes;

procedure TfmPrincipal.Configuraes1Click(Sender: TObject);
begin
  if fmSistemaConfiguracoes = nil then
  begin
    fmSistemaConfiguracoes := TfmSistemaConfiguracoes.Create(Self);
    fmSistemaConfiguracoes.FormStyle := fsMDIChild;
  end;

  fmSistemaConfiguracoes.Show;
end;

procedure TfmPrincipal.Filmes1Click(Sender: TObject);
begin
  if fmCadastroFilmes = nil then
    fmCadastroFilmes := TfmCadastroFilmes.Create(Self);

  fmCadastroFilmes.Show;
end;

procedure TfmPrincipal.Produtos1Click(Sender: TObject);
begin
  if fmCadastroProdutos = nil then
    fmCadastroProdutos := TfmCadastroProdutos.Create(Self);

  fmCadastroProdutos.Show;
end;

procedure TfmPrincipal.Salas1Click(Sender: TObject);
begin
  if fmCadastroSalas = nil then
    fmCadastroSalas := TfmCadastroSalas.Create(Self);

  fmCadastroSalas.Show;
end;

procedure TfmPrincipal.Sesses1Click(Sender: TObject);
begin
  if fmCadastroSessoes = nil then
    fmCadastroSessoes := TfmCadastroSessoes.Create(Self);

  fmCadastroSessoes.Show;
end;

procedure TfmPrincipal.Usurios1Click(Sender: TObject);
begin
  if fmCadastroUsuarios = nil then
    fmCadastroUsuarios := TfmCadastroUsuarios.Create(Self);

  fmCadastroUsuarios.Show;
end;

procedure TfmPrincipal.Vendas1Click(Sender: TObject);
begin
  fmMovimentoVendas := TfmMovimentoVendas.Create(Self);
  try
    fmMovimentoVendas.ShowModal;
  finally
    fmMovimentoVendas.Free;
  end;
end;

procedure TfmPrincipal.Vendas2Click(Sender: TObject);
begin
  fmRelatorioVendasParametros := TfmRelatorioVendasParametros.Create(Self);
  try
    fmRelatorioVendasParametros.ShowModal;
  finally
    fmRelatorioVendasParametros.Free;
  end;
end;

end.
