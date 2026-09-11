## Context

O `CLAUDE.md` descreve o parsing atual (`src/model/parsePascalSource`) como
regex-based, sem AST/tokenizer — `selectUsesFromSource` extrai a cláusula
`uses` de um `.pas` com uma única regex e `getUnitName` faz o mesmo para o
`unit Name;`. A ADR `0001-dpr-as-project-source.md` já decidiu que a fonte de
"Project" é o `.dpr`, e que sua cláusula `uses` traz cada Project Unit no
formato `UnitA in 'UnitA.pas'`. Este design escolhe como extrair esse mapa
mantendo a mesma filosofia leve já usada no restante do projeto.

## Goals / Non-Goals

**Goals:**
- Extrair de um `.dpr` a lista de Project Units (`unitName` + `path`),
  reconhecendo o formato real gerado pela IDE do Delphi, incluindo o
  comentário de form (`{FormX}`) que acompanha units de formulário.
- Seguir a convenção de módulo já estabelecida em `src/model/parsePascalSource`
  (função pura, sem dependência de Electron, testável com fixtures em
  `src/test/`).

**Non-Goals:**
- Ler o `.dpr` do disco ou integrar com o menu do Electron (fica para um
  change futuro que conecte este parser à seleção de Root Unit).
- Resolver/normalizar o `path` (caminhos relativos, separadores `\` vs `/`,
  existência do arquivo) — o parser apenas repassa a string do jeito que
  aparece no `.dpr`.
- Suportar `.dproj`, `.groupproj`, ou diretivas condicionais (`{$IFDEF}`)
  dentro da cláusula `uses` — mesma exclusão de escopo já registrada na ADR.
- Corrigir a limitação conhecida de "só lê a primeira cláusula `uses`
  encontrada" — um `.dpr` só tem uma cláusula `uses` (a do `program`), então
  essa limitação do padrão existente não é um problema aqui.

## Decisions

**Regex-based extraction, mesmo estilo de `selectUsesFromSource`.**
Alternativa considerada: usar um parser/tokenizer de Pascal completo (ex.
alguma lib de terceiros). Rejeitado porque o projeto inteiro já assume
parsing leve via regex como trade-off aceito (documentado no `CLAUDE.md`), e
introduzir uma dependência de parsing completo só para o `.dpr` quebraria
essa consistência sem necessidade — o formato de interesse (`Nome in
'caminho'`) é simples e regular.

**Módulo novo `src/model/parseDprSource`, função única `parseDprSource(source)`.**
Diferente de `parsePascalSource` (que agrega duas funções, `getUnitName` e
`selectUsesFromSource`, via `index.js`), aqui basta uma função: não há um
"nome do program" a extrair para os requisitos deste change. Se um change
futuro precisar do nome do `program`, adiciona-se então, replicando o padrão
de `getUnitName`.

**Regex captura `Identifier in 'path'` ignorando um comentário `{...}` opcional.**
Formato-alvo: `\b([\w.]+)\s+in\s+'([^']+)'(?:\s*\{[^}]*\})?`. Isso cobre tanto
`UnitA in 'UnitA.pas'` quanto `UnitA in 'UnitA.pas' {Form1}`, e ignora
qualquer entrada da `uses` que não tenha `in '...'` (unidades RTL/VCL),
satisfazendo o requisito de exclusão sem precisar de um segundo passo de
filtragem.

**Delimitação da cláusula `uses`: do `uses` ao primeiro `;`, igual ao padrão existente.**
Reaproveita a mesma abordagem de `selectUsesFromSource` (`match` até `;`)
para achar a região da cláusula antes de aplicar a regex de captura acima,
mantendo os dois parsers consistentes entre si.

## Risks / Trade-offs

- [Risco] `.dpr` sem cláusula `uses` (improvável, mas possível em projetos
  degenerados) faz o `match` inicial falhar e lançar exceção, igual ao
  comportamento hoje documentado para `.pas` sem `uses`/`unit`. →
  Mitigação: nenhuma neste change — é a mesma limitação conhecida e aceita
  do restante do parsing; tratamento de erro fica para quando houver uma UI
  consumindo isso (change futuro).
- [Risco] `.dpr` reais podem ter diretivas de compilação (`{$IFDEF DEBUG}`)
  ou comentários de linha (`//`) intercalados na `uses`, que a regex simples
  não entende semanticamente. → Mitigação: fora de escopo; documentar como
  limitação conhecida (mesmo espírito da nota já existente no `CLAUDE.md`
  sobre `selectUsesFromSource` só ler a primeira `uses`).
- [Trade-off] `path` retornado cru (sem normalização) empurra a
  responsabilidade de resolver o caminho para o consumidor futuro (a tela de
  seleção de Root Unit). Aceitável porque este change não tem consumidor
  ainda — normalizar agora seria especular sobre uma necessidade não
  confirmada.

## Open Questions

- Quando a seleção de Root Unit for implementada, os caminhos do `.dpr`
  precisarão ser resolvidos relativos ao diretório do `.dpr`? Deixado em
  aberto para o change que introduzir essa tela.
