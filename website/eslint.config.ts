import { rentonReact } from "@renton/eslint-config-react";

export default rentonReact({
  stylistic: {
    quotes: "double",
    semi: true,
  },
}, {
  ignores: ["doc_build/**"],
}, {
  rules: {
    "react/naming-convention-ref-name": "off",
  },
}, {
  files: ["package.json", "tsconfig.json"],
  name: "trapar/config-json-relax",
  rules: {
    "jsonc/sort-keys": "off",
  },
});
