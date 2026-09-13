# TODO — próximos passos

Registro de sessões de `/opsx:explore` que revisaram o `CONTEXT.md` e
mapearam o que falta implementar. Nenhuma decisão foi tomada aqui — são
trilhas em aberto para retomar depois.

## Estado atual

```
Fluxo File > Open (.pas avulso)

  .pas ──▶ getUnitName + selectUsesFromSource (scope 'interface', fixo)
              │
              ▼
  mountDependenceGraphStructure (1 nível só)
              │
              ▼
  electron-store ──▶ index.html (vis-network)


Fluxo Open Project (.dpr) → Root Unit

  .dpr ──▶ parseDprSource ──▶ tela de busca/listagem ──▶ clique numa Project Unit
                                                                │
                                                                ▼
                                    mountDependenceGraphStructure (1 nível só)  ← ainda aqui
                                                                │
                                                                ▼
                                    electron-store ──▶ index.html (vis-network)


expandDependencyGraph — existe, testado (DAG deduplicado, recursivo), órfão

  rootUnitName + projectUnits + readFile ──▶ expandDependencyGraph ──▶ { nodes, edges }
                                                    │
                                                    ▼
                                    (nada na UI chama isso ainda)
```

`expandDependencyGraph` (change `2026-09-12-expand-dependency-graph`,
arquivada) e o parâmetro `scope` de `selectUsesFromSource` (change
`2026-09-12-uses-clause-scope`, arquivada) foram entregues isoladamente no
model layer, cada um explicitando "fora de escopo: ligar à UI" no próprio
proposal.

## Gap entre o `CONTEXT.md` e o código

| Conceito no `CONTEXT.md` | Situação |
|---|---|
| **Dependency Graph** (expansão transitiva, DAG, unidade visitada uma vez) | ⚠️ implementado e testado em `expandDependencyGraph`, mas `index.html` (`selectRootUnit`) ainda chama `mountDependenceGraphStructure` — a seleção de Root Unit continua entregando só 1 nível. O spec `root-unit-selection` ainda documenta "grafo de 1 nível" como requisito SHALL, desatualizado em relação à capability `dependency-graph-expansion` que já existe |
| **Uses Clause Scope** (`interface` só vs `interface`+`implementation`, "escolhido por geração na tela de busca/listagem") | ⚠️ `selectUsesFromSource(source, scope)` existe e está correto, mas nenhum call site passa `scope` (nem `Menu/index.js`, nem `index.html`, nem `expandDependencyGraph` internamente) e não existe controle nenhum na tela `rootUnitSelection` para escolher isso |

Os demais conceitos (Project, Project Unit, Root Unit, External Unit) estão
implementados e ligados de ponta a ponta.

## Trilha aberta: ligar `expandDependencyGraph` + `scope` à tela de Root Unit

Puxado em sessão de `/opsx:explore` de 2026-09-13. A mudança é pequena em
assinatura (repassar `scope` até `selectUsesFromSource` dentro do laço de
`expandDependencyGraph`; trocar a chamada em `index.html` por
`expandDependencyGraph` com um `readFile` injetado que resolve caminho a
partir de `projectDir`), mas exige atualizar o spec `root-unit-selection`
(de "1 nível" para "Dependency Graph completo") e decidir a UI do seletor
de escopo (radio buttons na tela `rootUnitSelection`, estado local — não
persistido, conforme o `CONTEXT.md`).

Consequências a ter em mente quando essa trilha for retomada:

- **Trocar de escopo exige nova seleção de Root Unit.** Como a tela de
  listagem é abandonada assim que o grafo renderiza, não existe
  "regenerar com outro escopo" sem voltar ao `Open Project` — coerente
  com "not a persisted global setting" do `CONTEXT.md`, mas vale
  confirmar que é o comportamento desejado antes de implementar.
- **Leitura síncrona de N arquivos a cada clique.** `expandDependencyGraph`
  lê um `.pas` por Project Unit alcançável, de forma síncrona, na thread
  do renderer. Aceitável para o porte típico de projeto Pascal (dezenas de
  units), mas passa a acontecer de verdade a cada seleção de Root Unit em
  vez de só em teste — primeira vez que esse trade-off (já aceito no
  design doc de `expand-dependency-graph`) encontra um usuário real.

## Próximo passo sugerido

Abrir uma change no OpenSpec (`openspec/changes/`) para essa trilha,
marcando `root-unit-selection` como Modified Capability.
