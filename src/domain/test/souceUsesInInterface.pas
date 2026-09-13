unit untExercicio04;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.StdCtrls;

type
  TfrmExercicio04 = class(TForm)
    lblRotulo: TLabel;
    gbxCorDeFundo: TGroupBox;
    btnAzul: TButton;
    btnVerde: TButton;
    btnVermelho: TButton;
    gbxCorDoTexto: TGroupBox;
    btnTextoVermelho: TButton;
    btnTextoVerde: TButton;
    btnTextoAzul: TButton;
    GroupBox1: TGroupBox;
    Button1: TButton;
    Button2: TButton;
    Button3: TButton;
    gbxTamanhoDaFonte: TGroupBox;
    btnTamanho12: TButton;
    btnTamanho14: TButton;
    btnTamanho18: TButton;
    gbxFamiliaDaFonte: TGroupBox;
    btnTahoma: TButton;
    btnTimesNewRoman: TButton;
    btnArial: TButton;
    procedure btnVermelhoClick(Sender: TObject);
    procedure btnVerdeClick(Sender: TObject);
    procedure btnAzulClick(Sender: TObject);
    procedure btnTextoVermelhoClick(Sender: TObject);
    procedure btnTextoVerdeClick(Sender: TObject);
    procedure btnTextoAzulClick(Sender: TObject);
    procedure btnTamanho12Click(Sender: TObject);
    procedure btnTamanho14Click(Sender: TObject);
    procedure btnTamanho18Click(Sender: TObject);
    procedure btnArialClick(Sender: TObject);
    procedure btnTimesNewRomanClick(Sender: TObject);
    procedure btnTahomaClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  frmExercicio04: TfrmExercicio04;

implementation

{$R *.dfm}

procedure TfrmExercicio04.btnArialClick(Sender: TObject);
begin
  lblRotulo.Font.Name := 'Arial';
end;

procedure TfrmExercicio04.btnAzulClick(Sender: TObject);
begin
  lblRotulo.Color := clBlue;
end;

procedure TfrmExercicio04.btnTahomaClick(Sender: TObject);
begin
  lblRotulo.Font.Name := 'Tahoma';
end;

procedure TfrmExercicio04.btnTamanho12Click(Sender: TObject);
begin
  lblRotulo.Font.Height := 12;
end;

procedure TfrmExercicio04.btnTamanho14Click(Sender: TObject);
begin
  lblRotulo.Font.Height := 14;
end;

procedure TfrmExercicio04.btnTamanho18Click(Sender: TObject);
begin
  lblRotulo.Font.Height := 18;
end;

procedure TfrmExercicio04.btnTextoAzulClick(Sender: TObject);
begin
  lblRotulo.Font.Color := clBlue;
end;

procedure TfrmExercicio04.btnTextoVerdeClick(Sender: TObject);
begin
  lblRotulo.Font.Color := clGreen;
end;

procedure TfrmExercicio04.btnTextoVermelhoClick(Sender: TObject);
begin
  lblRotulo.Font.Color := clRed;
end;

procedure TfrmExercicio04.btnTimesNewRomanClick(Sender: TObject);
begin
  lblRotulo.Font.Name := 'Times New Roman';
end;

procedure TfrmExercicio04.btnVerdeClick(Sender: TObject);
begin
  lblRotulo.Color := clGreen;
end;

procedure TfrmExercicio04.btnVermelhoClick(Sender: TObject);
begin
  lblRotulo.Color := clRed;
end;

end.
