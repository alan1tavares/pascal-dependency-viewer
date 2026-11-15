object fmRelatorioVendas: TfmRelatorioVendas
  Left = 0
  Top = 0
  Caption = 'fmRelatorioVendas'
  ClientHeight = 456
  ClientWidth = 876
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  PixelsPerInch = 96
  TextHeight = 13
  object RLReport1: TRLReport
    Left = 40
    Top = 8
    Width = 794
    Height = 1123
    DataSource = dsVendas
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clBlack
    Font.Height = -13
    Font.Name = 'Arial'
    Font.Style = []
    object RLBand1: TRLBand
      Left = 38
      Top = 38
      Width = 718
      Height = 40
      BandType = btTitle
      object RLLabel1: TRLLabel
        Left = 240
        Top = 3
        Width = 254
        Height = 32
        Caption = 'Relat'#243'rio de Vendas'
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clBlack
        Font.Height = -27
        Font.Name = 'Arial'
        Font.Style = []
        ParentFont = False
      end
      object RLSystemInfo1: TRLSystemInfo
        Left = 600
        Top = 11
        Width = 39
        Height = 16
        Text = ''
      end
    end
    object RLGroup1: TRLGroup
      Left = 38
      Top = 78
      Width = 718
      Height = 48
      DataFields = 'ID'
      object RLBand2: TRLBand
        Left = 0
        Top = 0
        Width = 718
        Height = 21
        BandType = btColumnHeader
        Borders.Sides = sdCustom
        Borders.DrawLeft = True
        Borders.DrawTop = True
        Borders.DrawRight = True
        Borders.DrawBottom = True
        object RLLabel2: TRLLabel
          Left = 8
          Top = 1
          Width = 20
          Height = 16
          Caption = 'ID:'
        end
        object RLDBText1: TRLDBText
          Left = 31
          Top = 1
          Width = 16
          Height = 16
          DataField = 'ID'
          DataSource = dsVendas
          Text = ''
        end
        object RLLabel3: TRLLabel
          Left = 64
          Top = 1
          Width = 35
          Height = 16
          Caption = 'Data:'
        end
        object RLDBText2: TRLDBText
          Left = 103
          Top = 1
          Width = 38
          Height = 16
          DataField = 'DATA'
          DataSource = dsVendas
          Text = ''
        end
      end
      object RLBand3: TRLBand
        Left = 0
        Top = 21
        Width = 718
        Height = 23
        object RLLabel4: TRLLabel
          Left = 64
          Top = 4
          Width = 59
          Height = 16
          Caption = 'Cadeiras:'
        end
        object RLDBText3: TRLDBText
          Left = 127
          Top = 4
          Width = 61
          Height = 16
          DataField = 'CADEIRA'
          DataSource = dsVendas
          Text = ''
        end
      end
    end
  end
  object qrVendas: TFDQuery
    Active = True
    Connection = dmConn.fcConn
    SQL.Strings = (
      'SELECT VE.ID, VE.DATA, VI.CADEIRA'
      'FROM VENDAS_ITENS VI'
      'INNER JOIN VENDAS VE ON VE.ID = VI.VENDA_ID'
      'ORDER BY VE.ID')
    Left = 432
    Top = 232
    object qrVendasID: TIntegerField
      FieldName = 'ID'
      Origin = 'ID'
      ProviderFlags = [pfInUpdate, pfInWhere, pfInKey]
      Required = True
    end
    object qrVendasDATA: TDateField
      FieldName = 'DATA'
      Origin = '"DATA"'
      Required = True
    end
    object qrVendasCADEIRA: TIntegerField
      FieldName = 'CADEIRA'
      Origin = 'CADEIRA'
      Required = True
    end
  end
  object dsVendas: TDataSource
    DataSet = qrVendas
    Left = 432
    Top = 288
  end
end
