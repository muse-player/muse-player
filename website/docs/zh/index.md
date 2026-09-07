---
description: Muse Player — 基于 React Hooks 的 MXL/MusicXML 乐谱渲染与回放。
pageType: home

hero:
  name: Muse Player
  text: MXL/MusicXML 乐谱渲染与回放
  tagline: 通过 Verovio 将乐谱渲染为 SVG，配合 Tone.js 实现逼真的钢琴采样回放 —— 全部通过 React Hooks 完成。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/start/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/nicholasXu/mxl-player
  image:
    src: /rspress-icon.png
    alt: Muse Player
features:
  - title: React Hooks API
    details: 可组合的 Hooks，覆盖乐谱加载、MIDI 回放、音符高亮、自动滚动和钢琴采样。消费预渲染的静态资源 —— 无客户端 MXL 解析。
    icon: ⚛️
    link: /api/core
  - title: 服务端渲染（必需）
    details: MXL 文件必须通过 Verovio WASM 在 Node.js 上预渲染为静态 SVG + MIDI。浏览器仅消费这些静态产物 —— 零运行时渲染开销。
    icon: 🖨️
    link: /api/server
  - title: CLI 预渲染
    details: 使用 muse-render CLI 批量将 MXL 文件转换为可直接部署的 SVG 页面、MIDI 数据和 manifest 目录。
    icon: ⚙️
    link: /api/cli
  - title: 逼真钢琴音色
    details: 内置钢琴采样加载，通过 Tone.js 提供压缩器和混响效果链。覆盖 C1 到 B7 共 84 个音符。
    icon: 🎹
    link: /api/instruments
  - title: 可视化音符高亮
    details: 播放时实时高亮乐谱上的活跃音符 —— 右手蓝色、左手红色，清晰区分。
    icon: 🎨
    link: /api/core#usenotehighlight
  - title: Monorepo 架构
    details: 五个专注的包 —— core、component、server、cli 和 instruments —— 各自独立安装，职责清晰。
    icon: 📦
    link: /guide/start/architecture
---
