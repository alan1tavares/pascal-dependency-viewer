unit uDmConn;

interface

uses
  System.SysUtils, System.Classes, FireDAC.Stan.Intf, FireDAC.Stan.Option,
  FireDAC.Stan.Error, FireDAC.UI.Intf, FireDAC.Phys.Intf, FireDAC.Stan.Def,
  FireDAC.Stan.Pool, FireDAC.Stan.Async, FireDAC.Phys, FireDAC.Phys.FB,
  FireDAC.Phys.FBDef, FireDAC.VCLUI.Wait, Data.DB, FireDAC.Comp.Client;

type
  TdmConn = class(TDataModule)
    fcConn: TFDConnection;
    procedure DataModuleDestroy(Sender: TObject);
  private
    { Private declarations }
  public
    function Conecta: boolean;
    { Public declarations }
  end;

var
  dmConn: TdmConn;

implementation

uses
  IniFiles, Vcl.Forms;

{%CLASSGROUP 'Vcl.Controls.TControl'}
{$R *.dfm}

function TdmConn.Conecta: boolean;
var
  PathIni: string;
  IniConf: TIniFile;
begin
  PathIni := ExtractFilePath(Application.ExeName) + 'tapconf.ini';
  IniConf := TIniFile.Create(PathIni);
  try
    try
      fcConn.Params.Database := IniConf.ReadString('DB', 'PATH', '');
      fcConn.Params.UserName := IniConf.ReadString('DB', 'USUARIO', '');
      fcConn.Params.Password := IniConf.ReadString('DB', 'SENHA', '');
      fcConn.Open;
      Result := true;
    except
      on E: Exception do
        Result := false;
    end;
  finally
    IniConf.Free;
  end;
end;

procedure TdmConn.DataModuleDestroy(Sender: TObject);
begin
  fcConn.Close;
end;

end.
