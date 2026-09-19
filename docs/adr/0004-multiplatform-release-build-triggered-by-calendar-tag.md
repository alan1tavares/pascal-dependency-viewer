# Publish multi-platform installers via GitHub Actions, triggered by a `vYY.MM.DD` calendar tag

To ship built installers instead of asking every user to run `npm run make`
locally, we added the project's first CI/CD pipeline
(`.github/workflows/build.yml`). It triggers on a `git push` of a tag
matching `vYY.MM.DD` (two-digit year, month, day — e.g. `v26.09.17` for
2026-09-17), a deliberate calendar identifier rather than semantic
versioning: releases here map to "the build cut on this date", not to a
negotiated major/minor/patch contract. `on.push.tags` uses
`v[0-9][0-9].[0-9][0-9].[0-9][0-9]` (GitHub's tag-filter glob does support
`[0-9]` character classes — confirmed against GitHub's own docs, which was
worth double-checking since an initial assumption while scoping this work
was that it didn't), backed by an explicit bash regex guard
(`^v[0-9]{2}\.[0-9]{2}\.[0-9]{2}$`) as a defensive second layer, so a
malformed tag fails loudly with a clear error instead of silently producing
a broken release.

A `build` job matrix (`macos-latest`, `ubuntu-latest`, `windows-latest`,
`fail-fast: false` so one platform's failure doesn't cancel the others) runs
`npm ci` + `npm run make`, reusing the existing Electron Forge makers
(`maker-squirrel` on Windows, `maker-zip` on macOS, `maker-deb`/`maker-rpm`
on Linux — see `forge.config.js`) rather than adding new ones. Node is
pinned to 22 (the current Active LTS as of this writing; the repo has no
`.nvmrc`/`engines` today, so this pin lives only in the workflow for now)
with `actions/setup-node`'s npm cache enabled. `ubuntu-latest` additionally
installs the `rpm` apt package before `npm run make`, since
`@electron-forge/maker-rpm` shells out to `rpmbuild`, which isn't
preinstalled on that runner image (`maker-deb`'s `dpkg-deb`/`fakeroot`
already are).

`v26.09.17` is not valid semver — `node-semver` (and therefore npm and
Squirrel, which both depend on it) rejects leading zeros in numeric
identifiers (verified directly: `semver.valid('26.09.17')` → `null`,
`semver.valid('26.9.17')` → valid). Since `package.json`'s `version` field
drives every maker's installer version, the `build` job derives a
semver-safe version by stripping each segment's leading zero
(`26.09.17` → `26.9.17`) and applies it with
`npm version <derived> --no-git-tag-version` — CI-local only, never
committed back to the repository. `package.json` on `master` keeps
whatever version it already has.

A `release` job (`needs: [validate-tag, build]`, `permissions:
contents: write`) downloads every platform's installers and publishes a
GitHub Release immediately via `gh release create <tag> <files...>
--generate-notes` — published, not draft, per explicit product decision:
every tag push is trusted to represent a build worth shipping without a
manual approval gate. We used the `gh` CLI (preinstalled on GitHub-hosted
runners) instead of a third-party Marketplace release action (e.g.
`softprops/action-gh-release`) to avoid taking on an external Action
dependency for the one step in this workflow that needs `contents: write`.

Installers are unsigned for now. macOS builds will trigger Gatekeeper
warnings and the Windows Squirrel installer will trigger SmartScreen
warnings on first run — an explicit, acknowledged trade-off, deferred until
code-signing certificates are available.

## Considered options

- **True semantic versioning tags (`vMAJOR.MINOR.PATCH`)** instead of a
  calendar tag — rejected. The intent is a date-stamped build cut, not a
  negotiated compatibility contract; forcing semver here would just make
  the tag lie about what changed.
- **Only the `tags:` glob, no bash regex guard** — rejected even though the
  glob alone is sufficient today. A defensive, human-readable guard step
  costs one job and protects against the glob's behavior changing, a future
  `workflow_dispatch` trigger bypassing the tag entirely, or someone editing
  the trigger without noticing its coupling to the version-parsing step.
- **Freeze `package.json`'s version and never sync it to the tag** —
  rejected. It would leave every installer reporting the same internal
  version (e.g. "1.0.0") regardless of which dated build produced it,
  making installed copies impossible to tell apart from their own
  About/Properties dialog.
- **Encode the date as a single integer version (e.g. `20260917`)** —
  rejected. It's valid semver as a major-only version, but it throws away
  the human-readable year/month/day grouping the tag format was chosen for,
  and comparison/ordering semantics become a single huge major-version
  ratchet with no minor/patch meaning at all.
- **`softprops/action-gh-release` for the release step** — rejected in
  favor of the `gh` CLI, to keep the only `contents: write` step in this
  workflow limited to first-party GitHub tooling.
- **Draft release requiring manual publish** — rejected per explicit
  decision: this pipeline is trusted to publish every matching tag
  automatically, no manual gate.
- **Code signing (macOS notarization, Windows Authenticode)** — deferred,
  not rejected. No certificates are available yet; revisit once they are.

## Consequences

- The installed app's internal version (e.g. `26.9.17`) will visibly differ
  from the git tag that produced it (`v26.09.17`) by its dropped leading
  zeros — intentional and CI-only; `package.json` on `master` is never
  touched.
- Re-running the workflow for a tag that already has a published release
  will fail at `gh release create` (a release for that tag already exists).
  This is an accepted limitation, not handled specially — tags in this
  scheme are meant to be created once, on the day of the build.
- Unsigned installers: users on macOS/Windows must bypass a Gatekeeper or
  SmartScreen warning to run them, until signing is set up in a follow-up.
- Node 22 is pinned only inside `.github/workflows/build.yml`; local
  development has no enforced Node version. If CI/local drift becomes a
  real problem, a follow-up should add `.nvmrc`/`engines` and point both at
  the same source of truth.
