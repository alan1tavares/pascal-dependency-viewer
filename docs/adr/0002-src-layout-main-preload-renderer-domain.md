# Reestruturar `src/` em `main/preload/renderer/domain`, mantendo JavaScript puro e sem framework

A camada de processos do app (`src/main.js`, `src/preload.js`,
`src/renderer.js`) tinha crescido para três arquivos planos, cada um fazendo
várias coisas não relacionadas (criação da janela, menu, registro de IPC e
lógica de ligação, tudo inline em `main.js`). Reestruturamos `src/` em
`main/` (com `ipc/` dividido por domínio — `file`, `project`, `graph` — além
de `services/` e `menu.js`), `preload/` (`index.js` + `api.js`) e `renderer/`
(`index.js` + `components/`), renomeando também `model/` para `domain/` — o
mesmo conteúdo puro, sem dependência do Electron e com uma pasta por módulo,
apenas realocado como irmão de `main/preload/renderer` em vez de viver
implicitamente ao lado deles.

Esta é uma reorganização pura: nenhuma capacidade nova foi adicionada e
nenhum requisito de nenhuma spec de capacidade mudou.

## Opções consideradas

- **TypeScript** (`main/index.ts`, `shared/types.ts` etc.) — rejeitada. O
  projeto não tem nenhum ferramental de TS hoje (nenhum `tsconfig.json`,
  nenhum `@types/*`), e introduzi-lo é desproporcional para uma mudança
  apenas estrutural, sem mudança de comportamento a ser verificada por tipos.
- **Um framework de UI para o renderer** (React com `App.tsx`/`components/`/
  `pages/`/`hooks/`/`store/`, ou uma árvore equivalente em Vue) — rejeitada.
  O renderer são duas telas DOM (seleção de Root Unit e visualização do grafo)
  alternadas via mostrar/ocultar, com o estado em closures locais; não há
  necessidade hoje de estado externo nem de roteamento. Mantivemos apenas
  `renderer/components/` (um arquivo por tela) e descartamos `pages/`,
  `hooks/` e `store/` em vez de criá-los vazios.
- **`shared/` para tipos/constantes entre processos** — rejeitada. Seu único
  propósito no layout proposto era compartilhar tipos TypeScript, o que não se
  aplica sem TS; a duplicação dos nomes dos canais IPC entre `preload/api.js`
  e `main/ipc/*.js`, que um módulo `shared/` poderia ter eliminado, já existia
  antes desta mudança, então corrigi-la não fazia parte do escopo desta
  reorganização.
- **Incorporar `domain/` em `main/services/`** — rejeitada. A arquitetura
  pré-existente (documentada no `CLAUDE.md`) mantém deliberadamente esta
  camada livre de qualquer dependência do Electron, e é por isso que ela é a
  parte coberta pelos testes do Jest. Movê-la para dentro de `main/` apagaria
  esse isolamento sem nenhum benefício.

## Consequências

- O `src/package.json` (`{ "type": "module" }`, adicionado quando `domain/` —
  na época `model/` — migrou pela primeira vez para ESM nativo) permanece.
  Removê-lo faria o `npm test` depender de um fallback não documentado do
  Jest 30 que só existe no Node ≥ 24.9
  (`vm.SourceTextModule.prototype.hasAsyncGraph`); o projeto não declara
  nenhuma restrição de `engines`, então manter o arquivo é o que torna a suíte
  de testes determinística entre versões do Node.
- `main/services/` e `main/ipc/` contêm apenas o que o app já faz hoje
  (leituras com `fs`, os três canais IPC existentes). `services/db`,
  `services/updater` e `services/nativeModules` não são criados — ainda não
  existe nada para eles conterem.
