object fmSistemaConfiguracoes: TfmSistemaConfiguracoes
  Left = 0
  Top = 0
  Caption = 'Configura'#231#245'es do Sistema'
  ClientHeight = 247
  ClientWidth = 468
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -16
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  OnClose = FormClose
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 19
  object Label1: TLabel
    Left = 16
    Top = 16
    Width = 172
    Height = 19
    Caption = 'Path do Banco de Dados'
  end
  object Label2: TLabel
    Left = 16
    Top = 80
    Width = 54
    Height = 19
    Caption = 'Usu'#225'rio'
  end
  object Label3: TLabel
    Left = 16
    Top = 144
    Width = 43
    Height = 19
    Caption = 'Senha'
  end
  object sbDialog: TSpeedButton
    Left = 422
    Top = 43
    Width = 27
    Height = 27
    Caption = '...'
    OnClick = sbDialogClick
  end
  object Panel1: TPanel
    Left = 0
    Top = 206
    Width = 468
    Height = 41
    Align = alBottom
    TabOrder = 0
    ExplicitLeft = 152
    ExplicitTop = 136
    ExplicitWidth = 185
    object btSalvar: TButton
      Left = 304
      Top = 8
      Width = 75
      Height = 25
      Caption = 'Salvar'
      TabOrder = 0
      OnClick = btSalvarClick
    end
    object btCancelar: TButton
      Left = 384
      Top = 8
      Width = 75
      Height = 25
      Caption = 'Cancelar'
      TabOrder = 1
      OnClick = btCancelarClick
    end
  end
  object edPath: TEdit
    Left = 16
    Top = 43
    Width = 401
    Height = 27
    TabOrder = 1
  end
  object edUsuario: TEdit
    Left = 16
    Top = 107
    Width = 433
    Height = 27
    TabOrder = 2
  end
  object edSenha: TEdit
    Left = 16
    Top = 171
    Width = 433
    Height = 27
    TabOrder = 3
  end
  object odArquivo: TOpenDialog
    FileName = 'CINETAPIOCA.FDB'
    Filter = 'Banco de Dados|*.fdb| Banco de Dados|*.gdb'
    Title = 'Banco de dados'
    Left = 288
    Top = 16
  end
end
