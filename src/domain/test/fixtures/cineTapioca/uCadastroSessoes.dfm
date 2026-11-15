inherited fmCadastroSessoes: TfmCadastroSessoes
  Caption = 'Cadastro de Sess'#245'es'
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
      ExplicitLeft = 4
      ExplicitTop = 30
      ExplicitWidth = 716
      ExplicitHeight = 393
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
          Top = 120
          Width = 34
          Height = 19
          Caption = 'Hora'
        end
        object Label3: TLabel
          Left = 6
          Top = 184
          Width = 36
          Height = 19
          Caption = 'Salas'
        end
        object Label4: TLabel
          Left = 6
          Top = 248
          Width = 45
          Height = 19
          Caption = 'Filmes'
        end
        object btSalasRefresh: TSpeedButton
          Left = 323
          Top = 209
          Width = 30
          Height = 27
          Glyph.Data = {
            76010000424D7601000000000000760000002800000020000000100000000100
            04000000000000010000120B0000120B00001000000000000000000000000000
            800000800000008080008000000080008000808000007F7F7F00BFBFBF000000
            FF0000FF000000FFFF00FF000000FF00FF00FFFF0000FFFFFF00555555000005
            5555555555FFFFF5555555550BBBBB0005555555F77777FFF555555BBBBBBBBB
            0055555777777777FF5555BBBBBBBBBBB0055577777777777FF55BBBBBBBBBBB
            BB0557777777777777F55BBBBBB55555BB0057777775555577FFBBBBBB555555
            5BB0777777555555577FBBBBB555555555B57777755555555575BBBB05555555
            55557777F55555555555BBBB0555555555557777F55555555555BBBB05555555
            55557777F555555555555BBB0555555555555777F555555555555BBB00555555
            55555777FF555555555555BBB0055555555555777FF555555555555BBB005555
            5555555777FF5555555555555BB5555555555555577555555555}
          NumGlyphs = 2
          OnClick = btSalasRefreshClick
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
        object tpHora: TDateTimePicker
          Left = 6
          Top = 145
          Width = 137
          Height = 27
          Date = 43384.678463402780000000
          Time = 43384.678463402780000000
          Kind = dtkTime
          TabOrder = 2
        end
        object lkSalas: TDBLookupComboBox
          Left = 6
          Top = 209
          Width = 311
          Height = 27
          DataField = 'SALA'
          DataSource = dsDados
          KeyField = 'ID'
          ListField = 'NOME'
          ListSource = dsSalas
          TabOrder = 3
        end
        object lkFilmes: TDBLookupComboBox
          Left = 6
          Top = 273
          Width = 311
          Height = 27
          DataField = 'FILME'
          DataSource = dsDados
          KeyField = 'ID'
          ListField = 'NOME'
          ListSource = dsFilmes
          TabOrder = 4
        end
      end
    end
  end
  inherited qrDados: TFDQuery
    BeforePost = qrDadosBeforePost
    AfterScroll = qrDadosAfterScroll
    SQL.Strings = (
      'SELECT * FROM SESSOES')
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
    object qrDadosHORA: TTimeField
      DisplayLabel = 'Hora'
      FieldName = 'HORA'
      Origin = 'HORA'
      Required = True
    end
    object qrDadosFILME: TIntegerField
      FieldName = 'FILME'
      Origin = 'FILME'
      Required = True
      Visible = False
    end
    object qrDadosSALA: TIntegerField
      FieldName = 'SALA'
      Origin = 'SALA'
      Required = True
      Visible = False
    end
    object qrDadosFILME_NOME: TStringField
      DisplayLabel = 'Filme'
      FieldKind = fkLookup
      FieldName = 'FILME_NOME'
      LookupDataSet = qrFilmes
      LookupKeyFields = 'ID'
      LookupResultField = 'NOME'
      KeyFields = 'FILME'
      Size = 50
      Lookup = True
    end
    object qrDadosSALA_NOME: TStringField
      DisplayLabel = 'Sala'
      FieldKind = fkLookup
      FieldName = 'SALA_NOME'
      LookupDataSet = qrSalas
      LookupKeyFields = 'ID'
      LookupResultField = 'NOME'
      KeyFields = 'SALA'
      Size = 50
      Lookup = True
    end
  end
  object qrSalas: TFDQuery
    Connection = dmConn.fcConn
    SQL.Strings = (
      'SELECT * FROM SALAS')
    Left = 32
    Top = 288
    object qrSalasID: TIntegerField
      FieldName = 'ID'
      Origin = 'ID'
      ProviderFlags = [pfInUpdate, pfInWhere, pfInKey]
      Required = True
    end
    object qrSalasNOME: TStringField
      FieldName = 'NOME'
      Origin = 'NOME'
      Required = True
      Size = 50
    end
    object qrSalasCAPACIDADE: TIntegerField
      FieldName = 'CAPACIDADE'
      Origin = 'CAPACIDADE'
      Required = True
    end
  end
  object dsSalas: TDataSource
    DataSet = qrSalas
    Left = 32
    Top = 344
  end
  object qrFilmes: TFDQuery
    Connection = dmConn.fcConn
    SQL.Strings = (
      'SELECT * FROM FILMES')
    Left = 88
    Top = 288
    object qrFilmesID: TIntegerField
      FieldName = 'ID'
      Origin = 'ID'
      ProviderFlags = [pfInUpdate, pfInWhere, pfInKey]
      Required = True
    end
    object qrFilmesNOME: TStringField
      FieldName = 'NOME'
      Origin = 'NOME'
      Required = True
      Size = 50
    end
    object qrFilmesDUBLADO: TSmallintField
      FieldName = 'DUBLADO'
      Origin = 'DUBLADO'
      Required = True
    end
    object qrFilmesCLASSIFICADO: TSmallintField
      FieldName = 'CLASSIFICADO'
      Origin = 'CLASSIFICADO'
      Required = True
    end
    object qrFilmesTIPO: TSmallintField
      FieldName = 'TIPO'
      Origin = 'TIPO'
      Required = True
    end
  end
  object dsFilmes: TDataSource
    DataSet = qrFilmes
    Left = 88
    Top = 344
  end
end
