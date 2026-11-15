object fmRelatorioVendasParametros: TfmRelatorioVendasParametros
  Left = 0
  Top = 0
  Caption = 'Relat'#243'rio de Vendas - Par'#226'metros'
  ClientHeight = 189
  ClientWidth = 369
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  PixelsPerInch = 96
  TextHeight = 13
  object pnButtons: TPanel
    Left = 0
    Top = 0
    Width = 369
    Height = 41
    Align = alTop
    TabOrder = 0
    ExplicitLeft = 200
    ExplicitTop = 32
    ExplicitWidth = 185
    object btVisualizar: TButton
      Left = 16
      Top = 8
      Width = 75
      Height = 25
      Caption = 'Visualizar'
      TabOrder = 0
      OnClick = btVisualizarClick
    end
    object btImprimir: TButton
      Left = 96
      Top = 8
      Width = 75
      Height = 25
      Caption = 'Imprimir'
      TabOrder = 1
    end
  end
end
