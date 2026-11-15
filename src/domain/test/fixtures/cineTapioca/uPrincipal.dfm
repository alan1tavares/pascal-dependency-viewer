object fmPrincipal: TfmPrincipal
  Left = 0
  Top = 0
  Caption = 'CineTapioca - v 0.1'
  ClientHeight = 543
  ClientWidth = 887
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  FormStyle = fsMDIForm
  Menu = mmPrincipal
  OldCreateOrder = False
  WindowState = wsMaximized
  PixelsPerInch = 96
  TextHeight = 13
  object stPrincipal: TStatusBar
    Left = 0
    Top = 524
    Width = 887
    Height = 19
    Panels = <>
    SimplePanel = True
    SimpleText = '   Sistema para gerenciamento de cinemas'
  end
  object tbPrincipal: TToolBar
    Left = 0
    Top = 0
    Width = 887
    Height = 29
    Caption = 'tbPrincipal'
    TabOrder = 1
    object ToolButton1: TToolButton
      Left = 0
      Top = 0
      Caption = 'ToolButton1'
      ImageIndex = 0
    end
    object ToolButton2: TToolButton
      Left = 23
      Top = 0
      Caption = 'ToolButton2'
      ImageIndex = 1
    end
  end
  object mmPrincipal: TMainMenu
    Left = 64
    Top = 96
    object Cadastros1: TMenuItem
      Caption = 'Cadastros'
      object Salas1: TMenuItem
        Caption = 'Salas'
        OnClick = Salas1Click
      end
      object Filmes1: TMenuItem
        Caption = 'Filmes'
        OnClick = Filmes1Click
      end
      object Sesses1: TMenuItem
        Caption = 'Sess'#245'es'
        OnClick = Sesses1Click
      end
      object Produtos1: TMenuItem
        Caption = 'Produtos'
        OnClick = Produtos1Click
      end
      object N1: TMenuItem
        Caption = '-'
      end
      object Usurios1: TMenuItem
        Caption = 'Usu'#225'rios'
        OnClick = Usurios1Click
      end
      object Sair1: TMenuItem
        Caption = 'Sair'
      end
    end
    object Movimentos1: TMenuItem
      Caption = 'Movimentos'
      object Vendas1: TMenuItem
        Caption = 'Vendas'
        OnClick = Vendas1Click
      end
    end
    object Relatrios1: TMenuItem
      Caption = 'Relat'#243'rios'
      object Vendas2: TMenuItem
        Caption = 'Vendas'
        OnClick = Vendas2Click
      end
    end
    object Configuraes1: TMenuItem
      Caption = 'Configura'#231#245'es'
      OnClick = Configuraes1Click
    end
  end
end
