---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'ceafbfa4-8c2f-467e-92c0-26e6bd7dafff'
  PropagateID: 'ceafbfa4-8c2f-467e-92c0-26e6bd7dafff'
  ReservedCode1: '39d3a45f-35f0-41b7-ae19-9d9a7dcd912d'
  ReservedCode2: '39d3a45f-35f0-41b7-ae19-9d9a7dcd912d'
---

## 1. 依赖与 store 骨架

- [ ] 1.1 `npm i zustand`，确认版本 4.x/5.x 可装
- [ ] 1.2 新建 `src/store/useAvatarStore.ts`，搭建 `create<AvatarState>()(persist(...))` 骨架，类型 `AvatarState` 声明全部 state + action 签名
- [ ] 1.3 迁移 `loadSaved` 逻辑为 persist 的 `name + partialize` 配置（key `pixel-avatar:save`，只存 `{grid, size}`），确认首屏同步 rehydrate 无闪烁

## 2. 平移状态与 action

- [ ] 2.1 迁移 `size/grid/tool/color/recentColors/mirror/showGrid/currentStyle` 为 store 字段，初始值与旧 hook 一致（含从 localStorage 恢复）
- [ ] 2.2 迁移 `past/future/strokeSnapshot` 从 `useRef` 为 store 普通字段
- [ ] 2.3 实现 `pushHistory/paintCell/fillCell/pickCellColor/applyTool/beginStroke/endStroke/undo/redo/changeSize/clear/loadGrid/pushRecent`，逻辑与旧 hook 逐行等价
- [ ] 2.4 把模块私有 `makeMirrored` 纯函数迁入 store 文件（保持 `cloneGrid/gridEqual` 从 utils 引用不变）
- [ ] 2.5 删除 `historyVersion` —— `canUndo/canRedo` 改 selector 方式（`s => s.past.length > 0`）

## 3. 组件迁移

- [ ] 3.1 改 `App.tsx`：删 `const art = usePixelArt()`，按需 `useAvatarStore` subscribe；`handleRandom/handlePreset` 内改 `useAvatarStore.getState().xxx`；保留 `loading/error/presetGrids` 本地 useState
- [ ] 3.2 改 `Toolbar.tsx`：删除 20-prop `Props` 接口，内部 subscribe 所需字段 + actions；多字段订阅用 `useShallow` 防死循环
- [ ] 3.3 改 `PixelCanvas.tsx`：删 Props，subscribe `grid/size/tool/showGrid` + `beginStroke/applyTool/endStroke/pickCellColor`
- [ ] 3.4 改 `Palette.tsx`：subscribe `color/recentColors` + `pushRecent`
- [ ] 3.5 改 `PreviewPanel.tsx`：subscribe `grid/size`（导出 scale/transparent 保持本地 useState）
- [ ] 3.6 键盘快捷键：在 `App.tsx` 的 `useEffect` 挂全局 keydown，调用 `useAvatarStore.getState()` actions

## 4. 清理

- [ ] 4.1 删除 `src/hooks/usePixelArt.ts`
- [ ] 4.2 确认无残留 import `usePixelArt`，`tsc --noEmit` 零报错

## 5. 验证

- [ ] 5.1 `tsc` 零报错（strict，含 noUnusedLocals/Parameters）
- [ ] 5.2 `npm run build` 通过
- [ ] 5.3 回归：绘制（画笔/橡皮）→ 填充 → 吸管取色 → 镜像绘制，全链路正常
- [ ] 5.4 回归：撤销/重做精确还原（笔触级粒度），按钮 disabled 态正确
- [ ] 5.5 回归：快捷键 B/E/G/I/H/⌘Z/⌘⇧Z 正常
- [ ] 5.6 回归：随机生成 + 预设载入 → 载入画板可编辑
- [ ] 5.7 持久化：刷新后 localStorage `pixel-avatar:save` 的 grid+size 正确恢复
- [ ] 5.8 离线：断网后随机生成 + 预设载入可用
- [ ] 5.9 性能：绘制时仅 PixelCanvas 重渲，Toolbar 不冗余重渲（肉眼/调试确认无全树重渲）

## 6. 收尾

- [ ] 6.1 `openspec validate refactor-zustand-state`
- [ ] 6.2 `openspec archive refactor-zustand-state`（需用户确认）

> AI生成