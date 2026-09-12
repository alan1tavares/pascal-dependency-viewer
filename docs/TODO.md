# TODO — próximos passos (exploração de 2026-09-11)

Registro da sessão de `/opsx:explore` que revisou o `CONTEXT.md` e mapeou o
que falta implementar. Nenhuma decisão foi tomada aqui — são trilhas em
aberto para retomar depois.

## Estado atual

```
Fluxo File > Open (único que existe de ponta a ponta)

  .pas ──▶ getUnitName + selectUsesFromSource
              │
              ▼
  mountDependenceGraphStructure (1 nível só)
              │
              ▼
  electron-store ──▶ index.html (vis-network)


parseDprSource — existe, testado, mas órfão

  .dpr ──▶ parseDprSource ──▶ [{unitName, path}, ...]
                                    │
                                    ▼
                              (nada consome isso ainda)
```

`parseDprSource` foi entregue isoladamente pela change
`2026-09-11-parse-dpr-project-units` (arquivada), que já deixou
explicitamente fora de escopo: ligar o `.dpr` ao menu, tela de Root Unit e
expansão do grafo.

## Gap entre o `CONTEXT.md` e o código

| Conceito no `CONTEXT.md` | Situação |
|---|---|
| **Project** / **Project Unit** | ✅ `parseDprSource` extrai isso |
| **Root Unit** (escolhida numa tela de busca/listagem) | ❌ não existe tela nenhuma de seleção — só `File > Open` avulso |
| **External Unit** (leaf node, estilo visual distinto) | ❌ `mountDependenceGraphStructure` não distingue nada — todo nó é igual |
| **Dependency Graph** (expansão transitiva, DAG, unidade visitada uma vez) | ❌ hoje só existe 1 nível (unidade + seus `uses` diretos), sem recursão nem dedup |
| **Uses Clause Scope** (`interface` só vs `interface`+`implementation`) | ❌ `selectUsesFromSource` pega a primeira cláusula `uses` que encontrar, sem diferenciar seção |

## Trilhas abertas

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Seleção   │     │ 2. Expansão   │     │ 3. Uses Scope │
│  de Root Unit│ ──▶ │  do grafo     │ ◀── │  (interface x │
│  (UI + .dpr) │     │  (DAG, model) │     │  impl.)       │
└──────────────┘     └──────────────┘     └──────────────┘
        ↑ mais visível          ↑ mais "motor"      ↑ mais fundação
```

1. **Fechar o próximo elo da corrente: menu → seleção de Root Unit.**
   Pegar `parseDprSource`, ler um `.dpr` pelo menu, listar as Project Units
   numa tela de busca, usuário escolhe a Root Unit. Não exige resolver
   expansão transitiva nem External Unit ainda — entrega algo visível
   rápido.

2. **Ir direto para o algoritmo de expansão (Dependency Graph).**
   Caminhar recursivamente pelos `uses`, distinguir Project Unit de External
   Unit, montar um DAG deduplicado (unidade revisitada vira edge de volta,
   não subtree nova). Dá pra desenvolver e testar isolado em `src/model`,
   sem UI — segue o padrão de lógica pura primeiro que o projeto já usa.

3. **Resolver o Uses Clause Scope antes de tudo.**
   Afeta tanto o parsing de `.pas` quanto a futura expansão do grafo —
   `selectUsesFromSource` precisaria diferenciar `interface`/`implementation`
   primeiro, senão a expansão herda a ambiguidade atual.

Nenhuma trilha depende estritamente das outras para *começar* — dependem
umas das outras só para o fluxo ficar completo ponta a ponta. Também ficou
em aberto: a distinção visual de External Unit no grafo (estilo do nó).

## Próximo passo sugerido

Quando uma trilha for escolhida, abrir uma change no OpenSpec
(`openspec/changes/`) para ela, seguindo o padrão da
`parse-dpr-project-units` já arquivada.
