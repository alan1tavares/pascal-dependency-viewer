inherited fmCadastroProdutos: TfmCadastroProdutos
  Caption = 'Cadastro de Produtos'
  PixelsPerInch = 96
  TextHeight = 19
  inherited pcPrincipal: TPageControl
    inherited tsDados: TTabSheet
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
    end
    inherited tsEdit: TTabSheet
      inherited pnEdits: TPanel
        object Label1: TLabel
          Left = 0
          Top = 8
          Width = 15
          Height = 19
          Caption = 'Id'
          FocusControl = edId
        end
        object Label2: TLabel
          Left = 0
          Top = 54
          Width = 42
          Height = 19
          Caption = 'Nome'
          FocusControl = edNome
        end
        object Label3: TLabel
          Left = 0
          Top = 100
          Width = 39
          Height = 19
          Caption = 'Pre'#231'o'
          FocusControl = edPreco
        end
        object Label4: TLabel
          Left = 0
          Top = 146
          Width = 114
          Height = 19
          Caption = 'C'#243'digo de Barra'
          FocusControl = edBarra
        end
        object edId: TDBEdit
          Left = 0
          Top = 27
          Width = 134
          Height = 27
          DataField = 'ID'
          DataSource = dsDados
          TabOrder = 0
        end
        object edNome: TDBEdit
          Left = 0
          Top = 73
          Width = 553
          Height = 27
          DataField = 'NOME'
          DataSource = dsDados
          TabOrder = 1
        end
        object edPreco: TDBEdit
          Left = 0
          Top = 119
          Width = 134
          Height = 27
          DataField = 'PRECO'
          DataSource = dsDados
          TabOrder = 2
        end
        object edBarra: TDBEdit
          Left = 0
          Top = 165
          Width = 489
          Height = 27
          DataField = 'BARRA'
          DataSource = dsDados
          TabOrder = 3
        end
      end
    end
  end
  inherited qrDados: TFDQuery
    SQL.Strings = (
      'SELECT * FROM PRODUTOS')
    object qrDadosID: TFDAutoIncField
      DisplayLabel = 'Id'
      FieldName = 'ID'
      ReadOnly = True
    end
    object qrDadosNOME: TStringField
      DisplayLabel = 'Nome'
      FieldName = 'NOME'
      Origin = 'NOME'
      Required = True
      Size = 50
    end
    object qrDadosPRECO: TBCDField
      DefaultExpression = '0'
      DisplayLabel = 'Pre'#231'o'
      FieldName = 'PRECO'
      Origin = 'PRECO'
      Required = True
      DisplayFormat = ',0.00'
      Precision = 18
      Size = 2
    end
    object qrDadosBARRA: TStringField
      DisplayLabel = 'Barra'
      FieldName = 'BARRA'
      Origin = 'BARRA'
      Size = 30
    end
  end
end
