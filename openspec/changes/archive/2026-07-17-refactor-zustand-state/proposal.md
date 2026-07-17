---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '3b444f8f-0048-4b34-b321-66537de4a171'
  PropagateID: '3b444f8f-0048-4b34-b321-66537de4a171'
  ReservedCode1: '5ad634b9-d773-4e28-90f8-3c30ba60d22b'
  ReservedCode2: '5ad634b9-d773-4e28-90f8-3c30ba60d22b'
---

# Proposal: refactor-zustand-state

## Why

当前头像生成器的全部状态集中在单个自定义 hook `usePixelArt`（299 行），仅在 `App.tsx` 调用一次后通过 props 下传。核心痛点：

- **Prop drilling 严重**：`Toolbar` 接收 **20 个 props**，`App.tsx` 中 23 行在为其逐字段赋值，任何状态变化都触发全树重渲染（无 memo 化）。
- **撤销/重做依赖 hack**：历史栈用 `useRef` 持有，靠手动 `historyVersion` 计数器强制派生量更新——是脆弱的样板代码。
- **持久化手写**：手写 400ms 防抖 + `JSON.stringify` 写 localStorage，逻辑分散在 effect 里。
- **组件无法按需订阅**：`art` 对象被打散为离散 props，子组件无法精确订阅，放大重渲染范围。

迁移到 **zustand + persist 中间件** 可一次性解决以上问题：单一全局 store、组件精确 subscribe、persist 自动管理持久化。

## What Changes

- **新增** `src/store/useAvatarStore.ts`：用 `create<AvatarState>()(persist(...))` 创建全局 store，平移 `usePixelArt` 的全部状态与逻辑。
- **新增** zustand 依赖（`npm i zustand`）。
- **迁移** `App.tsx` + `Toolbar.tsx` + `PixelCanvas.tsx` + `Palette.tsx` + `PreviewPanel.tsx`：从 props 接收改为各自 `useAvatarStore(s => ...)` 精确订阅。
- **删除** `historyVersion` hack：`canUndo/canRedo` 改由 selector 基于 `past.length/future.length` 计算。
- **删除** 手写 400ms 防抖 effect：由 `persist` 中间件 `partialize: {grid, size}` 托管，复用原 localStorage key `pixel-avatar:save`，**与历史数据完全兼容**。
- **删除** `src/hooks/usePixelArt.ts`：逻辑平移完成后移除（或保留空壳，待确认）。

## Impact

- **不改动**：`utils/canvas.ts`、`utils/dicebear.ts`、`types.ts`、`constants.ts`、`Icon.tsx`、`App.css`、`index.css` —— 全部纯函数 / 纯样式，与状态管理解耦。
- **行为不变**：绘制 / 镜像 / 填充 / 撤销重做 / 快捷键 / localStorage 持久化 / 离线生成全链路行为与现状一致，仅状态承载层从 hook 迁到 store。
- **风险**：撤销/重做的时序（`beginStroke`/`endStroke` 快照、`pushHistory` 入栈时机）需在迁移后回归测试，确保与旧逻辑逐字节等价。

## Non-goals

- 不改任何 CSS / 视觉样式 —— UI 改造属于独立 change `redesign-stardew-ui`。
- 不改业务逻辑（笔触、镜像、填充、尺寸裁切、导出算法）。
- 不增加状态字段或新功能。

> AI生成