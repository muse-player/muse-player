---
description: Muse Player monorepo 架构、数据流和包职责。
---

# 架构

## Monorepo 布局

```
muse-player/
  packages/
    core/          # React Hooks + ScoreRenderer 组件
    component/     # PlaybackControls UI（StyleX）
    server/        # Node.js MXL 渲染（Verovio WASM）
    cli/           # muse-render CLI
    instruments/   # 钢琴采样清单
  apps/
    demo/          # React 演示应用（Rsbuild + Tailwind）
  website/         # 本文档站点（Rspress）
```

## 数据流

Muse Player 采用**严格的离线预渲染管线**。浏览器无法解析 MXL/MusicXML 文件 —— 所有渲染在服务端完成，浏览器仅消费预渲染的静态产物。

渲染管线分两个阶段运行：

### 阶段一：预渲染（构建时）

```
MXL 文件（压缩 MusicXML）
  │
  ▼
@muse-player/server  ──  Verovio WASM 工具链
  │
  ├──► SVG 页面（每页一个字符串）
  ├──► MIDI 数据（base64 编码）
  ├──► 时间映射（基于时间的音符开/关事件）
  └──► 元素属性（每个音符的 Verovio 元数据）
```

预渲染可以通过以下方式完成：
- **CLI**：`muse-render score.mxl -o output/` 将静态文件写入磁盘。
- **Node.js API**：`renderScore(buffer)` 在内存中返回所有数据。

### 阶段二：回放（浏览器运行时）

```
静态资源（manifest.json + data.json + page-*.svg）
  │
  ▼
useScore()  ──  加载 manifest，获取数据 + SVG 页面
  │
  ├──► <ScoreRenderer svg={svg} />  渲染当前页面
  │
  ├──► usePlayback(midiBase64, timeMap, ...)  MIDI 回放引擎
  │       │
  │       ├──► onTimeUpdate(time)  →  getElementsAtTime()  →  renderPage()
  │       └──► onNotesUpdate(ids)  →  useNoteHighlight()
  │
  ├──► usePianoSampler()  加载钢琴采样以获得逼真音色
  │
  ├──► useAutoScroll(containerRef, measure, playing)
  │
  └──► <PlaybackControls ... />  播放/暂停/停止/跳转/速度 UI
```

## 包依赖关系

```
@muse-player/cli
  └── @muse-player/server
        └── @muse-player/core（仅类型）

@muse-player/component
  └── @muse-player/core
        └── @muse-player/instruments

Peer 依赖：react >=18, react-dom >=18
```

## 核心技术

| 层级 | 技术 | 用途 |
|------|------|------|
| 渲染 | [Verovio](https://www.verovio.org/) WASM | 将 MusicXML 转换为 SVG，提取 MIDI 和时间映射 |
| 音频 | [Tone.js](https://tonejs.github.io/) | MIDI 回放、音频调度、效果链 |
| MIDI 解析 | [@tonejs/midi](https://github.com/Tonejs/midi) | 将 base64 MIDI 解析为音符事件 |
| UI 样式 | [StyleX](https://stylexjs.com/) | PlaybackControls 的编译时 CSS |
| 构建 | [Rslib](https://lib.rsbuild.dev/) / [Rsbuild](https://rsbuild.dev/) | 包和应用打包 |
| 语言 | TypeScript | 端到端类型安全 |
