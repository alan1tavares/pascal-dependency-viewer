unit uCadastroBase;

interface

{$REGION 'uses'}

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics, Vcl.Controls, Vcl.Forms, Vcl.Dialogs,
  Vcl.StdCtrls, Data.DB, Vcl.Grids, Vcl.DBGrids, Vcl.ExtCtrls, Vcl.ComCtrls,
  Vcl.DBCtrls, FireDAC.Stan.Intf, FireDAC.Stan.Option, FireDAC.Stan.Param,
  FireDAC.Stan.Error, FireDAC.DatS, FireDAC.Phys.Intf, FireDAC.DApt.Intf,
  FireDAC.Stan.Async, FireDAC.DApt, FireDAC.Comp.DataSet, FireDAC.Comp.Client;
{$ENDREGION}

type
  TfmCadastroBase = class(TForm)
    pcPrincipal: TPageControl;
    tsDados: TTabSheet;
    tsEdit: TTabSheet;
    pnDadosButtons: TPanel;
    pnDadosNavigator: TPanel;
    grDados: TDBGrid;
    btInserir: TButton;
    btEditar: TButton;
    btDeletar: TButton;
    nvDados: TDBNavigator;
    pnEdits: TPanel;
    pnEditButtons: TPanel;
    btSalvar: TButton;
    btCancelar: TButton;
    qrDados: TFDQuery;
    dsDados: TDataSource;
    procedure btInserirClick(Sender: TObject);
    procedure btEditarClick(Sender: TObject);
    procedure btSalvarClick(Sender: TObject);
    procedure btCancelarClick(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure btDeletarClick(Sender: TObject);
    procedure FormKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
  private
    procedure Insert;
    procedure Edit;
    procedure Save;
    procedure Cancel;
    procedure Delete;

    procedure GotoPageDados;
    procedure GotoPageEdit;
    procedure HiddenTabs;
    { Private declarations }
  protected
    function ValidarDados: boolean; virtual;
  public
    { Public declarations }
  end;

var
  fmCadastroBase: TfmCadastroBase;

implementation

{$R *.dfm}
{$REGION 'uses'}

uses uDmConn, uSystemUtils;
{$ENDREGION}

procedure TfmCadastroBase.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  Action := caFree;
end;

procedure TfmCadastroBase.FormKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  if not(Shift = []) then
    Exit;

  if dsDados.State = dsBrowse then
    case Key of
      VK_F2:
        Insert;
      VK_F3:
        Edit;
      VK_F4:
        Delete;
    end;

  if dsDados.State in [dsInsert, dsEdit] then
    case Key of
      VK_F9:
        Save;
      VK_ESCAPE:
        Cancel;
    end;
end;

procedure TfmCadastroBase.FormShow(Sender: TObject);
begin
  HiddenTabs;
  GotoPageDados;
  qrDados.Open;
end;

procedure TfmCadastroBase.HiddenTabs;
var
  I: Integer;
begin
  for I := 0 to pcPrincipal.PageCount - 1 do
    pcPrincipal.Pages[I].TabVisible := false;
end;

procedure TfmCadastroBase.btSalvarClick(Sender: TObject);
begin
  Save;
end;

procedure TfmCadastroBase.Save;
begin
  btSalvar.SetFocus; { TODO -oUECE -cBug : Forçar atribuição do valor ao Field }

  if ValidarDados then
  begin
    qrDados.Post;
    GotoPageDados;
  end;
end;

procedure TfmCadastroBase.Cancel;
begin
  qrDados.Cancel;
  GotoPageDados;
end;

procedure TfmCadastroBase.Delete;
begin
  if not(qrDados.IsEmpty) then
    if ShowQuestion('Deseja excluir o registro atual?') then
    begin
      qrDados.Delete;
    end;
end;

procedure TfmCadastroBase.Edit;
begin
  if not(qrDados.IsEmpty) then
  begin
    GotoPageEdit;
    qrDados.Edit;
  end;
end;

function TfmCadastroBase.ValidarDados: boolean;
begin
  Result := false;
end;

procedure TfmCadastroBase.btCancelarClick(Sender: TObject);
begin
  Cancel;
end;

procedure TfmCadastroBase.GotoPageDados;
begin
  pcPrincipal.ActivePage := tsDados;
end;

procedure TfmCadastroBase.btInserirClick(Sender: TObject);
begin
  Insert;
end;

procedure TfmCadastroBase.Insert;
begin
  GotoPageEdit;
  qrDados.Insert;
end;

procedure TfmCadastroBase.btDeletarClick(Sender: TObject);
begin
  Delete;
end;

procedure TfmCadastroBase.btEditarClick(Sender: TObject);
begin
  Edit;
end;

procedure TfmCadastroBase.GotoPageEdit;
begin
  pcPrincipal.ActivePage := tsEdit;
end;

end.
