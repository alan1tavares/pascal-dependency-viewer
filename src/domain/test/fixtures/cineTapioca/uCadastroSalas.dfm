inherited fmCadastroSalas: TfmCadastroSalas
  Caption = 'Cadastro de Salas'
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
          Top = 61
          Width = 42
          Height = 19
          Caption = 'Nome'
        end
        object Label2: TLabel
          Left = 6
          Top = 109
          Width = 88
          Height = 19
          Caption = 'Capaciadade'
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
          Top = 80
          Width = 435
          Height = 27
          DataField = 'NOME'
          DataSource = dsDados
          TabOrder = 1
        end
        object edCapacidade: TDBEdit
          Left = 6
          Top = 128
          Width = 62
          Height = 27
          DataField = 'CAPACIDADE'
          DataSource = dsDados
          TabOrder = 2
        end
      end
    end
  end
  inherited qrDados: TFDQuery
    SQL.Strings = (
      'SELECT * FROM SALAS')
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
    object qrDadosCAPACIDADE: TIntegerField
      DisplayLabel = 'Capacidade'
      FieldName = 'CAPACIDADE'
      Origin = 'CAPACIDADE'
      Required = True
    end
  end
end
