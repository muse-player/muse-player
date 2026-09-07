import { defineConfig } from "@rspress/core";
import path from "node:path";

export default defineConfig({
  description: "MXL/MusicXML score rendering and playback with React hooks.",
  icon: "/rspress-icon.png",
  lang: "en",
  locales: [
    {
      description: "MXL/MusicXML score rendering and playback with React hooks.",
      label: "English",
      lang: "en",
      title: "Muse Player",
    },
    {
      description: "基于 React Hooks 的 MXL/MusicXML 乐谱渲染与回放。",
      label: "简体中文",
      lang: "zh",
      title: "Muse Player",
    },
  ],
  logo: {
    dark: "/rspress-dark-logo.png",
    light: "/rspress-light-logo.png",
  },
  root: path.join(__dirname, "docs"),
  themeConfig: {
    socialLinks: [
      {
        content: "https://github.com/nicholasXu/mxl-player",
        icon: "github",
        mode: "link",
      },
    ],
  },
  title: "Muse Player",
});
