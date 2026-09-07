# @muse-player/core

React components and hooks for MXL/MusicXML score rendering and MIDI playback.

## Installation

```bash
pnpm add @muse-player/core react react-dom
```

`@muse-player/core` depends on `@muse-player/instruments` for piano samples, and pulls in `tone` and `@tonejs/midi` as runtime dependencies. React 18+ is a peer dependency.

## Components

### `<ScoreRenderer>`

Renders an SVG score page inside a scrollable container.

```tsx
import { ScoreRenderer } from "@muse-player/core";

<ScoreRenderer containerRef={ref} svg={svgString} />
```

| Prop | Type | Description |
|------|------|-------------|
| `containerRef` | `RefObject<HTMLDivElement>` | Ref to the scrollable container (used by auto-scroll and note highlight) |
| `svg` | `string` | SVG markup for the current page |

UI controls such as `<PlaybackControls>` have moved to [`@muse-player/component`](../component/README.md).

## Hooks

### `useScore()`

Loads pre-rendered score data from a manifest URL (produced by `@muse-player/server` or `@muse-player/cli`).

```tsx
const {
  loadResult,       // (url: string) => void — load manifest.json
  svg,              // current page SVG string
  currentPage,      // current page number (1-based)
  totalPages,       // total page count
  renderPage,       // (page: number) => void — switch page
  midiBase64,       // base64-encoded MIDI data
  timeMap,          // TimeMapEntry[] for note synchronization
  scoreData,        // { title, totalPages }
  getElementsAtTime,// (ms) => { notes: string[], page: number }
  getElementAttr,   // (xmlId) => Record<string, string>
  loading,          // boolean
  error,            // string | null
} = useScore();
```

### `usePlayback(midiBase64, timeMap, onTimeUpdate?, onNotesUpdate?, instrument?)`

MIDI playback engine powered by Tone.js. Parses base64 MIDI, schedules notes, tracks current time/measure/active notes.

```tsx
const {
  play,             // () => Promise<void>
  pause,            // () => void
  stop,             // () => void
  seek,             // (seconds: number) => void
  seekToMeasure,    // (index: number) => void
  updateTempo,      // (bpm: number) => void
  playing,          // boolean
  currentTime,      // seconds
  totalDuration,    // seconds
  currentMeasure,   // 0-based measure index
  tempo,            // current BPM
} = usePlayback(midiBase64, timeMap, onTimeUpdate, onNotesUpdate, instrument);
```

### `usePianoSampler(options?)`

Loads piano samples from `@muse-player/instruments` via Tone.js Sampler. Returns a stateful object.

```tsx
const { ready, loading, error, sampler } = usePianoSampler({
  baseUrl: "/piano/", // optional — override sample URL base
});

// Pass sampler to usePlayback for realistic audio
usePlayback(midiBase64, timeMap, onTimeUpdate, onNotesUpdate,
  ready ? { sampler } : null
);
```

### `useAutoScroll(containerRef, currentMeasure, isPlaying)`

Auto-scrolls the score container to follow playback. Pauses on manual scroll (5s cooldown).

```tsx
const { autoScrollEnabled, setAutoScrollEnabled } = useAutoScroll(
  containerRef, currentMeasure, playing
);
```

### `useNoteHighlight(containerRef, activeNoteIds, getElementAttribute)`

Draws colored highlight overlays on active notes. Right hand (staff 1) is blue, left hand (staff 2) is red.

```tsx
useNoteHighlight(containerRef, activeNoteIds, getElementAttr);
```

## Types

```ts
interface TimeMapEntry {
  tstamp: number;   // milliseconds
  qstamp: number;
  on?: string[];    // note XML IDs starting at this time
  off?: string[];   // note XML IDs ending at this time
  tempo?: number;
}

interface ScoreManifest {
  data: string;           // path to data.json
  pages: string[];        // paths to page SVGs
  scoreData: { title: string; totalPages: number };
}

interface ScoreDataFile {
  elementAttributes: ElementAttributes;
  midiBase64: string;
  timemap: TimeMapEntry[];
}

interface ScoreRenderResult {
  elementAttributes: ElementAttributes;
  midiBase64: string;
  scoreData: { title: string; totalPages: number };
  svgPages: string[];
  timemap: TimeMapEntry[];
}
```

## Build

```bash
pnpm build
```

Built with Rslib (ESM, unbundled, DTS generation, React plugin).

## License

[MIT](../../LICENSE)
