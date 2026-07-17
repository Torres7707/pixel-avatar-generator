---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'c4087f6d-4673-4e6f-b233-0c5b4de2d88d'
  PropagateID: 'c4087f6d-4673-4e6f-b233-0c5b4de2d88d'
  ReservedCode1: '941ad1c2-5c2f-4b7a-b50a-d5f9c0457512'
  ReservedCode2: '941ad1c2-5c2f-4b7a-b50a-d5f9c0457512'
---

## Why

当前头像生成由 `generate.ts` 用椭圆+矩形程序化拼脸，缺少美术资产，生成的像素头像五官抽象、不够形象。引入 DiceBear 专业美术设计的 pixel-art 部件库作为生成源，把形象度提升到"专业像素头像"水准；同时通过光栅化采样保留画板可编辑能力——生成后用户仍能在画板上微调、镜像、导出。

## What Changes

- **新增依赖**：`@dicebear/core` + `@dicebear/styles`（纯前端运行，无网络依赖，离线可用）
- **新增 SVG→PixelGrid 采样模块**：将 DiceBear pixel-art 输出的 16×16 像素 SVG（`shape-rendering="crispEdges"`）光栅化采样为画板 `PixelGrid`，无损还原
- **生成入口重构**：随机生成改为 DiceBear 随机 seed 生成；新增风格切换（pixel-art / bottts-pixel 等）
- **预设模板改造**：现有 8 个手写 preset 改为 DiceBear 固定 seed + 风格映射
- **画板尺寸兼容**：16×16 生成结果载入 24/32/48 画板走最近邻放大，镜像/撤销/导出链路不变
- **回退策略**：生成或采样失败时降级为空画板并提示，不保留旧几何算法（避免维护两套）
- **BREAKING**：移除 `generate.ts` 中的人类/机器人/猫咪/外星人/小怪兽几何风格及对应 preset，以 DiceBear 风格替代

## Capabilities

### New Capabilities
- `avatar-generator`：基于 DiceBear 部件库的像素头像生成能力（随机 seed 生成、固定 seed 预设、多风格切换、生成结果可载入画板编辑）
- `svg-to-grid`：将像素风格 SVG 光栅化采样为可编辑 PixelGrid 的转换能力（crispEdges 无损采样、跨尺寸最近邻适配）

### Modified Capabilities
（无——本项目 `openspec/specs/` 为空，本变更为首批 spec）

## Impact

- **依赖**：新增 `@dicebear/core`、`@dicebear/styles`；均为运行时纯前端包
- **代码**：
  - 新增 `src/utils/dicebear.ts`（DiceBear 调用 + SVG→grid 采样）
  - 重构/移除 `src/utils/generate.ts`
  - 修改 `src/constants.ts`（预设映射、风格列表）
  - 修改 `src/App.tsx` 及 `Toolbar.tsx`（生成入口、风格切换 UI）
- **数据兼容**：localStorage 已存 grid 格式不变，刷新无影响
- **许可证**：DiceBear pixel-art 为 CC0 1.0（公共领域），可自由商用
- **风险**：SVG 含 path + 半透明 rect，采样需光栅化而非直接解析 XML；16×16 + crispEdges 下基本无损，需在 tasks 阶段验证放大到 32/48 的视觉效果

> AI生成