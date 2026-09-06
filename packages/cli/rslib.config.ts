import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      bundle: true,
      dts: false,
      format: "esm",
      source: {
        entry: {
          cli: "./src/cli.ts",
        },
      },
    },
  ],
  output: {
    target: "node",
  },
});
