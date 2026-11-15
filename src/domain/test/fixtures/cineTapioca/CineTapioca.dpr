program CineTapioca;

uses
  Vcl.Forms,
  Vcl.Controls,
  uPrincipal in 'uPrincipal.pas' {fmPrincipal},
  uCadastroBase in 'uCadastroBase.pas' {fmCadastroBase},
  uDmConn in 'uDmConn.pas' {dmConn: TDataModule},
  uCadastroSalas in 'uCadastroSalas.pas' {fmCadastroSalas},
  uSystemUtils in 'uSystemUtils.pas',
  uCadastroProdutos in 'uCadastroProdutos.pas' {fmCadastroProdutos},
  uCadastroFilmes in 'uCadastroFilmes.pas' {fmCadastroFilmes},
  uCadastroSessoes in 'uCadastroSessoes.pas' {fmCadastroSessoes},
  uMovimentoVendas in 'uMovimentoVendas.pas' {fmMovimentoVendas},
  uRelatorioVendas in 'uRelatorioVendas.pas' {fmRelatorioVendas},
  uRelatorioVendasParametros in 'uRelatorioVendasParametros.pas' {fmRelatorioVendasParametros},
  uCadastroUsuarios in 'uCadastroUsuarios.pas' {fmCadastroUsuarios},
  uDialogoLogin in 'uDialogoLogin.pas' {fmDialogoLogin},
  uSistemaConfiguracoes in 'uSistemaConfiguracoes.pas' {fmSistemaConfiguracoes};

{$R *.res}

begin
  Application.Initialize;
  Application.MainFormOnTaskbar := True;
  Application.Title := 'Cine Tapioca';

  Application.CreateForm(TdmConn, dmConn);

  if not(dmConn.Conecta) then
  begin
    fmSistemaConfiguracoes := TfmSistemaConfiguracoes.Create(nil);
    try
      fmSistemaConfiguracoes.FormStyle := fsNormal;
      fmSistemaConfiguracoes.Visible := false;
      fmSistemaConfiguracoes.ShowModal;
    finally
      fmSistemaConfiguracoes.Free;
    end;
  end;

  Application.CreateForm(TfmDialogoLogin, fmDialogoLogin);

  if fmDialogoLogin.ShowModal = mrOk then
  begin
    fmDialogoLogin.Free;
    Application.CreateForm(TfmPrincipal, fmPrincipal);
    Application.Run;
  end
  else
    Application.Terminate;
end.
