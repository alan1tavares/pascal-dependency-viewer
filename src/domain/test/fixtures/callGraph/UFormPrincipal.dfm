object FormPrincipal: TFormPrincipal
  Left = 0
  Top = 0
  Caption = 'Principal'
  OnCreate = FormCreate
  object Panel1: TPanel
    Left = 0
    Top = 0
    object Button1: TButton
      Left = 8
      Top = 8
      Caption = 'Salvar'
      OnClick = Button1Click
    end
  end
  object Button2: TButton
    Left = 8
    Top = 40
    Caption = 'Outro'
  end
end
