object fmDialogoLogin: TfmDialogoLogin
  Left = 0
  Top = 0
  BorderIcons = [biSystemMenu]
  BorderStyle = bsSingle
  Caption = 'Login'
  ClientHeight = 163
  ClientWidth = 325
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  Position = poScreenCenter
  PixelsPerInch = 96
  TextHeight = 13
  object Label1: TLabel
    Left = 16
    Top = 16
    Width = 25
    Height = 13
    Caption = 'Login'
  end
  object Label2: TLabel
    Left = 16
    Top = 64
    Width = 30
    Height = 13
    Caption = 'Senha'
  end
  object btOk: TButton
    Left = 160
    Top = 128
    Width = 75
    Height = 25
    Caption = 'Ok'
    TabOrder = 0
    OnClick = btOkClick
  end
  object btCancelar: TButton
    Left = 241
    Top = 128
    Width = 75
    Height = 25
    Caption = 'Cancelar'
    TabOrder = 1
    OnClick = btCancelarClick
  end
  object edLogin: TEdit
    Left = 16
    Top = 35
    Width = 289
    Height = 21
    TabOrder = 2
  end
  object edSenha: TEdit
    Left = 16
    Top = 83
    Width = 289
    Height = 21
    PasswordChar = '*'
    TabOrder = 3
  end
  object qrUserExists: TFDQuery
    Connection = dmConn.fcConn
    SQL.Strings = (
      'SELECT LOGIN FROM USUARIOS'
      'WHERE LOGIN = :LOGIN'
      'AND SENHA = :SENHA')
    Left = 32
    Top = 103
    ParamData = <
      item
        Name = 'LOGIN'
        DataType = ftString
        ParamType = ptInput
        Size = 20
      end
      item
        Name = 'SENHA'
        DataType = ftString
        ParamType = ptInput
        Size = 20
      end>
  end
end
