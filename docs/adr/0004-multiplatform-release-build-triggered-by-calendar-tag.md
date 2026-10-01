# Publicar instaladores multiplataforma via GitHub Actions, disparados por uma tag de calendário `vYY.MM.DD`

Para distribuir instaladores prontos em vez de pedir a cada usuário que rode
`npm run make` localmente, adicionamos o primeiro pipeline de CI/CD do projeto
(`.github/workflows/build.yml`). Ele é disparado por um `git push` de uma tag
que corresponda a `vYY.MM.DD` (ano, mês e dia com dois dígitos — ex.:
`v26.09.17` para 2026-09-17), um identificador de calendário deliberado em
vez de versionamento semântico: aqui, as releases correspondem a "o build
gerado nesta data", e não a um contrato negociado de major/minor/patch. O
`on.push.tags` usa `v[0-9][0-9].[0-9][0-9].[0-9][0-9]` (o glob de filtro de
tags do GitHub suporta, sim, classes de caracteres `[0-9]` — confirmado na
própria documentação do GitHub, o que valeu a pena verificar, já que uma
suposição inicial durante o planejamento deste trabalho era a de que não
suportava), reforçado por uma verificação explícita com regex em bash
(`^v[0-9]{2}\.[0-9]{2}\.[0-9]{2}$`) como segunda camada defensiva, de modo que
uma tag malformada falhe ruidosamente com um erro claro em vez de produzir
silenciosamente uma release quebrada.

Um job `build` com matriz (`macos-latest`, `ubuntu-latest`, `windows-latest`,
`fail-fast: false` para que a falha de uma plataforma não cancele as outras)
executa `npm ci` + `npm run make`, reutilizando os makers do Electron Forge já
existentes (`maker-squirrel` no Windows, `maker-zip` no macOS,
`maker-deb`/`maker-rpm` no Linux — veja `forge.config.js`) em vez de adicionar
novos. O Node está fixado na versão 22 (a Active LTS atual no momento desta
escrita; o repositório não tem `.nvmrc`/`engines` hoje, então essa fixação
vive, por enquanto, apenas no workflow) com o cache de npm do
`actions/setup-node` habilitado. O `ubuntu-latest` instala adicionalmente o
pacote apt `rpm` antes do `npm run make`, já que o
`@electron-forge/maker-rpm` invoca o `rpmbuild`, que não vem pré-instalado
nessa imagem de runner (o `dpkg-deb`/`fakeroot` do `maker-deb` já vêm).

`v26.09.17` não é semver válido — o `node-semver` (e, portanto, o npm e o
Squirrel, que dependem dele) rejeita zeros à esquerda em identificadores
numéricos (verificado diretamente: `semver.valid('26.09.17')` → `null`,
`semver.valid('26.9.17')` → válido). Como o campo `version` do
`package.json` determina a versão do instalador de todos os makers, o job
`build` deriva uma versão compatível com semver removendo o zero à esquerda
de cada segmento (`26.09.17` → `26.9.17`) e a aplica com
`npm version <derivada> --no-git-tag-version` — apenas localmente no CI,
nunca commitada de volta no repositório. O `package.json` na `master` mantém
a versão que já tiver.

Um job `release` (`needs: [validate-tag, build]`, `permissions:
contents: write`) baixa os instaladores de todas as plataformas e publica uma
GitHub Release imediatamente via `gh release create <tag> <arquivos...>
--generate-notes` — publicada, não em rascunho, por decisão explícita de
produto: confia-se que cada push de tag representa um build digno de ser
distribuído, sem uma etapa de aprovação manual. Usamos a CLI `gh`
(pré-instalada nos runners hospedados pelo GitHub) em vez de uma action de
release de terceiros do Marketplace (ex.: `softprops/action-gh-release`)
para evitar assumir uma dependência de Action externa justamente na única
etapa deste workflow que precisa de `contents: write`.

Por enquanto, os instaladores não são assinados. Os builds de macOS vão
disparar avisos do Gatekeeper e o instalador Squirrel do Windows vai disparar
avisos do SmartScreen na primeira execução — um trade-off explícito e
reconhecido, adiado até que certificados de assinatura de código estejam
disponíveis.

## Opções consideradas

- **Tags de versionamento semântico de fato (`vMAJOR.MINOR.PATCH`)** em vez de
  uma tag de calendário — rejeitada. A intenção é um corte de build datado, e
  não um contrato de compatibilidade negociado; forçar semver aqui só faria a
  tag mentir sobre o que mudou.
- **Apenas o glob de `tags:`, sem a verificação por regex em bash** —
  rejeitada, mesmo que o glob sozinho seja suficiente hoje. Uma etapa de
  verificação defensiva e legível custa um job e protege contra mudanças no
  comportamento do glob, contra um futuro gatilho `workflow_dispatch` que
  ignore a tag por completo, ou contra alguém editar o gatilho sem perceber
  seu acoplamento com a etapa de parsing da versão.
- **Congelar a versão do `package.json` e nunca sincronizá-la com a tag** —
  rejeitada. Isso faria todo instalador reportar a mesma versão interna (ex.:
  "1.0.0"), independentemente de qual build datado o produziu, tornando
  impossível distinguir as cópias instaladas pelo próprio diálogo de
  Sobre/Propriedades.
- **Codificar a data como uma única versão inteira (ex.: `20260917`)** —
  rejeitada. É semver válido como uma versão apenas com major, mas descarta o
  agrupamento legível de ano/mês/dia para o qual o formato da tag foi
  escolhido, e a semântica de comparação/ordenação vira uma única catraca
  enorme de versão major, sem nenhum significado de minor/patch.
- **`softprops/action-gh-release` para a etapa de release** — rejeitada em
  favor da CLI `gh`, para manter a única etapa com `contents: write` deste
  workflow restrita a ferramentas próprias do GitHub.
- **Release em rascunho exigindo publicação manual** — rejeitada por decisão
  explícita: confia-se neste pipeline para publicar automaticamente toda tag
  correspondente, sem etapa manual.
- **Assinatura de código (notarização no macOS, Authenticode no Windows)** —
  adiada, não rejeitada. Ainda não há certificados disponíveis; revisitar
  quando houver.

## Consequências

- A versão interna do app instalado (ex.: `26.9.17`) vai diferir visivelmente
  da tag git que a produziu (`v26.09.17`) pelos zeros à esquerda removidos —
  algo intencional e restrito ao CI; o `package.json` na `master` nunca é
  alterado.
- Rodar novamente o workflow para uma tag que já tem uma release publicada
  vai falhar no `gh release create` (já existe uma release para essa tag).
  Esta é uma limitação aceita, sem tratamento especial — as tags neste
  esquema devem ser criadas uma única vez, no dia do build.
- Instaladores não assinados: usuários de macOS/Windows precisam contornar um
  aviso do Gatekeeper ou do SmartScreen para executá-los, até que a assinatura
  seja configurada em um trabalho futuro.
- O Node 22 está fixado apenas dentro de `.github/workflows/build.yml`; o
  desenvolvimento local não tem uma versão de Node imposta. Se a divergência
  entre CI e ambiente local se tornar um problema real, um trabalho futuro
  deve adicionar `.nvmrc`/`engines` e apontar ambos para a mesma fonte de
  verdade.
