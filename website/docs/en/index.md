---
description: Muse Player — MXL/MusicXML score rendering and playback with React hooks, Verovio, and Tone.js.
pageType: home

hero:
  name: Muse Player
  text: MXL/MusicXML Score Rendering & Playback
  tagline: Render sheet music to SVG via Verovio and play it back with realistic piano samples via Tone.js — all through React hooks.
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/start/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/nicholasXu/mxl-player
  image:
    src: /rspress-icon.png
    alt: Muse Player
features:
  - title: React Hooks API
    details: Composable hooks for score loading, MIDI playback, note highlighting, auto-scrolling, and piano sampling. Consumes pre-rendered static assets — no client-side MXL parsing.
    icon: ⚛️
    link: /api/core
  - title: Server-Side Rendering (Required)
    details: MXL files must be pre-rendered to static SVG + MIDI via Verovio WASM on Node.js. The browser only consumes these static artifacts — zero runtime rendering cost.
    icon: 🖨️
    link: /api/server
  - title: CLI Pre-rendering
    details: Use the muse-render CLI to batch-convert MXL files into ready-to-serve directories with SVG pages, MIDI data, and manifests.
    icon: ⚙️
    link: /api/cli
  - title: Realistic Piano Audio
    details: Built-in piano sample loading with compressor and reverb effects chain via Tone.js. Covers 84 notes from C1 to B7.
    icon: 🎹
    link: /api/instruments
  - title: Visual Note Highlighting
    details: Colored overlay rectangles highlight actively playing notes on the score — blue for right hand, red for left hand.
    icon: 🎨
    link: /api/core#usenotehighlight
  - title: Monorepo Architecture
    details: Five focused packages — core, component, server, cli, and instruments — each independently installable with clear responsibilities.
    icon: 📦
    link: /guide/start/architecture
---
