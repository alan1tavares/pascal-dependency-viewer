inherited fmCadastroUsuarios: TfmCadastroUsuarios
  Caption = 'Cadastro de Usu'#225'rios'
  PixelsPerInch = 96
  TextHeight = 19
  inherited pcPrincipal: TPageControl
    inherited tsEdit: TTabSheet
      ExplicitLeft = 4
      ExplicitTop = 30
      ExplicitWidth = 716
      ExplicitHeight = 393
      inherited pnEdits: TPanel
        object Label1: TLabel
          Left = 6
          Top = 8
          Width = 54
          Height = 19
          Caption = 'Usu'#225'rio'
          FocusControl = edUser
        end
        object Label2: TLabel
          Left = 6
          Top = 72
          Width = 42
          Height = 19
          Caption = 'Nome'
          FocusControl = edNome
        end
        object Label3: TLabel
          Left = 6
          Top = 136
          Width = 43
          Height = 19
          Caption = 'Senha'
        end
        object edUser: TDBEdit
          Left = 6
          Top = 32
          Width = 195
          Height = 27
          DataField = 'LOGIN'
          DataSource = dsDados
          TabOrder = 0
        end
        object edNome: TDBEdit
          Left = 6
          Top = 96
          Width = 435
          Height = 27
          DataField = 'NOME'
          DataSource = dsDados
          TabOrder = 1
        end
        object edSenha: TEdit
          Left = 6
          Top = 161
          Width = 195
          Height = 27
          PasswordChar = '*'
          TabOrder = 2
        end
      end
    end
  end
  inherited qrDados: TFDQuery
    BeforePost = qrDadosBeforePost
    AfterScroll = qrDadosAfterScroll
    Connection = dmConn.fcConn
    SQL.Strings = (
      'SELECT * FROM USUARIOS')
    object qrDadosLOGIN: TStringField
      DisplayLabel = 'Login'
      FieldName = 'LOGIN'
      Origin = 'LOGIN'
      ProviderFlags = [pfInUpdate, pfInWhere, pfInKey]
      Required = True
    end
    object qrDadosNOME: TStringField
      DisplayLabel = 'Nome'
      FieldName = 'NOME'
      Origin = 'NOME'
      Required = True
      Size = 50
    end
    object qrDadosSENHA: TStringField
      FieldName = 'SENHA'
      Origin = 'SENHA'
      Required = True
      Visible = False
    end
  end
  object qrUserExists: TFDQuery
    Connection = dmConn.fcConn
    SQL.Strings = (
      'SELECT LOGIN FROM USUARIOS'
      'WHERE LOGIN = :LOGIN')
    Left = 32
    Top = 256
    ParamData = <
      item
        Name = 'LOGIN'
        ParamType = ptInput
      end>
  end
end
