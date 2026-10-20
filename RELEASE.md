# Release Process

This repo publishes to npm **only** through GitHub Actions. Never publish from a local machine (see [Why CI-only](#why-ci-only)).

## What happens on a release

| Trigger | Workflow | Effect |
|---------|----------|--------|
| Tag push `v*` | `deploy.yml` | Builds the docs site and deploys `doc_build/` to the Cloudflare Pages project `muse-player` |
| GitHub Release published | `release.yml` | Runs `pnpm lint` + `pnpm build`, then `pnpm publish -r --provenance --no-git-checks` for the 5 publishable packages |

Note: `release.yml` checks out `master`, **not** the tag — it publishes whatever is on `master` HEAD at run time. Keep the tag and `master` HEAD identical (see step 5).

## Prerequisites (one-time setup)

- **npm Trusted Publisher** for all 5 packages (`@muse-player/instruments`, `core`, `server`, `cli`, `component`) — required for OIDC authentication and provenance. On each package page → **Settings** → **Trusted Publisher** → GitHub Actions:
  - Organization or user: `muse-player`
  - Repository: `muse-player`
  - Workflow filename: `release.yml` (no path prefix)
  - Environment: leave empty
- `gh` CLI authenticated with `repo` scope.
- Repository secrets `CLOUDFLARE_API_TOKEN` and `ACCOUNT_ID` (docs deploy; already configured).

## Version policy

One lockstep version across all 8 manifests: root `package.json`, `packages/{core,instruments,server,cli,component}/package.json`, `website/package.json`, `apps/demo/package.json`. `workspace:*` dependencies are rewritten to exact versions on publish, so bumping only some packages pins consumers to old versions and can produce duplicate `@muse-player/core` instances (broken React hook state).

semver: new public API → minor; bug fixes only → patch; breaking change → major.

## Steps

Start from a clean, up-to-date `master`.

1. **Gate** — never tag while red:

   ```bash
   pnpm install --frozen-lockfile
   pnpm lint
   pnpm build
   git diff --exit-code pnpm-lock.yaml
   ```

2. **Bump** `"version"` in all 8 manifests (each has exactly one `"version"` line). No other fields change.

3. **Commit and push**:

   ```bash
   git commit -am "chore(release): vX.Y.Z"
   git push origin master
   ```

4. **Tag and push** (triggers `deploy.yml`):

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   git rev-parse vX.Y.Z master   # must print the same SHA twice
   ```

5. **Publish the GitHub Release** (triggers `release.yml`):

   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "<release notes>"
   ```

   Create it immediately after pushing the tag. If new commits landed on `master` in between (`git log --oneline vX.Y.Z..origin/master` is non-empty), delete the remote tag (`git push origin :refs/tags/vX.Y.Z`), retag on the new `master` HEAD, push the tag, then create the release.

6. **Verify**:

   ```bash
   gh run list -w Release --limit 1                 # must end ok
   gh run list -w "Deploy to CF Pages" --limit 1    # must end ok
   npm view @muse-player/server@X.Y.Z dependencies --json   # must contain "@muse-player/core": "X.Y.Z"
   npm view @muse-player/core@X.Y.Z dist.attestations       # provenance must be present
   ```

   Fresh-install smoke:

   ```bash
   mkdir -p /tmp/mp-smoke && cd /tmp/mp-smoke && npm init -y
   npm i @muse-player/core@X.Y.Z react@19 react-dom@19
   node -e "import('@muse-player/core/ids').then(m=>console.log(Object.keys(m).sort().join(',')))"
   npm ls @muse-player/core
   ```

   Expect the `ids` export names to print and a single `@muse-player/core@X.Y.Z` node in the tree.

## Troubleshooting

- **Publish step fails with `ERR_PNPM_AUTH_TOKEN_EXCHANGE ... 404`** — npm does not recognize the workflow as a Trusted Publisher for that package. Re-check the per-package config above (filename exactly `release.yml`, environment empty). Fix on npmjs.com, then `gh run rerun <run-id> --failed`.
- **Partial publish** (some packages published, then a failure) — safe to rerun: `pnpm -r publish` skips versions that already exist in the registry.
- **`npm view` returns 404 for a just-published version** — usually a stale cached packument on the client. Check the registry directly:

  ```bash
  node -e "fetch('https://registry.npmjs.org/@muse-player%2fserver').then(r=>r.json()).then(j=>console.log(Object.keys(j.versions)))"
  ```

- **`pnpm lint` fails** — fix it before tagging. `release.yml` runs the same lint and aborts the publish on failure.

## Why CI-only

`--provenance` attestations can only be signed from the workflow's OIDC identity. A local `pnpm publish` (how `1.0.0` was shipped) produces packages **without** provenance and bypasses the lint/build gate. Releases from `1.1.0` onward are published by `release.yml` with full provenance.
