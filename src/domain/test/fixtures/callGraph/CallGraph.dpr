program CallGraph;

uses
  Vcl.Forms,
  UEntidades in 'UEntidades.pas',
  UClientes in 'UClientes.pas',
  URepositorio in 'URepositorio.pas',
  UServicos in 'UServicos.pas',
  UFormPrincipal in 'UFormPrincipal.pas' {FormPrincipal},
  UFormLegado in 'UFormLegado.pas' {FormLegado},
  UQuebrada in 'UQuebrada.pas';

{$R *.res}

begin
  Application.Initialize;
  Inicializar;
  Application.CreateForm(TFormPrincipal, FormPrincipal);
  Application.Run;
end.
