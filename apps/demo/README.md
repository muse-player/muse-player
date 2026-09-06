# Demo App

React demo showcasing the full Muse Player — score rendering, MIDI playback with piano samples, note highlighting, and auto-scroll.

## Development

```bash
# From monorepo root
pnpm dev

# Or from this directory
pnpm dev
```

Opens at `http://localhost:port` (port assigned by Rsbuild).

## What It Does

1. Loads a pre-rendered score from `/djb.rendered/manifest.json` (produced by `@muse-player/cli`)
2. Renders SVG pages via `ScoreRenderer`
3. Loads piano samples from local `samples/piano/` via `usePianoSampler`
4. Plays back the MIDI with real piano audio via `usePlayback`
5. Highlights active notes (blue = right hand, red = left hand) via `useNoteHighlight`
6. Auto-scrolls to follow playback via `useAutoScroll`
7. Provides page navigation and tempo controls

## Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Rsbuild
- `@muse-player/core` — all player components and hooks
- `@muse-player/instruments` — piano samples

## Build

```bash
pnpm build
```

## License

[MIT](../../LICENSE)
