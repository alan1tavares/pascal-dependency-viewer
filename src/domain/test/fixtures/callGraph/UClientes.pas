unit UClientes;

interface

uses
  UEntidades;

type
  TEndereco = class
  public
    procedure Validar;
  end;

  TCliente = class(TEntidade)
  private
    FEndereco: TEndereco;
  public
    procedure Salvar; override;
    procedure Validar; override;
    function Endereco: TEndereco;
    procedure Gravar;
  end;

  TPedido = class
  private
    FCliente: TCliente;
  public
    procedure Salvar;
    function Cliente: TCliente;
    property Dono: TCliente read FCliente;
  end;

function Fatorial(N: Integer): Integer;
procedure Ping(N: Integer);
procedure Pong(N: Integer);

implementation

procedure TEndereco.Validar;
begin
end;

procedure TCliente.Salvar;
begin
  inherited;
  Endereco.Validar;
end;

procedure TCliente.Validar;
begin
end;

function TCliente.Endereco: TEndereco;
begin
  Result := FEndereco;
end;

procedure TCliente.Gravar;
begin
  Salvar;
end;

procedure TPedido.Salvar;
begin
  {$IFDEF MSWINDOWS}
  Cliente.Salvar;
  {$ELSE}
  Dono.Gravar;
  {$ENDIF}
end;

function TPedido.Cliente: TCliente;
begin
  Result := FCliente;
end;

function Fatorial(N: Integer): Integer;
begin
  if N <= 1 then
    Result := 1
  else
    Result := N * Fatorial(N - 1);
end;

procedure Ping(N: Integer);
begin
  if N > 0 then
    Pong(N - 1);
end;

procedure Pong(N: Integer);
begin
  if N > 0 then
    Ping(N - 1);
end;

end.
