# @muse-player/instruments

Piano sample manifests and audio files for Muse Player.

Provides a mapping from note names to MP3 sample URLs, used by `@muse-player/core`'s `usePianoSampler` hook for realistic piano playback via Tone.js.

## Installation

```bash
pnpm add @muse-player/instruments
```

## Usage

```ts
import { getPianoSampleUrls, PIANO_MANIFEST, PIANO_CDN_URL } from "@muse-player/instruments";

// Get URLs from the default CDN (nbrosowsky/tonejs-instruments)
const urls = getPianoSampleUrls();
// => { "C4": "https://...piano/C4.mp3", "D4": "https://...piano/D4.mp3", ... }

// Use a custom base URL (e.g., locally served samples)
const localUrls = getPianoSampleUrls("/piano/");
// => { "C4": "/piano/C4.mp3", "D4": "/piano/D4.mp3", ... }

// Access the raw manifest (note name → filename mapping)
console.log(PIANO_MANIFEST["C4"]); // "C4.mp3"
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `PIANO_MANIFEST` | `Record<string, string>` | Note name to filename mapping (e.g., `"C#4" → "Cs4.mp3"`) |
| `PIANO_CDN_URL` | `string` | Default CDN base URL for samples |
| `getPianoSampleUrls(baseUrl?)` | `Record<string, string>` | Returns full URLs for all piano samples |

## Samples

84 piano samples covering C1–G#7 (full playable piano range) as MP3 files in `samples/piano/`. Source: [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments).

## Download Script

To re-download samples from the source CDN:

```bash
pnpm download:piano
```

This downloads all 84 MP3 files to `samples/piano/` and regenerates `src/piano-manifest.ts`.

## License

[MIT](../../LICENSE)
