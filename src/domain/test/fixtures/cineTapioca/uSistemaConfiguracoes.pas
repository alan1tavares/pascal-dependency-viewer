unit uSistemaConfiguracoes;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.StdCtrls, Vcl.ExtCtrls, Vcl.Buttons;

type
  TfmSistemaConfiguracoes = class(TForm)
    Panel1: TPanel;
    btSalvar: TButton;
    btCancelar: TButton;
    Label1: TLabel;
    edPath: TEdit;
    Label2: TLabel;
    edUsuario: TEdit;
    Label3: TLabel;
    edSenha: TEdit;
    odArquivo: TOpenDialog;
    sbDialog: TSpeedButton;
    procedure sbDialogClick(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure btCancelarClick(Sender: TObject);
    procedure btSalvarClick(Sender: TObject);
    procedure FormShow(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  fmSistemaConfiguracoes: TfmSistemaConfiguracoes;

implementation

uses
  IniFiles;

{$R *.dfm}

procedure TfmSistemaConfiguracoes.btCancelarClick(Sender: TObject);
begin
  Self.Close;
end;

procedure TfmSistemaConfiguracoes.btSalvarClick(Sender: TObject);
var
  PathIni: string;
  IniConf: TIniFile;
begin
  PathIni := ExtractFilePath(Application.ExeName) + 'tapconf.ini';
  IniConf := TIniFile.Create(PathIni);
  try
    IniConf.WriteString('DB', 'PATH', edPath.Text);
    IniConf.WriteString('DB', 'USUARIO', edUsuario.Text);
    IniConf.WriteString('DB', 'SENHA', edSenha.Text);
    IniConf.UpdateFile;
  finally
    IniConf.Free;
  end;
end;

procedure TfmSistemaConfiguracoes.FormClose(Sender: TObject;
  var Action: TCloseAction);
begin
  Action := caFree;
  fmSistemaConfiguracoes := nil;
end;

procedure TfmSistemaConfiguracoes.FormShow(Sender: TObject);
var
  PathIni: string;
  IniConf: TIniFile;
begin
  PathIni := ExtractFilePath(Application.ExeName) + 'tapconf.ini';
  IniConf := TIniFile.Create(PathIni);
  try
    edPath.Text := IniConf.ReadString('DB', 'PATH', '');
    edUsuario.Text := IniConf.ReadString('DB', 'USUARIO', '');
    edSenha.Text := IniConf.ReadString('DB', 'SENHA', '');
  finally
    IniConf.Free;
  end;
end;

procedure TfmSistemaConfiguracoes.sbDialogClick(Sender: TObject);
begin
  if odArquivo.Execute then
    edPath.Text := odArquivo.FileName;
end;

end.
