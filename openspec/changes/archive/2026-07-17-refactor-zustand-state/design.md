---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '6c9dddb9-3b26-4f11-b5f5-ca780408eafd'
  PropagateID: '6c9dddb9-3b26-4f11-b5f5-ca780408eafd'
  ReservedCode1: '0b39f9de-abd6-4612-a2d3-2f2656d517b6'
  ReservedCode2: '0b39f9de-abd6-4612-a2d3-2f2656d517b6'
---

# Design: refactor-zustand-state

## Context

当前状态全部集中在 `src/hooks/usePixelArt.ts`（299 行），仅在 `App.tsx` 调一次后 props 下传。状态包括：`size/grid/tool/color/recentColors/mirror/showGrid/currentStyle` + 历史栈（`past/future` ref）+ `historyVersion` 计数器 + `strokeSnapshot` ref。持久化手写 400ms 防抖，仅存 `{grid, size}` 到 key `pixel-avatar:save`。键盘快捷键挂在 hook 内的 `useEffect` 全局监听。

工具函数 `canvas.ts`（drawGrid/exportPNG/gridToDataURL）、`dicebear.ts`（generateAvatarGrid）是纯函数，与状态层解耦，零改动。

约束：TypeScript strict、纯前端离线、localStorage 持久化、行为逐项等价。

## Goals / Non-Goals

**Goals:**
- 单一全局 zustand store 取代 `usePixelArt` hook
- 组件按需 subscribe，消除 prop drilling，App 退化为布局壳
- `persist` 中间件托管 localStorage，行为与现有 `{grid, size}` + key `pixel-avatar:save` 完全兼容
- 删除 `historyVersion` hack，撤销/重做用 selector

**Non-Goals:**
- 不改 CSS / 视觉
- 不改业务算法（笔触/镜像/填充/裁切/导出）
- 不加新状态字段或新功能

## Decisions

### D1. store 形状：扁平 state + action 同层

zustand 推荐扁平结构（state 与 action 同在 store 根），而非嵌套 `{state, actions}`。理由：selector 简洁（`s => s.tool`）、`set` 合并天然、persist 序列化直观。

```ts
interface AvatarState {
  // —— 状态 ——
  size: GridSize
  grid: PixelGrid
  tool: Tool
  color: string
  recentColors: string[]
  mirror: MirrorMode
  showGrid: boolean
  currentStyle: string
  past: PixelGrid[]
  future: PixelGrid[]
  strokeSnapshot: PixelGrid | null
  // —— actions ——
  setTool / setColor / setMirror / setShowGrid / setStyle: (v) => void
  pushRecent: (c: string) => void
  applyTool: (x: number, y: number) => void
  pickCellColor: (x: number, y: number) => void
  beginStroke: () => void
  endStroke: () => void
  undo: () => void
  redo: () => void
  changeSize: (n: GridSize) => void
  clear: () => void
  loadGrid: (g: PixelGrid) => void
}
```

### D2. useRef → 普通字段

`past/future`（历史栈）和 `strokeSnapshot`（笔触快照）在旧 hook 中用 `useRef` 持有，因为不需要触发渲染。在 zustand 中它们迁为 **store 内普通字段**，配合 `set` 更新。理由：
- zustand 的 `set` 是浅合并，只在订阅了对应字段的组件触发更新
- 撤销/重做的 UI（按钮 disabled 态）改 subscribe `s => s.past.length > 0`，`past` 数组变化自然驱动更新
- 不再需要 `historyVersion` 计数器——它是纯粹为绕过 ref 不触发渲染而存在的 hack

注意：`past/future` 入 push 栈要新建数组引用（`set(s => ({ past: [...s.past, prev] }))`），确保引用变化触发 selector。

### D3. persist 中间件配置

```ts
export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'pixel-avatar:save',                        // 复用原 key，兼容历史数据
      partialize: (s) => ({ grid: s.grid, size: s.size }), // 只存这两项，与现状一致
    }
  )
)
```

要点：
- **复用 key**：现有 localStorage `pixel-avatar:save` 存的是 `{grid, size}` 的 JSON。persist 默认整体序列化，但 `partialize` 只输出这两字段，结构完全兼容，**旧数据可直接读取**。
- **防抖**：persist 默认同步写。原 400ms 防抖是为避免连续绘制频繁写。zustand v4 的 persist 支持 `createJSONStorage` + 自定义 storage，但更简单的方式：接受同步写（localStorage 写入对 32×32=1024~2048 字符的 JSON 性能开销可忽略），或在 store 外包一层 debounce。倾向去掉防抖——实测绘制时 grid 变化频率不至于拖垮 localStorage。

### D4. 撤销/重做的时序等价

旧逻辑时序：
1. `beginStroke()`：在 pointerdown 时拍当前 grid 快照存入 `strokeSnapshot`
2. 绘制：`applyTool(x,y)` 直接 `setGrid`（多次，每像素一次）
3. `endStroke()`：若快照与当前 grid 不同 → `pushHistory(strokeSnapshot)` 入 past，清空 future，清空 strokeSnapshot

迁移后完全等价，差异仅在载体：
- `strokeSnapshot` 从 ref 变 store 字段
- `pushHistory` 从操作 `past.current.push` 变 `set(s => ({ past: [...s.past, snap], future: [] }))`
- `undo/redo` 同理用 `set` 操作 past/future + grid

### D5. 组件 subscribe 策略

| 组件 | 订阅字段 | 备注 |
|---|---|---|
| App.tsx | `currentStyle`（handleRandom 用） + actions | 退化为布局壳，保留 `loading/error/presetGrids` 本地 useState |
| Toolbar | `tool/mirror/showGrid/size/currentStyle/canUndo(canRedo)/loading` + 相关 actions | 删除 20-prop 接口 |
| PixelCanvas | `grid/size/tool/showGrid` + `beginStroke/applyTool/endStroke/pickCellColor` | 绘制时仅 grid 变化重渲 |
| Palette | `color/recentColors` + `pushRecent` | |
| PreviewPanel | `grid/size` | 导出 scale/transparent 保持本地 useState |

selector 注意：多字段订阅用 `useAvatarStore(s => s.tool)` 逐个取，或用 `useShallow`（zustand 提供的 shallow 比较工具）包多字段对象，避免每次 set 产生新引用导致死循环。

### D6. 键盘快捷键挂载

旧逻辑在 hook 的 `useEffect` 内挂全局 keydown。迁移后：
- 在 `App.tsx` 的 `useEffect` 内挂一次全局监听，调用 `useAvatarStore.getState().undo()` 等
- 或在 store 模块顶层初始化时挂载（不依赖 React 生命周期）
- 倾向方案一：保持在 React 树内，遵循组件生命周期，SSR 安全

### D7. 纯函数复用

`makeMirrored`（文件底部函数）、`loadSaved` 迁移：
- `makeMirrored` 是纯函数，可直接从 `usePixelArt.ts` 提取到 store 文件内或保留在 utils
- 倾向：保留在 store 文件内（模块私有），因为只有 store 的 fillCell 使用

## Risks / Trade-offs

- **[persist 同步写 vs 防抖]** → 倾向去掉防抖，实测确认绘制频率可接受；若不行再用 `createJSONStorage` 包 debounce
- **[selector 死循环]** → 多字段对象订阅必须用 `useShallow`，否则每次 set 返回新对象导致无限重渲。这是 zustand 最常见坑
- **[历史栈大对象拷贝]** → `past` 存的 `PixelGrid` 是 `(string|null)[][]`。旧逻辑用 `cloneGrid` 深拷贝；迁移后保持同样的 `cloneGrid` 调用，确保 undo 时 get 的是独立副本
- **[StrictMode 双调用]** → zustand 的 action 不受 StrictMode 双调用影响（纯 set 合并幂等），但快捷键 effect 需确保 cleanup 正确

## Migration Plan

1. `npm i zustand`
2. 新建 `src/store/useAvatarStore.ts`：平移全部 state + action，配置 persist
3. 改 `App.tsx`：删 `usePixelArt()`，按需 subscribe + actions；handleRandom/handlePreset 内 `art.xxx` → `useAvatarStore.getState().xxx`
4. 改 `Toolbar.tsx`：删 Props 接口，内部 subscribe
5. 改 `PixelCanvas.tsx`：删 Props，subscribe grid/size/tool/showGrid + actions
6. 改 `Palette.tsx`：subscribe color/recentColors/pushRecent
7. 改 `PreviewPanel.tsx`：subscribe grid/size
8. 删 `src/hooks/usePixelArt.ts`
9. `tsc` 零报错 + `npm run build`
10. Playwright 回归：绘制→镜像→填充→撤销重做→快捷键→随机/预设生成→刷新持久化→离线

回滚：store 改动集中在新文件 + 组件 import 切换，`git revert` 即可恢复 usePixelArt。

## Open Questions

- `loadSaved()` 的同步读取在旧 hook 中用 `useRef` 包裹（首屏即有数据）。persist 中间件是异步 rehydrate 还是从 storage 同步初始化？需确认 zustandpersist 首屏是否有 hydration 闪烁。(倾向：localStorage 同步可读，persist 默认同步 hydrate，无闪烁；如遇闪烁用 `skipHydration:false` 确认)

> AI生成