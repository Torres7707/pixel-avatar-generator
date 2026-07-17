# avatar-store Specification

## Purpose
TBD - created by archiving change refactor-zustand-state. Update Purpose after archive.
## Requirements
### Requirement: 全局 store 单一数据源
The system SHALL manage all avatar-editor application state in a single zustand store, exposed via `useAvatarStore`, replacing the `usePixelArt` hook.

#### Scenario: 组件订阅状态
- **WHEN** 一个组件需要读取某个状态字段
- **THEN** 该组件通过 `useAvatarStore(s => s.<field>)` 精确订阅
- **AND** 仅当被订阅的字段变化时该组件重渲染，其余字段变化不触发

#### Scenario: 组件调用 action
- **WHEN** 一个组件需要触发某个 action（如 `applyTool`、`undo`）
- **THEN** 该组件通过 `useAvatarStore(s => s.<action>)` 获取 action 引用
- **AND** action 引用在 store 生命周期内稳定不变，不因其他状态变化而产生新引用

### Requirement: localStorage 持久化兼容
The system SHALL persist only `{grid, size}` to localStorage under key `pixel-avatar:save` via zustand `persist` middleware, remaining byte-compatible with existing stored data so prior installations load without migration.

#### Scenario: 读取历史数据
- **WHEN** 应用在已存在 `pixel-avatar:save` 旧数据的环境中启动
- **THEN** store 从 localStorage 同步 rehydrate 出 `{grid, size}`
- **AND** 画板显示旧 grid 内容，画板尺寸为旧 size

#### Scenario: 写入持久化
- **WHEN** grid 或 size 发生变化
- **THEN** 持久化层将当前 `{grid, size}` 写入 localStorage
- **AND** 不持久化 tool/color/mirror/showGrid/currentStyle/recentColors/history 等其余字段

### Requirement: 撤销/重做不带计数器 hack
The system SHALL implement undo/redo via `past`/`future` array fields in the store, with `canUndo`/`canRedo` derived as selectors over array length, without a manual history-version counter.

#### Scenario: 派生可撤销状态
- **WHEN** UI 订阅 canUndo
- **THEN** 其值为 `past.length > 0`
- **AND** `past` 数组 push/pop 产生新引用，自然驱动订阅更新，无需额外计数器

#### Scenario: 笔触快照入栈
- **WHEN** 一次绘制笔触结束且 grid 相比笔触开始时发生变化
- **THEN** 笔触开始时拍摄的 grid 快照被推入 `past`
- **AND** `future` 被清空

#### Scenario: 撤销
- **WHEN** 用户触发撤销（⌘Z）
- **THEN** 从 `past` 弹出顶部快照设为当前 grid
- **AND** 当前 grid 被压入 `future`

### Requirement: 键盘快捷键由组件挂载
The system SHALL register global keyboard shortcuts (undo/redo/tool-select/grid-toggle) in a React component's `useEffect`, calling store actions via `useAvatarStore.getState()`.

#### Scenario: 快捷键触发 action
- **WHEN** 用户按下 ⌘Z 且焦点不在输入框内
- **THEN** 调用 `useAvatarStore.getState().undo()`
- **AND** 不因 store 状态变化重复挂载/卸载监听器

