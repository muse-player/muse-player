---
description: Muse Player 介绍 —— MXL/MusicXML 乐谱渲染与回放 monorepo。
---

# 介绍

Muse Player 是一个用于在浏览器中渲染和回放 MXL/MusicXML 乐谱的 monorepo。MXL 文件通过 [Verovio](https://www.verovio.org/) WASM 在服务端渲染为 SVG，生成的静态资源（SVG 页面 + MIDI 数据）在浏览器中通过 [Tone.js](https://tonejs.github.io/) 使用逼真的钢琴采样进行回放。

:::warning
`@muse-player/core` **无法**在浏览器中加载或解析原始 MXL/MusicXML 文件。所有 MXL 文件**必须**先由 `@muse-player/server` 或 `muse-render` CLI 进行预渲染。浏览器端的 Hooks 仅消费预渲染后的静态产物（manifest.json、data.json、SVG 页面）。
:::

## 为什么选择 Muse Player

- **React 原生**。所有功能都以可组合的 React Hooks 和组件形式暴露。无需学习命令式 API —— 只需调用 Hooks 并渲染即可。
- **服务端渲染（必需）**。Verovio 渲染在 Node.js 上运行 —— 可通过 CLI 在构建时完成，或通过服务端 API 动态完成。浏览器接收轻量级的 SVG + MIDI 静态资源，零运行时渲染开销。没有客户端 MXL 解析。
- **逼真音色**。内置钢琴采样库（84 个音符，C1 至 B7）和效果链（压缩器 + 混响），实现自然的回放效果。
- **可视化同步**。播放时实时在乐谱上高亮活跃音符，通过颜色编码区分左右手。
- **模块化包**。五个专注的包 —— 按需使用，从完整播放器到仅使用服务端渲染器或 CLI。

## 包列表

| 包 | 描述 |
|---|------|
| `@muse-player/core` | React Hooks，覆盖乐谱加载、MIDI 回放、音符高亮和自动滚动 |
| `@muse-player/component` | UI 组件（PlaybackControls），使用 StyleX 样式化 |
| `@muse-player/server` | Node.js 服务端 MXL 渲染，基于 Verovio WASM |
| `@muse-player/cli` | CLI 工具，用于将 MXL 文件预渲染为静态资源 |
| `@muse-player/instruments` | 钢琴采样清单和音频文件 URL |

## 工作流程

1. **预渲染（必需）**：使用 `@muse-player/server` 或 `muse-render` CLI 将 MXL 文件转换为静态 SVG + MIDI 资源。此步骤为必需；浏览器无法解析 MXL 文件。
2. **加载**：将预渲染的资源作为静态文件部署，然后通过 `useScore` Hook 在 React 应用中加载 manifest。
3. **渲染**：使用 `ScoreRenderer` 组件渲染 SVG 乐谱。
4. **播放**：使用 `usePlayback` 回放 MIDI 数据，可选配合 `usePianoSampler` 获得逼真钢琴音色。
5. **同步**：使用 `useAutoScroll` 和 `useNoteHighlight` 增强体验。

## 下一步

- [快速开始](/guide/start/getting-started) —— 安装包并渲染你的第一份乐谱。
- [架构](/guide/start/architecture) —— 了解 monorepo 布局和数据流。
- [API 参考](/api/) —— 每个包、Hook 和组件的详细文档。
