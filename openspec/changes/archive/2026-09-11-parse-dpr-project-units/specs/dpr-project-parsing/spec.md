## ADDED Requirements

### Requirement: Extração de Project Units a partir de um `.dpr`
O sistema SHALL fornecer uma função que recebe o conteúdo textual de um
arquivo `.dpr` e retorna a lista de Project Units declaradas na cláusula
`uses` do projeto, cada uma como um par `{ unitName, path }`.

#### Scenario: `.dpr` com múltiplas Project Units
- **WHEN** o conteúdo do `.dpr` contém uma cláusula `uses` com entradas
  `UnitA in 'UnitA.pas'` e `UnitB in 'src\UnitB.pas'`
- **THEN** a função retorna `[{ unitName: 'UnitA', path: 'UnitA.pas' }, { unitName: 'UnitB', path: 'src\UnitB.pas' }]`

#### Scenario: Nome da unit preserva a grafia original
- **WHEN** a entrada na cláusula `uses` é `UnitDeCadastro in 'UnitDeCadastro.pas'`
- **THEN** `unitName` no resultado é exatamente `'UnitDeCadastro'`, sem alteração de maiúsculas/minúsculas

### Requirement: Exclusão de entradas sem caminho de arquivo
Uma entrada da cláusula `uses` do `.dpr` que não tem a forma `in 'path'`
(unidades RTL/VCL/de terceiros referenciadas pelo projeto, mas sem arquivo
próprio) NÃO é uma Project Unit e SHALL ser omitida do resultado.

#### Scenario: Mistura de entradas com e sem `in 'path'`
- **WHEN** a cláusula `uses` do `.dpr` contém `Vcl.Forms,` seguida de
  `UnitA in 'UnitA.pas'`
- **THEN** o resultado contém apenas a Project Unit `UnitA`; `Vcl.Forms` não
  aparece na lista retornada

### Requirement: Tolerância ao comentário de formulário após o path
Entradas geradas pela IDE do Delphi para units de formulário costumam vir
seguidas de um comentário de bloco com o nome da form, no formato
`UnitA in 'UnitA.pas' {Form1}`. O parser SHALL reconhecer essas entradas
normalmente, ignorando o comentário `{...}` para fins de extração do
`unitName` e do `path`.

#### Scenario: Entrada de unit de formulário com comentário
- **WHEN** a entrada na cláusula `uses` é `UnitPrincipal in 'UnitPrincipal.pas' {FormPrincipal}`
- **THEN** o resultado contém `{ unitName: 'UnitPrincipal', path: 'UnitPrincipal.pas' }`, sem o texto `{FormPrincipal}`
