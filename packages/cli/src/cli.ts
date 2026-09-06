#!/usr/bin/env node

import { renderScore } from "@muse-player/server";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    help: { short: "h", type: "boolean" },
    output: { short: "o", type: "string" },
    pageWidth: { type: "string" },
    scale: { type: "string" },
  },
});

if (values.help || positionals.length === 0) {
  console.log(`Usage: muse-render <input.mxl> [options]

Options:
  -o, --output <path>   Output JSON file path (default: <input>.rendered.json)
  --pageWidth <number>  Page width in SVG units (default: 1300)
  --scale <number>      Scale factor (default: 40)
  -h, --help            Show this help`);
  process.exit(values.help ? 0 : 1);
}

const inputPath = path.resolve(positionals[0]);
const outputPath = path.resolve(
  values.output ?? `${path.basename(inputPath, ".mxl")}.rendered.json`,
);

const options: Record<string, number> = {};
if (values.pageWidth)
  options.pageWidth = Number(values.pageWidth);
if (values.scale)
  options.scale = Number(values.scale);

try {
  const buffer = readFileSync(inputPath);
  const result = await renderScore(buffer, options);
  result.scoreData.title = path.basename(inputPath);
  writeFileSync(outputPath, JSON.stringify(result));
  console.log(`Rendered ${inputPath} -> ${outputPath}`);
  console.log(`  Pages: ${result.scoreData.totalPages}`);
  console.log(`  Timemap entries: ${result.timemap.length}`);
  console.log(`  Element attributes: ${Object.keys(result.elementAttributes).length}`);
}
catch (error: unknown) {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
}
