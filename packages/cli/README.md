# @muse-player/cli

[![npm version](https://img.shields.io/npm/v/@muse-player/cli)](https://www.npmjs.com/package/@muse-player/cli)
[![license](https://img.shields.io/npm/l/@muse-player/cli)](../../LICENSE)

CLI tool for pre-rendering MXL/MusicXML scores to static assets via `@muse-player/server`.

## Installation

```bash
pnpm add -g @muse-player/cli
```

Or run directly with npx:

```bash
npx muse-render score.mxl
```

## Usage

```bash
muse-render <input.mxl> [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <dir>` | Output directory | `<input-name>.rendered/` |
| `--pageWidth <number>` | Page width in SVG units | `1300` |
| `--scale <number>` | Scale factor | `40` |
| `-h, --help` | Show help | |

### Example

```bash
muse-render symphony.mxl -o public/symphony/
```

This produces:

```
public/symphony/
  manifest.json    — score metadata + file references
  data.json        — MIDI, timemap, element attributes
  page-1.svg       — first page SVG
  page-2.svg       — second page SVG
  ...
```

The output directory can be served statically and loaded by `@muse-player/core`'s `useScore().loadResult()` hook via the `manifest.json` URL.

## Build

```bash
pnpm build
```

Built with Rslib (ESM, bundled, Node target).

## Related Packages

| Package | Description |
|---------|-------------|
| [`@muse-player/core`](../core) | React hooks for score loading, MIDI playback, note highlighting, and auto-scrolling |
| [`@muse-player/component`](../component) | UI components (PlaybackControls) styled with StyleX |
| [`@muse-player/server`](../server) | Node.js server-side MXL rendering via Verovio WASM |
| [`@muse-player/instruments`](../instruments) | Piano sample manifests and audio files |

## License

[MIT](../../LICENSE)
