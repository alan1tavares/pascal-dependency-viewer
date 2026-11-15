object dmConn: TdmConn
  OldCreateOrder = False
  OnDestroy = DataModuleDestroy
  Height = 193
  Width = 298
  object fcConn: TFDConnection
    Params.Strings = (
      'Database=127.0.0.1:C:\Projetos\CineTapioca\CINETAPIOCA.FDB'
      'User_Name=sysdba'
      'Password=masterkey'
      'DriverID=FB')
    LoginPrompt = False
    Left = 136
    Top = 80
  end
end
