inherited fmCadastroFilmes: TfmCadastroFilmes
  Caption = 'Cadastro de Filmes'
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
        object Id: TLabel
          Left = 6
          Top = 13
          Width = 15
          Height = 19
          Caption = 'Id'
        end
        object Label1: TLabel
          Left = 6
          Top = 69
          Width = 42
          Height = 19
          Caption = 'Nome'
        end
        object Label2: TLabel
          Left = 6
          Top = 125
          Width = 88
          Height = 19
          Caption = 'Classifica'#231#227'o'
        end
        object edId: TDBEdit
          Left = 6
          Top = 32
          Width = 83
          Height = 27
          DataField = 'ID'
          DataSource = dsDados
          TabOrder = 0
        end
        object edNome: TDBEdit
          Left = 6
          Top = 88
          Width = 435
          Height = 27
          DataField = 'NOME'
          DataSource = dsDados
          TabOrder = 1
        end
        object cbClassificacao: TComboBox
          Left = 6
          Top = 148
          Width = 219
          Height = 28
          Style = csOwnerDrawFixed
          ItemHeight = 22
          ItemIndex = 0
          TabOrder = 2
          Text = 'Livre'
          Items.Strings = (
            'Livre'
            '18 anos')
        end
        object rgTipo: TRadioGroup
          Left = 6
          Top = 192
          Width = 185
          Height = 105
          Caption = ' Tipo '
          ItemIndex = 0
          Items.Strings = (
            'Normal'
            '3D')
          TabOrder = 3
        end
        object cbDublado: TCheckBox
          Left = 6
          Top = 320
          Width = 97
          Height = 17
          Caption = 'Dublado?'
          TabOrder = 4
        end
      end
    end
  end
  inherited qrDados: TFDQuery
    BeforePost = qrDadosBeforePost
    AfterScroll = qrDadosAfterScroll
    OnCalcFields = qrDadosCalcFields
    SQL.Strings = (
      'SELECT * FROM FILMES')
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
    object qrDadosDUBLADO: TSmallintField
      DisplayLabel = 'Dublado'
      FieldName = 'DUBLADO'
      Origin = 'DUBLADO'
      Required = True
      Visible = False
    end
    object qrDadosCLASSIFICADO: TSmallintField
      DisplayLabel = 'Classifica'#231#227'o'
      FieldName = 'CLASSIFICADO'
      Origin = 'CLASSIFICADO'
      Required = True
      Visible = False
    end
    object qrDadosTIPO: TSmallintField
      DisplayLabel = 'Tipo'
      FieldName = 'TIPO'
      Origin = 'TIPO'
      Required = True
      Visible = False
    end
    object qrDadosDUBLADO_CF: TStringField
      DisplayLabel = 'Dublado'
      FieldKind = fkCalculated
      FieldName = 'DUBLADO_CF'
      Size = 3
      Calculated = True
    end
    object qrDadosCLASSIFICACAO_CF: TStringField
      DisplayLabel = 'Classifica'#231#227'o'
      FieldKind = fkCalculated
      FieldName = 'CLASSIFICACAO_CF'
      Size = 10
      Calculated = True
    end
    object qrDadosTIPO_CF: TStringField
      DisplayLabel = 'Tipo'
      FieldKind = fkCalculated
      FieldName = 'TIPO_CF'
      Size = 10
      Calculated = True
    end
  end
end
