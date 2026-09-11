## Why

O `CONTEXT.md` já descreve os conceitos de **Project** (`.dpr`) e **Project Unit**
(entrada `uses` com `in 'path'`), e a ADR `0001-dpr-as-project-source.md` já
justificou usar o `.dpr` como fonte — mas nenhum código lê esse arquivo ainda.
Sem um parser que extraia o mapa `unit → path` do `.dpr`, nenhuma das
funcionalidades que dependem de "Projeto" (seleção de Root Unit, expansão
transitiva do grafo, distinção Project Unit vs External Unit) tem uma base
para ser construída. Este change entrega essa base isoladamente.

## What Changes

- Novo parser `parseDprSource` (camada `src/model`, sem dependências do
  Electron, seguindo o padrão de `parsePascalSource`) que recebe o conteúdo
  textual de um `.dpr` e retorna a lista de **Project Units**: pares
  `{ unitName, path }`.
- O parser reconhece apenas entradas `UnitName in 'path/To/File.pas'` dentro
  da cláusula `uses` do `.dpr`; entradas sem `in 'path'` (unidades RTL/VCL)
  são ignoradas — elas não são Project Units.
- Fora de escopo neste change: ler o `.dpr` a partir do menu do Electron,
  tela de busca/seleção de Root Unit, expansão do grafo, e qualquer UI. Este
  change entrega só a função de parsing e seus testes.

## Capabilities

### New Capabilities
- `dpr-project-parsing`: extrair a lista de Project Units (unidade + caminho
  do arquivo) a partir do conteúdo de um arquivo `.dpr`.

### Modified Capabilities
_Nenhuma — não há specs existentes sendo alteradas._

## Impact

- Código novo: `src/model/parseDprSource/` (implementação + testes),
  seguindo a mesma convenção de `src/model/parsePascalSource/`.
- Nenhum arquivo existente é alterado; nenhuma dependência nova é
  necessária (regex, igual ao restante do parsing do projeto).
- Não afeta `src/components` (Electron) nem `index.html` neste change.
