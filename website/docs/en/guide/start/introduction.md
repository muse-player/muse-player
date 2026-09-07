---
description: Introduction to Muse Player — MXL/MusicXML score rendering and playback monorepo.
---

# Introduction

Muse Player is a monorepo for rendering and playing back MXL/MusicXML sheet music in the browser. MXL files are rendered to SVG on the server side via [Verovio](https://www.verovio.org/) WASM, and the resulting static assets (SVG pages + MIDI data) are played back in the browser with realistic piano samples via [Tone.js](https://tonejs.github.io/).

:::warning
`@muse-player/core` **cannot** load or parse raw MXL/MusicXML files in the browser. All MXL files **must** be pre-rendered by `@muse-player/server` or the `muse-render` CLI first. The browser-side hooks only consume the pre-rendered static artifacts (manifest.json, data.json, SVG pages).
:::

## Why Muse Player

- **React-native**. All functionality is exposed as composable React hooks and components. No imperative API to learn — just call hooks and render.
- **Server-side rendering (required)**. Verovio rendering runs on Node.js — either at build time via the CLI, or on-the-fly via the server API. The browser receives lightweight SVG + MIDI static assets with zero runtime rendering cost. There is no client-side MXL parsing.
- **Realistic audio**. Ships with a piano sample library (84 notes, C1 through B7) and an effects chain (compressor + reverb) for natural-sounding playback.
- **Visual sync**. Notes are highlighted on the score in real time during playback, with left/right hand distinction via color coding.
- **Modular packages**. Five focused packages — use only what you need, from the full player down to just the server renderer or CLI.

## Packages

| Package | Description |
|---------|-------------|
| `@muse-player/core` | React hooks for score loading, MIDI playback, note highlighting, and auto-scrolling |
| `@muse-player/component` | UI components (PlaybackControls) styled with StyleX |
| `@muse-player/server` | Node.js server-side MXL rendering via Verovio WASM |
| `@muse-player/cli` | CLI tool for pre-rendering MXL files to static assets |
| `@muse-player/instruments` | Piano sample manifests and audio file URLs |

## How It Works

1. **Pre-render (required)** — Convert an MXL file to static SVG + MIDI assets using `@muse-player/server` or the `muse-render` CLI. This step is mandatory; the browser cannot parse MXL files.
2. **Load** — Serve the pre-rendered assets as static files, then load the manifest in your React app via the `useScore` hook.
3. **Render** — Display the SVG score with the `ScoreRenderer` component.
4. **Play** — Play the MIDI data with `usePlayback`, optionally using `usePianoSampler` for realistic piano audio.
5. **Sync** — Enhance the experience with `useAutoScroll` and `useNoteHighlight`.

## Next Steps

- [Getting Started](/guide/start/getting-started) — install packages and render your first score.
- [Architecture](/guide/start/architecture) — understand the monorepo layout and data flow.
- [API Reference](/api/) — detailed documentation for every package, hook, and component.
