---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'b7f14f00-8949-4e70-9168-745243b202a2'
  PropagateID: 'b7f14f00-8949-4e70-9168-745243b202a2'
  ReservedCode1: '4eaa686d-5d6e-4bf0-aec3-f6b0ba2e298a'
  ReservedCode2: '4eaa686d-5d6e-4bf0-aec3-f6b0ba2e298a'
---

# editor-ui Specification

## Purpose

定义像素头像生成器编辑界面的视觉呈现契约：以星露谷物语风格（温暖木质农场风 + 柔和像素厚边框 + 像素字体）呈现，以角色预览为中心布局，交互功能与生成逻辑解耦。

## ADDED Requirements

### Requirement: 温暖木质农场风视觉主题
The system SHALL apply a warm wood-and-farm visual theme (cream/beige base, medium-brown wood panels, golden + sage-green accents) overriding the prior dark-purple developer-tool aesthetic, using a custom CSS token system without any external UI component library.

#### Scenario: 整体配色
- **WHEN** 用户打开应用
- **THEN** 页面底色为暖米黄
- **AND** 面板呈现木质棕色调
- **AND** 主操作点缀为金黄，次操作点缀为鼠尾草绿
- **AND** 不出现街机/红白机式的冷色霓虹或尖锐锯齿边框

### Requirement: 柔和像素厚边框系统
The system SHALL render panel and button borders as soft pixel-style thick borders using multi-layer box-shadow (inset highlights + zero-blur outer shadow), distinct from sharp 8-bit jagged edges.

#### Scenario: 木质面板边框
- **WHEN** 渲染一个面板或画板容器
- **THEN** 其边框为 3-4px 实线 + 内 inset 高光 + 外零模糊投影
- **AND** 按钮按下时产生凹陷位移

### Requirement: 以角色预览为中心的布局
The system SHALL arrange the editor with the character/avatar preview as the visual center, surrounded by option panels, replacing the prior three-column equal-rail grid.

#### Scenario: 预览中心化
- **WHEN** 应用在宽屏渲染
- **THEN** 角色预览/画板占据视觉中央最大区域
- **AND** 工具/选项面板环绕分布在预览周围
- **AND** 底部设居中主操作按钮条

### Requirement: 像素字体标题
The system SHALL use the Press Start 2P pixel font for primary headings and a retro monospace for body text, loaded via web font.

#### Scenario: 标题字体
- **WHEN** 渲染应用主标题
- **THEN** 使用像素字体呈现（中文降级为加粗等宽 + 字间距模拟）

### Requirement: 交互功能视觉无损
The system SHALL preserve all interaction affordances through the visual redesign: drawing tools, mirror, fill, undo/redo, generation, export all remain fully operational and identifiable.

#### Scenario: 全面板功能保留
- **WHEN** 视觉重构完成
- **THEN** 画笔/橡皮/填充/吸管、镜像、尺寸、风格、随机生成、预设、撤销重做、快捷键、导出 PNG 全部可用
- **AND** 仅视觉呈现变化，无功能增减

## Constraints

- TypeScript strict，不改动 `utils/`、`store/`、`types.ts`、`constants.ts` 中的逻辑
- 不引入外部 UI 组件库（经探索验证均不匹配星露谷风）
- 保留响应式行为，窄屏可用

> AI生成