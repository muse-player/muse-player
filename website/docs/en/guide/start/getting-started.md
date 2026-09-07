---
description: Install Muse Player packages, render your first MXL score, and integrate playback into a React app.
---

# Getting Started

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- An MXL (compressed MusicXML) score file

## Installation

Install the packages you need from the monorepo:

```bash
# Core hooks + score renderer component
pnpm add @muse-player/core

# Playback controls UI (optional)
pnpm add @muse-player/component

# Server-side rendering — REQUIRED for MXL processing (Node.js only)
pnpm add @muse-player/server

# CLI tool — alternative to the server API (or use npx)
pnpm add -D @muse-player/cli
```

:::tip
Peer dependencies `react` and `react-dom` (>=18) must be installed in your project.
:::

:::warning
You **must** install either `@muse-player/server` or `@muse-player/cli`. The `@muse-player/core` package cannot parse MXL files — it only consumes pre-rendered static artifacts produced by the server or CLI.
:::

## Step 1: Pre-render an MXL File (Required)

MXL files cannot be loaded directly in the browser. You **must** pre-render them to static assets first using either the CLI or the server API.

**Option A: CLI (recommended for static sites)**

```bash
npx muse-render score.mxl -o public/score
```

**Option B: Server API (for dynamic rendering)**

```ts
import { renderScore } from '@muse-player/server';
import { readFileSync } from 'node:fs';

const buffer = readFileSync('score.mxl');
const result = await renderScore(buffer);
// result contains { svgPages, midiBase64, timemap, elementAttributes, scoreData }
```

Both produce the same output structure:

When using the CLI, the output directory looks like:

```
public/score/
  manifest.json    # Score metadata — feed this URL to useScore()
  data.json        # MIDI data, timemap, element attributes
  page-1.svg       # SVG page(s) of the rendered score
  page-2.svg
  ...
```

When using the server API, you get a `ScoreRenderResult` object in memory. You can serve it directly from an API endpoint or write it to disk yourself.

## Step 2: Load and Render the Score

```tsx
import { useRef, useEffect } from 'react';
import { useScore, ScoreRenderer } from '@muse-player/core';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loadResult, svg, loading, error } = useScore();

  useEffect(() => {
    loadResult('/score/manifest.json');
  }, [loadResult]);

  if (loading) return <p>Loading score...</p>;
  if (error) return <p>Error: {error}</p>;

  return <ScoreRenderer containerRef={containerRef} svg={svg} />;
}
```

## Step 3: Add Playback

```tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import {
  useScore, usePlayback, usePianoSampler, ScoreRenderer,
} from '@muse-player/core';
import { PlaybackControls } from '@muse-player/component';
import '@muse-player/component/style.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

  const {
    loadResult, svg, midiBase64, timeMap,
    getElementsAtTime, getElementAttr, renderPage,
  } = useScore();

  const handleTimeUpdate = useCallback((time: number) => {
    const result = getElementsAtTime(time * 1000);
    if (result.page > 0) renderPage(result.page);
  }, [getElementsAtTime, renderPage]);

  const handleNotesUpdate = useCallback((noteIds: string[]) => {
    setActiveNoteIds(noteIds);
  }, []);

  const { sampler, ready } = usePianoSampler();

  const {
    play, pause, stop, seek, playing,
    currentTime, totalDuration, currentMeasure, tempo, updateTempo,
  } = usePlayback(midiBase64, timeMap, handleTimeUpdate, handleNotesUpdate,
    ready ? { sampler } : null);

  useEffect(() => {
    loadResult('/score/manifest.json');
  }, [loadResult]);

  return (
    <>
      <ScoreRenderer containerRef={containerRef} svg={svg} />
      <PlaybackControls
        playing={playing} currentTime={currentTime} totalDuration={totalDuration}
        currentMeasure={currentMeasure} tempo={tempo}
        onPlay={play} onPause={pause} onStop={stop}
        onSeek={seek} onTempoChange={updateTempo}
      />
    </>
  );
}
```

:::info
The `PlaybackControls` component requires importing `@muse-player/component/style.css` for styles to work.
:::

## Next Steps

- [Architecture](/guide/start/architecture) — understand the data flow and package responsibilities.
- [API: Core](/api/core) — detailed hook signatures and return values.
- [API: Server](/api/server) — programmatic server-side rendering.
