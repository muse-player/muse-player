import type { ScoreRenderResult } from "@muse-player/core";
import type { VerovioOptions } from "verovio";
import { VerovioToolkit } from "verovio/esm";
import createVerovioModule from "verovio/wasm";

const DEFAULT_OPTIONS: VerovioOptions = {
  adjustPageHeight: true,
  breaks: "auto" as const,
  font: "Leipzig",
  footer: "none",
  header: "none",
  pageWidth: 1300,
  scale: 40,
};

export interface RenderOptions extends VerovioOptions {}

const cachedToolkit: Promise<VerovioToolkit> = (async () => {
  const moduleInstance = await createVerovioModule();
  return new VerovioToolkit(moduleInstance);
})();

export async function renderScore(
  mxlBuffer: ArrayBuffer | Buffer,
  options?: RenderOptions,
): Promise<ScoreRenderResult> {
  const toolkit = await getToolkit();

  toolkit.setOptions({ ...DEFAULT_OPTIONS, ...options });

  const loaded = toolkit.loadZipDataBuffer(toCleanArrayBuffer(mxlBuffer));
  if (!loaded) {
    throw new Error("Failed to load MXL file");
  }

  const pages = toolkit.getPageCount();

  const svgPages: string[] = [];
  for (let page = 1; page <= pages; page++) {
    svgPages.push(toolkit.renderToSVG(page));
  }

  const midiBase64 = toolkit.renderToMIDI();

  const timemap = toolkit.renderToTimemap({ includeMeasures: true });

  const noteIds = new Set<string>();
  for (const entry of timemap) {
    if (entry.on) {
      for (const id of entry.on) noteIds.add(id);
    }
    if (entry.off) {
      for (const id of entry.off) noteIds.add(id);
    }
  }

  const elementAttributes: Record<string, Record<string, string>> = {};
  for (const id of noteIds) {
    elementAttributes[id] = toolkit.getElementAttr(id);
  }

  return {
    elementAttributes,
    midiBase64,
    scoreData: { title: "", totalPages: pages },
    svgPages,
    timemap,
  };
}

async function getToolkit(): Promise<VerovioToolkit> {
  return cachedToolkit;
}

function toCleanArrayBuffer(input: ArrayBuffer | Buffer): ArrayBuffer {
  if (Buffer.isBuffer(input)) {
    const ab = new ArrayBuffer(input.length);
    new Uint8Array(ab).set(input);
    return ab;
  }
  return input;
}
