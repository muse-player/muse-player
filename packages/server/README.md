# @muse-player/server

[![npm version](https://img.shields.io/npm/v/@muse-player/server)](https://www.npmjs.com/package/@muse-player/server)
[![license](https://img.shields.io/npm/l/@muse-player/server)](../../LICENSE)

Node.js library for server-side MXL/MusicXML score rendering via [Verovio](https://www.verovio.org/) WASM.

## Installation

```bash
pnpm add @muse-player/server
```

## Usage

```ts
import { renderScore } from "@muse-player/server";
import { readFileSync } from "node:fs";

const buffer = readFileSync("score.mxl");
const result = await renderScore(buffer);

console.log(result.svgPages);        // string[] — one SVG per page
console.log(result.midiBase64);      // base64-encoded MIDI
console.log(result.timemap);         // TimeMapEntry[] for note sync
console.log(result.elementAttributes); // per-note XML attributes
console.log(result.scoreData);       // { title, totalPages }
```

## API

### `renderScore(mxlBuffer, options?): Promise<ScoreRenderResult>`

Renders an MXL (compressed MusicXML) file to SVG pages, MIDI, and timemap data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `mxlBuffer` | `ArrayBuffer \| Buffer` | The MXL file contents |
| `options` | `RenderOptions` | Optional Verovio rendering options |

Returns a `ScoreRenderResult` (re-exported from `@muse-player/core`):

| Field | Type | Description |
|-------|------|-------------|
| `svgPages` | `string[]` | SVG markup for each page |
| `midiBase64` | `string` | Base64-encoded MIDI data |
| `timemap` | `TimeMapEntry[]` | Time-to-note mapping for synchronization |
| `elementAttributes` | `Record<string, Record<string, string>>` | Per-note XML attributes (staff, voice, etc.) |
| `scoreData` | `{ title: string; totalPages: number }` | Score metadata |

### `RenderOptions`

Extends Verovio's `VerovioOptions`. Default options:

```ts
{
  adjustPageHeight: true,
  breaks: "auto",
  font: "Leipzig",
  footer: "none",
  header: "none",
  pageWidth: 1300,
  scale: 40,
}
```

## How It Works

1. Loads the Verovio WASM module (cached after first call)
2. Parses the MXL zip buffer via `toolkit.loadZipDataBuffer()`
3. Renders each page to SVG via `toolkit.renderToSVG(page)`
4. Extracts MIDI via `toolkit.renderToMIDI()`
5. Generates a timemap with `toolkit.renderToTimemap({ includeMeasures: true })`
6. Collects per-note element attributes from the timemap

## Build

```bash
pnpm build
```

Built with Rslib (ESM, unbundled, DTS generation, Node target).

## Related Packages

| Package | Description |
|---------|-------------|
| [`@muse-player/core`](../core) | React hooks for score loading, MIDI playback, note highlighting, and auto-scrolling |
| [`@muse-player/component`](../component) | UI components (PlaybackControls) styled with StyleX |
| [`@muse-player/cli`](../cli) | CLI tool for pre-rendering MXL files to static assets |
| [`@muse-player/instruments`](../instruments) | Piano sample manifests and audio files |

## License

[MIT](../../LICENSE)
