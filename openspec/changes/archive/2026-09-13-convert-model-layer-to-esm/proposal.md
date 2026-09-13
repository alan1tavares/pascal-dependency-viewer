## Why

`vite.main.config.mjs` precisa de `build.commonjsOptions.include: [/src\/model\//, /node_modules/]` porque `src/main.js` importa `src/model/**` com `import`, mas esses arquivos ainda exportam via `module.exports`/`require` (CommonJS), herdados do projeto pré-migração para Electron Forge + Vite. Isso obriga o Vite a tratar código-fonte local como se fosse um pacote CJS de terceiro, algo que não é necessário em nenhum outro ponto do bundle do processo main. Convertendo `src/model/**` para a sintaxe ESM nativa (`export`/`import`), que já é o padrão usado em `src/main.js`, a opção de interop deixa de ser necessária.

## What Changes

- Converter todos os arquivos de `src/model/**` de `module.exports`/`require(...)` para `export default`/`export const`/`import`.
- Atualizar `src/test/**` (suíte Jest) para importar `src/model/**` com a mesma sintaxe ESM, já que os arquivos de teste hoje usam `require(...)`.
- Criar um `package.json` aninhado em `src/` (`{ "type": "module" }`) e ajustar o script `test` em `package.json` para rodar a suíte com suporte nativo a ES Modules, sem alterar `jest.config.js` nem `forge.config.js`.
- Remover `build.commonjsOptions.include` de `vite.main.config.mjs`, já que o bundler main deixará de precisar de interop CJS para código-fonte local.
- Nenhuma mudança de comportamento observável do aplicativo: parsing, montagem do grafo e expansão de dependências continuam produzindo a mesma saída.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. Esta mudança é puramente de infraestrutura/build (formato de módulo dos arquivos-fonte e configuração do bundler/test runner); não altera nenhum requisito de comportamento das capacidades existentes (`dependency-graph-expansion`, `dpr-project-parsing`, `external-unit-classification`, `graph-canvas-layout`, `root-unit-selection`, `uses-clause-scope`). `skip_specs: true` foi definido em `.openspec.yaml`.

## Impact

- **Código afetado**: todos os arquivos em `src/model/**` (8 arquivos) e todos os arquivos em `src/test/**` (5 arquivos de teste).
- **Configuração**: `vite.main.config.mjs` (remoção do `commonjsOptions.include`), `package.json` (script `test`) e um novo `src/package.json` (`{ "type": "module" }`) para escopar ESM a `src/**`, sem alterar `jest.config.js` nem `forge.config.js`.
- **Dependências**: nenhuma nova dependência de produção; o script `test` passa a rodar com `NODE_OPTIONS=--experimental-vm-modules` para o Jest suportar ESM nativamente.
- **Sem impacto** em `src/main.js`, `src/preload.js`, `src/renderer.js` (já usam ESM) nem no comportamento funcional do app.
