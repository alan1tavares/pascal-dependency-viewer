program Sample;

uses
  Vcl.Forms,
  UnitPrincipal in 'UnitPrincipal.pas' {FormPrincipal},
  UnitA in 'UnitA.pas',
  UnitB in 'UnitB.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.Run;
end.
