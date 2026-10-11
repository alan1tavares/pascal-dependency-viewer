# Proposta: Migração de Jest para Vitest

## Por quê

O projeto já utiliza **Vitest** para testes de componentes Svelte (integração iniciada em `feat/svelte`), enquanto testes do domínio (parsing, lógica) continuam com **Jest**. Unificar em **Vitest** reduz fragmentação, simplifica a configuração CI/CD, facilita onboarding e aproveita melhor a integração nativa com **Vite**.

## O que muda

- Todos os testes em `src/domain/test/` migram de Jest para Vitest
- Configuração de teste unificada: um único `vitest.config.mjs`
- Comando `npm test` roda apenas Vitest (sem mais duplicação de jest + vitest)
- Remoção de dependências Jest do `package.json`
- Nenhuma alteração no comportamento observável da aplicação

## Capacidades

### Novas Capacidades
<!-- Esta é uma migração de tooling/infraestrutura, sem mudanças comportamentais em nível de spec -->

### Capacidades Modificadas
<!-- Nenhuma especificação comportamental muda - é um refactoring puro de infraestrutura -->

## Impacto

- **Código afetado**: `src/domain/test/`, `vitest.config.mjs`, `jest.config.js` (removido)
- **Dependências**: Remover Jest, consolidar Vitest
- **CI/CD**: Simplificado — um único comando de teste
- **Documentação**: Atualizar `CLAUDE.md` e instruções de teste
- **Compatibilidade**: Sem breaking changes — comportamento de teste permanece equivalente
