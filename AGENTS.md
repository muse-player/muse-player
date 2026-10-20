# Repository Guidelines

## Project Overview

Muse Player — an MXL/MusicXML sheet-music rendering and playback monorepo. `@muse-player/server` renders scores to SVG pages + MIDI + timemap via Verovio WASM; `@muse-player/core` loads those bundles in React and plays them back with Tone.js and piano samples, with note highlighting and auto-scroll. Five packages publish to npm (`@muse-player/{core,component,server,cli,instruments}`); `apps/demo` and `website` (Rspress docs, en/zh) are private. All 8 manifests share one lockstep version (currently `1.1.0`).

## Architecture & Data Flow

Two pipelines joined by a pre-rendered score bundle:

- **Render (Node)** — `.mxl` buffer → `renderScore()` (`packages/server/src/index.ts`; Verovio toolkit cached at module level as `cachedToolkit`) → SVG pages + `midiBase64` + `timemap` + `elementAttributes` → the `muse-render` CLI (`packages/cli/src/cli.ts`) writes `<name>.rendered/{manifest.json, data.json, page-N.svg}`.
- **Load & play (browser)** — `useScore` (`packages/core/src/hooks/use-score.ts`) fetches the bundle → `usePlayback` decodes MIDI (`atob` → `Uint8Array` → `@tonejs/midi`) and drives the Tone.js transport → each tick derives the active-note set from `timemap` → `useNoteHighlight` overlays, `useAutoScroll` follows `currentMeasureId`, `PlaybackControls` (`packages/component`) exposes play/seek/tempo UI. The audio sampler is injected: `usePlayback(..., sampler)` receives the `Tone.Sampler` built by `usePianoSampler` instead of creating one.

**Domain invariant — id canonicalization**: Verovio repeat expansions emit ids with `-rend<N>` suffixes. `@muse-player/core/ids` (`canonicalizeTimemap`, `canonicalizeElementAttributes`; strips `/-rend\d+$/`) is applied at **both** ends — server on render, client again on load (bundles rendered by older versions lack canonical ids). Any code touching timemap or element ids MUST use these helpers; raw ids break highlighting and page mapping on scores with repeat barlines/voltas.

Dependency graph (`workspace:*`): `instruments ← core ← server ← cli`; `core ← component`. Core/component declare `react >=18` peer deps.

## Key Directories

| Path | Purpose |
|------|---------|
| `packages/core/src/` | Client stack: `hooks/` (`use-score`, `use-playback`, `use-note-highlight`, `use-auto-scroll`, `use-piano-sampler`), `components/score-renderer.tsx`, `types.ts` (bundle contracts), `ids.ts` (canonicalization) |
| `packages/server/src/`, `packages/cli/src/` | Node render pipeline and the `muse-render` CLI |
| `packages/instruments/` | Piano sample manifest + `samples/piano/*.mp3`; ships raw TypeScript, no build step |
| `packages/component/src/` | StyleX UI; build ends with `scripts/extract-stylex.mjs` (extracts `stylex_bundle.css`, injects its import) |
| `apps/demo/` | Integration demo; `public/djb.rendered/` is the sample bundle, `/piano/` is served from `packages/instruments/samples` |
| `website/` | Rspress docs in `docs/{en,zh}/`; built to `doc_build/`, deployed to Cloudflare Pages |
| `.github/workflows/` | `release.yml` (npm publish), `deploy.yml` (docs deploy) |

## Development Commands

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev (demo + watchers) | `pnpm dev` |
| Build everything | `pnpm build` |
| Build core + its deps | `pnpm build:core` |
| Lint (root + all workspaces) | `pnpm lint` |
| Per-package build/dev/lint | `pnpm --filter @muse-player/core build` (also `dev`, `lint`) |
| Render a score | `npx muse-render score.mxl -o output/` |
| Re-download piano samples | `pnpm --filter @muse-player/instruments download:piano` (needs network) |
| Docs site | `pnpm --filter rspress-doc-template dev` |
| Tests | none exist — see Testing & QA |

Releases: follow `RELEASE.md` exactly. npm publishing happens only via GitHub Actions — never `pnpm publish` from a machine.

## Code Conventions & Common Patterns

**Naming** — files kebab-case (`use-playback.ts`), `.tsx` only when JSX is present; hooks `use*` under `hooks/`; components PascalCase (`ScoreRenderer`); types PascalCase; component props interfaces end in `Properties` (`PlaybackControlsProperties`), ref props end in `Reference` (`containerReference`); constants `SCREAMING_SNAKE_CASE`; demo callbacks `handle*`.

**Formatting & lint** — ESLint via `@renton/eslint-config(-react)`, double quotes + semicolons. `pnpm lint` runs a root-scope `eslint .` (excludes `packages/**`, `apps/**`, `website/**`) plus per-workspace `eslint . --cache` through turbo — new workspaces need their own `lint` script or they go uncovered. `package.json`/`tsconfig.json` keys must follow the `jsonc/sort-keys` order (`engines` after `files`) — use `eslint --fix`, not hand sorting. Workflow YAML: explicit empty mappings (`workflow_dispatch: {}`) and plain scalars. Husky pre-commit runs lint-staged (`*.{ts,tsx,js,css}`, `--max-warnings=3`).

**State** — one `useState` per field; stale-closure-prone values live in `useRef` and are synced via `useEffect` (`timeMapReference`, `onNotesUpdateReference`); wrap callbacks in `useCallback`; effects dispose Tone `Part`/`Loop`/synth objects and timers.

**Async** — heavy audio/MIDI deps load via dynamic `import("tone")` / `import("@tonejs/midi")` (code splitting); one-time expensive init uses a module-level promise (see `cachedToolkit` in `packages/server/src/index.ts`).

**Errors** — hooks expose `error: string | null` alongside `loading` and log via `console.error("[tag] ...")`; the CLI catches and `process.exit(1)`. No Result types.

**Binary data** — MIDI travels as base64 in JSON (`midiBase64`) and is decoded `atob` → `charCodeAt` → `Uint8Array` (the `charCodeAt` is deliberate — binary bytes); MXL arrives as `ArrayBuffer | Buffer` and `toCleanArrayBuffer` copies Node Buffers before loading into Verovio.

**Deliberate eslint suppressions** (3, each with a written justification): `score-renderer.tsx` `dangerouslySetInnerHTML` (trusted server-generated SVG), `use-playback.ts` `charCodeAt` (binary data), `apps/demo/src/app.tsx` set-state-in-effect (input sync). Keep the justification comment if you keep the suppression; replace the pattern if you remove it.

## Important Files

- `packages/core/src/index.ts` — public client API (hooks, `ScoreRenderer`, types); `packages/core/src/ids.ts` — id canonicalization (exported as `@muse-player/core/ids`); `packages/core/src/types.ts` — `TimeMapEntry`, `ScoreManifest`, `ScoreDataFile`, `ElementAttributes`.
- `packages/server/src/index.ts` — `renderScore(mxlBuffer, options?)`.
- `packages/cli/src/cli.ts` — `muse-render` entry (bin; `node:util` `parseArgs`).
- `apps/demo/src/app.tsx` — end-to-end wiring example for the whole stack.
- `turbo.json` (task graph), `pnpm-workspace.yaml` (workspace settings), `eslint.config.js` (root lint), `tsconfig.json` (base config extended by packages).
- `RELEASE.md` — authoritative release process; `.github/workflows/release.yml` publishes `master` HEAD (not the tag) on release publish.

## Runtime & Tooling Preferences

- **Package manager**: pnpm ≥12 (`packageManager: pnpm@12.3.4`); workspaces `packages/*`, `apps/*`, `website`; `shellEmulator: true` keeps scripts Windows-compatible. Never commit npm/yarn lockfiles.
- **Node**: published packages declare `engines: >=18`; CI runs Node 26; ESLint 10 requires ≥20.19 locally — develop on Node ≥20.19 (ideally 26).
- **Modules**: ESM everywhere (`"type": "module"`); no CommonJS.
- **Build**: rslib for packages (libraries `bundle:false, dts:true`; CLI `bundle:true`), rsbuild for the demo, rspress for docs. Types come from rslib `dts` — there is no `tsc`/typecheck script.
- **Lockstep versions**: bump all 8 manifests together. `workspace:*` is rewritten to exact versions at publish, so partial bumps pin consumers to old packages and can install duplicate `@muse-player/core` copies (breaking hook state).
- **instruments** publishes raw TypeScript (`main: src/index.ts`); keep it dependency-light and Node/browser compatible.
- `pnpm-workspace.yaml` allowlists build scripts narrowly (`allowBuilds: {core-js: true}`); new packages with postinstall scripts need an entry.

## Testing & QA

- **No test suite exists** — no test files, runner configs, `test` scripts, or CI test steps (verified across every workspace and `pnpm-lock.yaml`). If you add tests, introduce a runner deliberately (e.g. Vitest), wire `test` scripts, and add a CI step in `release.yml`.
- Current QA gates: `pnpm lint` + `pnpm build` (also the release gate), husky/lint-staged pre-commit, and manual demo verification (`pnpm dev` → `djb.rendered` bundle loads → highlight moves, auto-scroll follows, seek/stop clears highlights).
- Demo fixture caveat: `apps/demo/public/djb.mxl` has no repeat/volta marks — repeat-path changes (id canonicalization) need an external repeat-containing score to verify.
- Release verification lives in `RELEASE.md` step 6 (registry dependency-rewrite check + fresh-install smoke).
