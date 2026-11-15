object fmCadastroBase: TfmCadastroBase
  Left = 0
  Top = 0
  Caption = 'fmCadastroBase'
  ClientHeight = 427
  ClientWidth = 724
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -16
  Font.Name = 'Tahoma'
  Font.Style = []
  FormStyle = fsMDIChild
  KeyPreview = True
  OldCreateOrder = False
  Visible = True
  OnClose = FormClose
  OnKeyDown = FormKeyDown
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 19
  object pcPrincipal: TPageControl
    Left = 0
    Top = 0
    Width = 724
    Height = 427
    ActivePage = tsEdit
    Align = alClient
    TabOrder = 0
    object tsDados: TTabSheet
      Caption = 'tsDados'
      object pnDadosNavigator: TPanel
        Left = 0
        Top = 352
        Width = 716
        Height = 41
        Align = alBottom
        BevelOuter = bvNone
        TabOrder = 0
        DesignSize = (
          716
          41)
        object nvDados: TDBNavigator
          Left = 539
          Top = 5
          Width = 168
          Height = 29
          DataSource = dsDados
          VisibleButtons = [nbFirst, nbPrior, nbNext, nbLast]
          Anchors = [akTop, akRight]
          Hints.Strings = (
            'Primeiro registro'
            'Registro anterior'
            'Pr'#243'ximo registro'
            #218'ltimo registro')
          ParentShowHint = False
          ShowHint = True
          TabOrder = 0
        end
      end
      object grDados: TDBGrid
        Left = 145
        Top = 0
        Width = 571
        Height = 352
        Align = alClient
        DataSource = dsDados
        Options = [dgTitles, dgIndicator, dgColumnResize, dgColLines, dgRowLines, dgTabs, dgTitleClick, dgTitleHotTrack]
        ReadOnly = True
        TabOrder = 1
        TitleFont.Charset = DEFAULT_CHARSET
        TitleFont.Color = clWindowText
        TitleFont.Height = -16
        TitleFont.Name = 'Tahoma'
        TitleFont.Style = []
      end
      object pnDadosButtons: TPanel
        Left = 0
        Top = 0
        Width = 145
        Height = 352
        Align = alLeft
        BevelOuter = bvNone
        TabOrder = 2
        object btInserir: TButton
          Left = 8
          Top = 8
          Width = 121
          Height = 33
          Caption = 'Inserir (F2)'
          TabOrder = 0
          OnClick = btInserirClick
        end
        object btEditar: TButton
          Left = 8
          Top = 47
          Width = 121
          Height = 33
          Caption = 'Editar (F3)'
          TabOrder = 1
          OnClick = btEditarClick
        end
        object btDeletar: TButton
          Left = 8
          Top = 86
          Width = 121
          Height = 33
          Caption = 'Deletar (F4)'
          TabOrder = 2
          OnClick = btDeletarClick
        end
      end
    end
    object tsEdit: TTabSheet
      Caption = 'tsEdit'
      ImageIndex = 1
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
      object pnEdits: TPanel
        Left = 145
        Top = 0
        Width = 571
        Height = 393
        Align = alClient
        BevelOuter = bvNone
        TabOrder = 0
      end
      object pnEditButtons: TPanel
        Left = 0
        Top = 0
        Width = 145
        Height = 393
        Align = alLeft
        BevelOuter = bvNone
        TabOrder = 1
        object btSalvar: TButton
          Left = 8
          Top = 8
          Width = 121
          Height = 33
          Caption = 'Salvar (F9)'
          TabOrder = 0
          OnClick = btSalvarClick
        end
        object btCancelar: TButton
          Left = 8
          Top = 47
          Width = 121
          Height = 33
          Caption = 'Cancelar (ESC)'
          TabOrder = 1
          OnClick = btCancelarClick
        end
      end
    end
  end
  object qrDados: TFDQuery
    Connection = dmConn.fcConn
    Left = 32
    Top = 144
  end
  object dsDados: TDataSource
    DataSet = qrDados
    Left = 32
    Top = 200
  end
end
