# O main process mantém em cache o índice de chamadas do Project aberto

Até aqui o main process não guardava nenhum estado do Project: o renderer
mantinha `{ projectUnits, projectDir }` e o reenviava a cada expansão. O
Caller Graph, porém, exige analisar com o parser completo (ADR 0006) todas as
Project Units para descobrir quem chama quem — caro demais para refazer a cada
Target Method escolhido. Decidimos que o main process monta esse índice de
chamadas na primeira vez que `Selecionar Método` é usado e o mantém em cache
até que outro Project seja carregado.

O cache não observa mudanças nos arquivos: editar um `.pas` com o app aberto
só se reflete após reabrir o Project. Aceitamos isso porque o app é um
visualizador, usado tipicamente sobre um código que não está sendo editado
naquele momento, e vigiar o sistema de arquivos traria complexidade
(invalidação parcial, reanálise incremental) sem um caso real que a pague.
