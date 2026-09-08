import { renton } from "@renton/eslint-config";

export default renton({
  stylistic: {
    quotes: "double",
    semi: true,
  },
}, {
  ignores: ["**/doc_build/**", "**/.worktrees/**", "**/reference/**"],
}, {
  files: ["pnpm-workspace.yaml"],
  name: "trapar/pnpm-workspace-yaml-trust-policy",
  rules: {
    "pnpm/yaml-enforce-settings": "off",
    "yaml/plain-scalar": "off",
  },
});
