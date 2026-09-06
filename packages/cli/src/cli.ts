#!/usr/bin/env node

import { renderScore } from "@muse-player/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  -o, --output <dir>    Output directory (default: <input-name>.rendered/)
  --pageWidth <number>  Page width in SVG units (default: 1300)
  --scale <number>      Scale factor (default: 40)
  -h, --help            Show this help`);
  process.exit(values.help ? 0 : 1);
}

const inputPath = path.resolve(positionals[0]);
const inputName = path.basename(inputPath, ".mxl");
const outputDirectory = path.resolve(values.output ?? `${inputName}.rendered`);

const options: Record<string, number> = {};
if (values.pageWidth)
  options.pageWidth = Number(values.pageWidth);
if (values.scale)
  options.scale = Number(values.scale);

try {
  const buffer = readFileSync(inputPath);
  const result = await renderScore(buffer, options);
  result.scoreData.title = inputName;

  mkdirSync(outputDirectory, { recursive: true });

  const pageFiles: string[] = [];
  for (const [index, svg] of result.svgPages.entries()) {
    const filename = `page-${index + 1}.svg`;
    writeFileSync(path.join(outputDirectory, filename), svg);
    pageFiles.push(filename);
  }

  writeFileSync(
    path.join(outputDirectory, "data.json"),
    JSON.stringify({
      elementAttributes: result.elementAttributes,
      midiBase64: result.midiBase64,
      timemap: result.timemap,
    }),
  );

  writeFileSync(
    path.join(outputDirectory, "manifest.json"),
    JSON.stringify({
      data: "data.json",
      pages: pageFiles,
      scoreData: result.scoreData,
    }),
  );

  console.log(`Rendered ${inputPath} -> ${outputDirectory}/`);
  console.log(`  Pages: ${result.scoreData.totalPages}`);
  console.log(`  Timemap entries: ${result.timemap.length}`);
  console.log(`  Element attributes: ${Object.keys(result.elementAttributes).length}`);
}
catch (error: unknown) {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
}
