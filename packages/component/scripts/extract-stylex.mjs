import { execSync } from "node:child_process";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const temporaryDirectory = path.join(root, "dist-stylex-tmp");

try {
  execSync(
    `npx stylex --input src --output dist-stylex-tmp --useCSSLayers --babelPluginsPre @babel/plugin-transform-typescript @babel/plugin-syntax-jsx`,
    { cwd: root, stdio: "inherit" },
  );

  cpSync(path.join(temporaryDirectory, "stylex_bundle.css"), path.join(root, "dist", "stylex_bundle.css"));

  const indexPath = path.join(root, "dist", "index.js");
  const indexContent = readFileSync(indexPath, "utf8");
  writeFileSync(indexPath, `import "./stylex_bundle.css";\n${indexContent}`);
}
finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
