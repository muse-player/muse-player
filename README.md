# Muse Player

MXL/MusicXML score rendering and playback monorepo. Renders sheet music to SVG via Verovio and plays it back with realistic piano samples via Tone.js.

## Packages

| Package | Description |
|---------|-------------|
| [`@muse-player/core`](packages/core) | React hooks for score loading, MIDI playback, note highlighting, and auto-scrolling |
| [`@muse-player/component`](packages/component) | UI components (PlaybackControls) styled with StyleX |
| [`@muse-player/server`](packages/server) | Node.js server-side MXL rendering via Verovio WASM |
| [`@muse-player/cli`](packages/cli) | CLI tool for pre-rendering MXL files to static assets |
| [`@muse-player/instruments`](packages/instruments) | Piano sample manifests and audio files |

## Apps

| App | Description |
|-----|-------------|
| [`demo`](apps/demo) | React demo showcasing the full player with Tailwind CSS |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the demo app in development mode
pnpm dev

# Build everything
pnpm build

# Build individual packages
pnpm build:core
pnpm build:demo
```

## Architecture

```
MXL file
  ↓
@muse-player/server (Verovio WASM)
  ↓
SVG pages + MIDI + timemap + element attributes
  ↓
@muse-player/core (React)
  ├── useScore        — loads pre-rendered score data
  ├── usePlayback     — MIDI playback via Tone.js
  ├── usePianoSampler — loads piano samples for realistic audio
  ├── useAutoScroll   — auto-scrolls during playback
  ├── useNoteHighlight — highlights active notes on score
  └── ScoreRenderer   — renders SVG pages

@muse-player/component (React, StyleX)
  └── PlaybackControls — play/pause/stop/seek/tempo UI
```

## Rendering Scores

Use `@muse-player/server` programmatically or the CLI to pre-render MXL files:

```bash
# Render an MXL file to static assets
npx muse-render score.mxl -o output/
```

This produces a directory containing `manifest.json`, `data.json`, and SVG page files that can be served statically and loaded by `@muse-player/core`.

## Tech Stack

- **Rendering**: [Verovio](https://www.verovio.org/) WASM
- **Audio**: [Tone.js](https://tonejs.github.io/) + [@tonejs/midi](https://github.com/Tonejs/midi)
- **UI**: React 19 + Tailwind CSS + StyleX
- **Build**: Rslib / Rsbuild + pnpm workspaces
- **Language**: TypeScript

## License

[MIT](LICENSE) &copy; Trapar waves
