---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'a0fae306-2018-42c7-a4e2-bc64f5875bec'
  PropagateID: 'a0fae306-2018-42c7-a4e2-bc64f5875bec'
  ReservedCode1: '45292a83-6a77-43c2-a4a6-1fe43b20a517'
  ReservedCode2: '45292a83-6a77-43c2-a4a6-1fe43b20a517'
---

# Proposal: redesign-stardew-ui

## Why

当前头像生成器界面是暗紫调三栏 grid（244px 工具栏 / 自适应画板 / 308px 预览+调色），等宽字体、毛玻璃 header，视觉密度高且偏"开发者工具"气质。用户希望改为类似**星露谷物语新建角色界面**的风格：居中角色预览 + 环绕的木质面板 + 暖色农场质感 + 像素字体。

经探索确认：不存在现成的星露谷风 UI 组件库——NES.css、8bitcn、Pxlkit 三大像素风库经视觉验证均为街机/红白机冷硬风（白底/暗底 + 尖锐锯齿 + 冷色霓虹），与星露谷温暖木质农场风差异极大。因此走**纯自定义 CSS** 路线：在现有 token 体系上重构，不引入外部 UI 库。

## What Changes

- **token 重构**（`index.css :root`）：紫色调 → 木质暖色系（米黄底/中棕面板/金+鼠尾草绿点缀），新增像素边框/木纹/阴影 token，引入 Press Start 2P 像素字体做标题
- **布局重组**（`App.tsx` + `App.css`）：三栏 grid → 以角色预览为中心的放射布局；PreviewPanel 升格为页面视觉中心；Toolbar 拆为环绕中心的分组面板
- **像素边框系统**：新增 CSS mixin 做星露谷风"柔和像素厚边框"（多层 box-shadow 模拟，非尖锐锯齿），应用于所有面板/按钮/画板
- **组件换皮**：Toolbar/PixelCanvas/Palette/PreviewPanel 视觉重做（木质质感 + 像素边框 + 暖色），交互逻辑不变
- **依赖**：第二个 change 依赖 `refactor-zustand-state` 完成（store 迁移后组件可直接 subscribe，重组布局无 props 耦合拖累）

## Impact

- **不改动**：`utils/canvas.ts`、`utils/dicebear.ts`、`types.ts`、`constants.ts`、`store/useAvatarStore.ts` —— 纯逻辑/状态层，与视觉解耦
- **交互行为不变**：绘制 / 镜像 / 填充 / 撤销重做 / 快捷键 / 生成 / 导出全链路功能不变，仅视觉呈现变化
- **响应式**：保留并调整响应式断点，确保窄屏可用

## Non-goals

- 不改状态管理逻辑（store 由 `refactor-zustand-state` 负责）
- 不改业务算法
- 不引入外部 UI 组件库（验证后均不匹配，仅引入 Press Start 2P 字体）
- 不重构 Icon.tsx（功能图标保留，可选新增少量像素装饰 sprite）

> AI生成