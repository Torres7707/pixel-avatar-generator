---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '72d165a2-969f-4d26-bbd8-4ca5f791c75d'
  PropagateID: '72d165a2-969f-4d26-bbd8-4ca5f791c75d'
  ReservedCode1: 'c8ce5c1e-9345-411a-b7d3-2db5c2cdfceb'
  ReservedCode2: 'c8ce5c1e-9345-411a-b7d3-2db5c2cdfceb'
---

## Context

当前生成逻辑 `src/utils/generate.ts` 用椭圆+矩形程序化拼脸，无美术资产，五官抽象。画板核心数据结构 `PixelGrid = (string|null)[][]`，状态由 `usePixelArt` hook 管理，localStorage 持久化，渲染走 Canvas 2D（`imageSmoothingEnabled=false`）。

约束：纯前端无后端、需离线可用、TypeScript strict、保留现有画板编辑/镜像/撤销/导出链路。

引入 DiceBear（`@dicebear/core@10.3` + `@dicebear/styles@10.2`）：pixel-art 风格输出 `viewBox="0 0 16 16"` + `shape-rendering="crispEdges"` 的 16×16 像素 SVG，许可证 CC0 1.0。

## Goals / Non-Goals

**Goals:**
- 用 DiceBear pixel-art 部件库替代几何生成，提升形象度
- 生成结果无损采样进 `PixelGrid`，保留画板编辑/镜像/撤销/导出
- 支持随机 seed 生成 + 固定 seed 预设 + 风格切换
- 纯前端离线运行（npm 包本地生成，不依赖 HTTP API）

**Non-Goals:**
- 不做 AI 生成 / 照片转像素
- 不一次性接入 DiceBear 全风格（仅 pixel 系起步，可扩）
- 不改画板尺寸体系（仍 16/24/32/48）
- 不做部件级微调 UI（仅"再随机 / 载预设"粒度）

## Decisions

### D1. 本地 npm 包而非 HTTP API
选 `@dicebear/core` + `@dicebear/styles` 本地生成 SVG，而非 `api.dicebear.com`。
- 理由：离线可用、无网络抖动、无 QPS/隐私顾虑。
- 备选：HTTP API（零依赖但需联网、有请求开销）。否决。

### D2. SVG→PixelGrid 走光栅化采样，不解析 XML
流程：DiceBear 产 SVG 字符串 → `new Blob([svg], {type:'image/svg+xml'})` → `URL.createObjectURL` → `Image.onload` → draw 到 16×16 canvas（`imageSmoothingEnabled=false`）→ `getImageData(0,0,16,16)` → 每 pixel：`alpha>阈值→#rrggbb`，否则 `null` → 16×16 `PixelGrid`。
- 理由：SVG 含 `<path>` 像素路径与半透明 `<rect>` 高光，直接解析 XML 无法得到混合后颜色；光栅化得最终可视颜色，精确且简单。`crispEdges` + 16×16 对齐 1:1，无抗锯齿损耗。
- 备选：解析 `<rect>` 的 x/y/fill 矩阵。否决（path 与 fill-opacity 无法处理）。

### D3. 半透明像素阈值策略
`alpha > 32` 算可见，取 rgb（半透明白色高光在底色上采样成浅色，自然保留）；`alpha ≤ 32` 算透明 → `null`。
- 理由：DiceBear 高光用 `white` `fill-opacity 0.3~0.5`，光栅化后即浅色像素，保留 rgb 即还原视觉，无需额外 alpha 合成。
- 取舍：边缘可能有 1px 近似瑕疵，可接受。tasks 阶段实证调阈值。

### D4. 跨尺寸最近邻放大
生成恒产 16×16 grid；新增 `scaleGrid(src16, n)`：`out[y][x] = src[⌊y*16/n⌋][⌊x*16/n⌋]`。App 生成时若 `art.size !== 16` 则先 `scaleGrid` 再 `loadGrid`，保持画板当前尺寸不动。
- 理由：单一生成尺寸简化逻辑；最近邻保像素硬边无插值模糊。
- 备选：让 DiceBear 直接产 32×32。否决（pixel-art 风格固定 16×16 viewBox，16 是其设计分辨率）。

### D5. 风格与预设数据模型
`STYLE_OPTIONS: [{key, name}]` = `[pixel-art 像素人, bottts-pixel 像素机器人]`（起步）。
`PRESET: { id, name, style: key, seed: string }`，取代旧 `{styleIndex, seed}`。
缩略图：沿用现有 `presetGrids` useMemo 模式，启动时用各 preset 的 style+seed 生成 16×16 grid → `gridToDataURL` 缓存。
随机：当前 style + 随机 seed 字符串。

### D6. 失败降级
生成 + 采样包 `try/catch`；失败 → `console.error` + 顶部提示条，画板不变，不 fallback 旧几何算法。
- 理由：避免维护两套；本地包生成失败极罕见。

### D7. 异步化生成入口
`svgToGrid` 是 async（`Image.onload`）。`handleRandom`/`handlePreset` 改 async；加载中 disable 按钮防重复。
- 理由：不阻塞 UI，避免重复点击并发生成。

## Risks / Trade-offs

- **[SVG 光栅化在 16×16 下半透明高光有 1px 级近似]** → 阈值策略 + 实测调参；视觉无损可接受
- **[DiceBear 10.x 实际 import/API 细节需实现验证]** → tasks 第一步先写最小 spike 验证 `@dicebear/core`/`@dicebear/styles` 导入与 `avatar.toString()` 是否返回 SVG，确认后再铺开
- **[@dicebear/styles 包体积可能较大]** → 仅 import 用到的单风格定义；若过大改用单风格子包 `@dicebear/collection` 按需引入
- **[16→48 放大后"马赛克"过大]** → 属像素画正常观感；若观感不佳可加"随机生成时自动切到 16×16 画板"选项
- **[旧 generate.ts 移除后 localStorage 历史数据兼容]** → grid 格式不变，无迁移成本

## Migration Plan

1. `npm i @dicebear/core @dicebear/styles`
2. 新增 `src/utils/dicebear.ts`：spike 验证 API → 定型 `svgToGrid(svg)` / `scaleGrid(grid, n)` / `generateAvatar(style, seed)`
3. 改 `src/constants.ts`：`STYLE_OPTIONS` + 新 `PRESETS`
4. 删 `src/utils/generate.ts` 几何风格；更新 `App.tsx`/`Toolbar.tsx` import
5. `usePixelArt` 增 `currentStyle`；App 加风格切换 UI；`handleRandom`/`handlePreset` 异步化
6. `tsc` + dev 实测：形象度 / 多 seed / 16↔32↔48 尺寸切换 / 镜像 / 撤销 / 导出 / 拔网离线
7. `openspec validate` → `openspec archive`

回滚：生成相关改动集中在新文件 + 少数入口，`git revert` 即可。

## Open Questions

- 风格起步范围：`pixel-art` + `bottts-pixel` 是否够？`fun-emoji` 要不要一并加？（倾向：先 2 个，按需扩）
- 随机生成是否随风格把画板切到 16×16？（倾向：保持当前尺寸 + 放大，由 D4 处理）

## 实现偏差备注（spike 验证后）

实现阶段经 spike 验证，与上述设计有两处偏差，已调整落地：

1. **风格定义偏差（D5）**：`@dicebear/styles` 10.2 包中**不存在 `bottts-pixel`** 风格（仅有矢量 `bottts` + 像素 `pixel-art`/`pixel-art-neutral`）。实际改为以 `pixel-art` 为基底 + 3 个背景主题变体（暖底 `#ffd5b8`/冷底 `#b8d5ff`/暗底 `#1a1a2e`），通过 DiceBear `backgroundColor` option 区分，`STYLE_OPTIONS` 为「像素人/暖底/冷底/暗底」4 项。

2. **SVG→grid 获取方式偏差（D2/D7）**：DiceBear 10.x 实际提供 `avatar.toDataUri()` **同步**返回 data URI，不需要 design 中设计的 `Blob → URL.createObjectURL` 异步构造。实际采用 `toDataUri()` → `<img>.src` → `drawImage` 到 16×16 canvas → `getImageData` 采样。grid 转换仍含 `Image.onload` 异步部分，故 `svgToGrid` 整体仍为 async（D7 的异步化结论不变）。

> AI生成