import { defineConfig } from "@rsbuild/core";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { pluginReact } from "@rsbuild/plugin-react";
import tailwind from "@tailwindcss/postcss";
import path from "node:path";
import process from "node:process";
import TurboConsole from "unplugin-turbo-console/rspack";

const instrumentsSamplesDirectory = path.resolve(__dirname, "../../packages/instruments/samples");

function normalizeBasePath(): string {
  const raw = process.env.BASE_PATH?.trim();
  if (!raw || raw === "/") {
    return "/";
  }
  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;
  return prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
}

const basePath = normalizeBasePath();
const isUseSubpath = basePath !== "/";
const isEnableTurboConsole = process.env.NODE_ENV === "development";

export default defineConfig({
  ...(isUseSubpath && {
    output: { assetPrefix: basePath },
    server: { base: basePath },
  }),
  plugins: [
    pluginReact(),
    pluginNodePolyfill({
      globals: {
        Buffer: false,
        process: false,
      },
    }),
  ],
  server: {
    publicDir: [
      { name: "public" },
      { name: instrumentsSamplesDirectory },
    ],
  },
  source: {},
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [tailwind],
      },
    },
    rspack: {
      plugins: [
        ...(isEnableTurboConsole ? [TurboConsole()] : []),
      ],
    },
  },
});
