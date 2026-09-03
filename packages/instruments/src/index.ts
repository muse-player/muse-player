import { PIANO_MANIFEST } from "./piano-manifest";

export { PIANO_MANIFEST } from "./piano-manifest";

export const PIANO_CDN_URL = "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/";

export function getPianoSampleUrls(baseUrl?: string): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [note, fileName] of Object.entries(PIANO_MANIFEST)) {
    urls[note] = `${baseUrl ?? PIANO_CDN_URL}${fileName}`;
  }
  return urls;
}
