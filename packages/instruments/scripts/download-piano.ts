import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIANO_BASE_URL
  = "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function downloadFile(url: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        }
        else {
          file.close();
          fs.unlinkSync(destination);
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        }
      })
      .on("error", (error) => {
        file.close();
        fs.unlinkSync(destination);
        reject(error);
      });
  });
}

function getFileName(note: string, octave: number): string {
  // tonejs-instruments uses 's' for sharp
  return `${note.replace("#", "s")}${octave}.mp3`;
}

async function main() {
  const pianoDirectory = path.resolve(__dirname, "../samples/piano");
  if (!fs.existsSync(pianoDirectory)) {
    fs.mkdirSync(pianoDirectory, { recursive: true });
  }

  console.log("Downloading piano samples...");

  const manifest: Record<string, string> = {};
  const tasks: Promise<void>[] = [];

  // tonejs-instruments covers C1 - G#7 (84 notes, full piano range A0-C8 minus extremes)
  // Octave numbering follows MIDI convention where C marks the octave boundary

  for (let octave = 1; octave <= 7; octave++) {
    for (const note of NOTES) {
      const fileName = getFileName(note, octave);
      const noteKey = `${note}${octave}`;
      const filePath = path.join(pianoDirectory, fileName);

      manifest[noteKey] = fileName;

      if (!fs.existsSync(filePath)) {
        const url = `${PIANO_BASE_URL}${fileName}`;
        tasks.push(
          (async () => {
            await downloadFile(url, filePath);
            console.log(`Downloaded: ${fileName}`);
          })(),
        );
      }
    }
  }

  await Promise.all(tasks);

  fs.writeFileSync(
    path.resolve(__dirname, "../src/piano-manifest.ts"),
    `export const PIANO_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;\n`,
  );

  console.log("Done.");
}

try {
  await main();
}
catch (error) {
  console.error(error);
  process.exitCode = 1;
}
