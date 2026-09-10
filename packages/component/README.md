# @muse-player/component

[![npm version](https://img.shields.io/npm/v/@muse-player/component)](https://www.npmjs.com/package/@muse-player/component)
[![license](https://img.shields.io/npm/l/@muse-player/component)](../../LICENSE)

UI components for Muse Player, styled with [StyleX](https://stylexjs.com).

## Installation

```bash
pnpm add @muse-player/component react react-dom
```

`@muse-player/component` depends on `@muse-player/core` and `@stylexjs/stylex`. React 18+ is a peer dependency.

Styles are bundled with the component and imported automatically — no additional CSS setup is needed.

## Components

### `<PlaybackControls>`

Play/pause/stop buttons, progress bar with seek, time display, and tempo slider.

```tsx
import { PlaybackControls } from "@muse-player/component";

<PlaybackControls
  currentMeasure={currentMeasure}
  currentTime={currentTime}
  onPause={pause}
  onPlay={play}
  onSeek={seek}
  onStop={stop}
  onTempoChange={updateTempo}
  playing={playing}
  tempo={tempo}
  totalDuration={totalDuration}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `currentMeasure` | `number` | 0-based index of the current measure |
| `currentTime` | `number` | Current playback position in seconds |
| `onPause` | `() => void` | Called when pause is clicked |
| `onPlay` | `() => void` | Called when play is clicked |
| `onSeek` | `(time: number) => void` | Called when the progress bar is clicked |
| `onStop` | `() => void` | Called when stop is clicked |
| `onTempoChange` | `(tempo: number) => void` | Called when the tempo slider changes |
| `playing` | `boolean` | Whether playback is active |
| `tempo` | `number` | Current BPM (range: 40–240) |
| `totalDuration` | `number` | Total duration in seconds |

## Styling

This package uses [StyleX](https://stylexjs.com) instead of Tailwind CSS, so consumers do not need to install or configure Tailwind. All styles are compiled to atomic CSS at build time.

If your bundler does not automatically resolve CSS imports from `node_modules`, you can explicitly import the stylesheet:

```tsx
import "@muse-player/component/style.css";
```

## Build

```bash
pnpm build
```

Built with Rslib (ESM, unbundled, DTS generation) + StyleX CLI for atomic CSS extraction.

## Related Packages

| Package | Description |
|---------|-------------|
| [`@muse-player/core`](../core) | React hooks for score loading, MIDI playback, note highlighting, and auto-scrolling |
| [`@muse-player/server`](../server) | Node.js server-side MXL rendering via Verovio WASM |
| [`@muse-player/cli`](../cli) | CLI tool for pre-rendering MXL files to static assets |
| [`@muse-player/instruments`](../instruments) | Piano sample manifests and audio files |

## License

[MIT](../../LICENSE)
