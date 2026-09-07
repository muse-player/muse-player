---
description: Muse Player monorepo architecture, data flow, and package responsibilities.
---

# Architecture

## Monorepo Layout

```
muse-player/
  packages/
    core/          # React hooks + ScoreRenderer component
    component/     # PlaybackControls UI (StyleX)
    server/        # Node.js MXL rendering via Verovio WASM
    cli/           # muse-render CLI
    instruments/   # Piano sample manifests
  apps/
    demo/          # React demo app (Rsbuild + Tailwind)
  website/         # This documentation site (Rspress)
```

## Data Flow

Muse Player uses a **strict offline pre-render pipeline**. The browser cannot parse MXL/MusicXML files — all rendering happens server-side, and the browser only consumes pre-rendered static artifacts.

The pipeline runs in two phases:

### Phase 1: Pre-rendering (build time)

```
MXL file (compressed MusicXML)
  │
  ▼
@muse-player/server  ──  Verovio WASM toolkit
  │
  ├──► SVG pages (one string per page)
  ├──► MIDI data (base64-encoded)
  ├──► Timemap (time-indexed note on/off events)
  └──► Element attributes (per-note Verovio metadata)
```

Pre-rendering can be done via:
- **CLI**: `muse-render score.mxl -o output/` writes static files to disk.
- **Node.js API**: `renderScore(buffer)` returns all data in memory.

### Phase 2: Playback (browser runtime)

```
Static assets (manifest.json + data.json + page-*.svg)
  │
  ▼
useScore()  ──  loads manifest, fetches data + SVG pages
  │
  ├──► <ScoreRenderer svg={svg} />  renders the current page
  │
  ├──► usePlayback(midiBase64, timeMap, ...)  MIDI playback engine
  │       │
  │       ├──► onTimeUpdate(time)  →  getElementsAtTime()  →  renderPage()
  │       └──► onNotesUpdate(ids)  →  useNoteHighlight()
  │
  ├──► usePianoSampler()  loads piano samples for realistic audio
  │
  ├──► useAutoScroll(containerRef, measure, playing)
  │
  └──► <PlaybackControls ... />  play/pause/stop/seek/tempo UI
```

## Package Dependencies

```
@muse-player/cli
  └── @muse-player/server
        └── @muse-player/core (types only)

@muse-player/component
  └── @muse-player/core
        └── @muse-player/instruments

Peer: react >=18, react-dom >=18
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Rendering | [Verovio](https://www.verovio.org/) WASM | Converts MusicXML to SVG, extracts MIDI and timemap |
| Audio | [Tone.js](https://tonejs.github.io/) | MIDI playback, audio scheduling, effects chain |
| MIDI parsing | [@tonejs/midi](https://github.com/Tonejs/midi) | Parses base64 MIDI into note events |
| UI styling | [StyleX](https://stylexjs.com/) | Compile-time CSS for PlaybackControls |
| Build | [Rslib](https://lib.rsbuild.dev/) / [Rsbuild](https://rsbuild.dev/) | Package and app bundling |
| Language | TypeScript | End-to-end type safety |
