---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '7c431f06-6ee8-4d18-9289-78ee054177df'
  PropagateID: '7c431f06-6ee8-4d18-9289-78ee054177df'
  ReservedCode1: '9b7b0b49-4f26-4974-b2d2-0a7b8855c4ab'
  ReservedCode2: '9b7b0b49-4f26-4974-b2d2-0a7b8855c4ab'
---

## ADDED Requirements

### Requirement: 随机生成像素头像
The system SHALL generate a pixel avatar by calling DiceBear's pixel-art style with a random seed, producing a deterministic avatar per seed, and load it into the editing canvas.

#### Scenario: 随机生成
- **WHEN** 用户点击"随机生成头像"按钮
- **THEN** 系统生成一个随机 seed 并调用当前选定的 DiceBear 像素风格
- **AND** 生成结果经采样后载入画板为 PixelGrid
- **AND** 画板原有内容进入历史栈可撤销

#### Scenario: 多风格随机
- **WHEN** 用户切换风格为 bottts-pixel 并点击随机生成
- **THEN** 系统以随机 seed 调用选定风格生成头像并载入画板

### Requirement: 固定 seed 预设
The system SHALL provide preset avatars backed by fixed seeds bound to a style, replacing the previous hand-coded geometric presets.

#### Scenario: 载入预设
- **WHEN** 用户点击某个预设缩略图
- **THEN** 系统使用该预设绑定的固定 seed 与风格生成头像
- **AND** 生成结果载入画板，画板原内容进入历史栈

#### Scenario: 预设缩略图预渲染
- **WHEN** 应用加载
- **THEN** 每个预设显示其固定 seed 生成结果的缩略图

### Requirement: 生成结果可编辑
The system SHALL load generated avatars into the editing canvas, preserving drawing/mirror/undo/export capabilities.

#### Scenario: 生成后编辑
- **WHEN** 用户随机生成或载入预设后
- **THEN** 生成结果成为画板当前 PixelGrid
- **AND** 画笔/橡皮/填充/吸管、镜像绘制、撤销重做、导出 PNG 全部可用

### Requirement: 生成失败降级
The system SHALL degrade gracefully when generation or sampling fails, without falling back to the removed geometric generator.

#### Scenario: 生成异常
- **WHEN** DiceBear 生成或 SVG 采样抛出异常
- **THEN** 画板保持不变并给出提示
- **AND** 不调用已移除的几何生成算法

> AI生成