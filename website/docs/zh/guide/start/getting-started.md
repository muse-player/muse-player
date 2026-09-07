---
description: 安装 Muse Player 包，渲染你的第一份 MXL 乐谱，并将回放功能集成到 React 应用中。
---

# 快速开始

## 前置条件

- Node.js 18+
- pnpm（推荐）或 npm
- 一份 MXL（压缩 MusicXML）乐谱文件

## 安装

从 monorepo 安装你需要的包：

```bash
# 核心 Hooks + 乐谱渲染器组件
pnpm add @muse-player/core

# 播放控制 UI（可选）
pnpm add @muse-player/component

# 服务端渲染 —— MXL 处理所必需（仅 Node.js）
pnpm add @muse-player/server

# CLI 工具 —— 服务端 API 的替代方案（或使用 npx）
pnpm add -D @muse-player/cli
```

:::tip
Peer 依赖 `react` 和 `react-dom`（>=18）必须在你的项目中已安装。
:::

:::warning
你**必须**安装 `@muse-player/server` 或 `@muse-player/cli` 其中之一。`@muse-player/core` 无法解析 MXL 文件 —— 它仅消费由服务端或 CLI 生成的预渲染静态产物。
:::

## 第一步：预渲染 MXL 文件（必需）

MXL 文件无法在浏览器中直接加载。你**必须**先使用 CLI 或服务端 API 将其预渲染为静态资源。

**方式 A：CLI（推荐用于静态站点）**

```bash
npx muse-render score.mxl -o public/score
```

**方式 B：服务端 API（用于动态渲染）**

```ts
import { renderScore } from '@muse-player/server';
import { readFileSync } from 'node:fs';

const buffer = readFileSync('score.mxl');
const result = await renderScore(buffer);
// result 包含 { svgPages, midiBase64, timemap, elementAttributes, scoreData }
```

两种方式产生相同的输出结构：

使用 CLI 时，输出目录如下：

```
public/score/
  manifest.json    # 元数据 —— 将此 URL 传给 useScore()
  data.json        # MIDI 数据、时间映射、元素属性
  page-1.svg       # 渲染后的乐谱 SVG 页面
  page-2.svg
  ...
```

使用服务端 API 时，你会在内存中获得一个 `ScoreRenderResult` 对象。你可以直接从 API 端点提供它，或自行写入磁盘。

## 第二步：加载并渲染乐谱

```tsx
import { useRef, useEffect } from 'react';
import { useScore, ScoreRenderer } from '@muse-player/core';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loadResult, svg, loading, error } = useScore();

  useEffect(() => {
    loadResult('/score/manifest.json');
  }, [loadResult]);

  if (loading) return <p>加载中...</p>;
  if (error) return <p>错误：{error}</p>;

  return <ScoreRenderer containerRef={containerRef} svg={svg} />;
}
```

## 第三步：添加回放功能

```tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import {
  useScore, usePlayback, usePianoSampler, ScoreRenderer,
} from '@muse-player/core';
import { PlaybackControls } from '@muse-player/component';
import '@muse-player/component/style.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

  const {
    loadResult, svg, midiBase64, timeMap,
    getElementsAtTime, getElementAttr, renderPage,
  } = useScore();

  const handleTimeUpdate = useCallback((time: number) => {
    const result = getElementsAtTime(time * 1000);
    if (result.page > 0) renderPage(result.page);
  }, [getElementsAtTime, renderPage]);

  const handleNotesUpdate = useCallback((noteIds: string[]) => {
    setActiveNoteIds(noteIds);
  }, []);

  const { sampler, ready } = usePianoSampler();

  const {
    play, pause, stop, seek, playing,
    currentTime, totalDuration, currentMeasure, tempo, updateTempo,
  } = usePlayback(midiBase64, timeMap, handleTimeUpdate, handleNotesUpdate,
    ready ? { sampler } : null);

  useEffect(() => {
    loadResult('/score/manifest.json');
  }, [loadResult]);

  return (
    <>
      <ScoreRenderer containerRef={containerRef} svg={svg} />
      <PlaybackControls
        playing={playing} currentTime={currentTime} totalDuration={totalDuration}
        currentMeasure={currentMeasure} tempo={tempo}
        onPlay={play} onPause={pause} onStop={stop}
        onSeek={seek} onTempoChange={updateTempo}
      />
    </>
  );
}
```

:::info
`PlaybackControls` 组件需要导入 `@muse-player/component/style.css` 才能正常显示样式。
:::

## 下一步

- [架构](/guide/start/architecture) —— 了解数据流和包职责。
- [API: Core](/api/core) —— 详细的 Hook 签名和返回值。
- [API: Server](/api/server) —— 编程式服务端渲染。
