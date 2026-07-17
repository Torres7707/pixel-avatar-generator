---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'dc303d08-9c1a-45ee-a6f6-1a746c1ac59c'
  PropagateID: 'dc303d08-9c1a-45ee-a6f6-1a746c1ac59c'
  ReservedCode1: 'dc928e94-f462-4ef9-8f88-18031bf951b4'
  ReservedCode2: 'dc928e94-f462-4ef9-8f88-18031bf951b4'
---

# image-import Specification

## Purpose

定义"上传自定义图片 → 像素化 → 可编辑"功能的契约：用户可通过文件选择器上传任意图片，系统将其像素化为当前画板尺寸的 PixelGrid 并载入 store，之后用户可像编辑任何网格一样绘制/撤销/导出。

## ADDED Requirements

### Requirement: 图片上传入口
The system SHALL provide an "导入图片" button in the Toolbar's "快速生成" section, which triggers a native file picker (`<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml">`).

#### Scenario: 点击导入按钮
- **WHEN** 用户点击"导入图片"按钮
- **THEN** 弹出操作系统文件选择器
- **AND** 文件选择器仅显示图片文件类型

#### Scenario: 取消选择
- **WHEN** 用户在文件选择器中取消操作
- **THEN** 无任何状态变化，界面恢复空闲

### Requirement: 图片像素化转换
The system SHALL convert uploaded image files to a PixelGrid of the current canvas size using pure Canvas nearest-neighbor downsampling, with center-crop preprocessing for non-square images.

#### Scenario: 正方形图片导入
- **WHEN** 用户上传一张 200×200 的图片，当前画板尺寸为 32
- **THEN** 图片被降采样到 32×32 像素（最近邻插值，imageSmoothingEnabled=false）
- **AND** 每个像素的颜色保留原图最近邻采样结果
- **AND** 生成的 32×32 PixelGrid 通过 `loadGrid()` 载入 store

#### Scenario: 非正方形图片居中方裁
- **WHEN** 用户上传一张 400×300 的图片，当前画板尺寸为 32
- **THEN** 图片被居中裁切为 300×300（水平偏移 50px）
- **AND** 裁切后的正方形降采样到 32×32
- **AND** 生成的 PixelGrid 载入 store

#### Scenario: 高分辨率图片导入
- **WHEN** 用户上传一张 4000×3000 的照片
- **THEN** 居中方裁 + 降采样正常完成，不出现 OOM 或卡死
- **AND** 降采样结果视觉可辨识（非全黑/全白/纯噪点）

#### Scenario: 透明 PNG 导入
- **WHEN** 用户上传一张含透明区域的 PNG
- **THEN** 透明区域在 PixelGrid 中为 `null`
- **AND** 有色像素正常保留颜色

### Requirement: 像素化结果可编辑
The system SHALL make the pixelated grid fully editable after import, identical to grids from random generation or preset loading.

#### Scenario: 导入后可绘制
- **WHEN** 图片导入完成，网格载入画板
- **THEN** 用户可使用画笔/橡皮/填充/吸管等工具修改像素
- **AND** 撤销/重做可用（导入前的网格在 undo 栈中）

#### Scenario: 导入后可导出
- **WHEN** 图片导入完成
- **THEN** 导出 PNG 和复制到剪贴板功能可用
- **AND** 导出内容为当前（可能已修改的）网格渲染结果

### Requirement: 导入错误处理
The system SHALL handle import errors gracefully with toast messages, without crashing or leaving the UI in a broken state.

#### Scenario: 非图片文件
- **WHEN** 用户选择的文件非图片类型（如 .txt）
- **THEN** 显示错误 toast 提示
- **AND** 画板内容不变

#### Scenario: 文件过大
- **WHEN** 用户选择的图片文件 > 10MB
- **THEN** 显示"文件过大"toast 提示
- **AND** 画板内容不变

#### Scenario: 图片加载失败
- **WHEN** 文件看似图片但实际无法解码（损坏文件）
- **THEN** 显示错误 toast 提示
- **AND** 画板内容不变

### Requirement: 加载状态
The system SHALL show a loading state during image import, consistent with the existing random generation loading UX.

#### Scenario: 导入进行中
- **WHEN** 图片正在读取/像素化
- **THEN** "导入图片"按钮显示 disabled
- **AND** "随机生成头像"按钮同步 disabled
- **AND** 预设按钮同步 disabled

### Requirement: 零外部依赖
The system SHALL implement image pixelation using pure Canvas API (imageSmoothingEnabled=false + getImageData), without any third-party npm packages.

#### Scenario: 无新增 npm 依赖
- **WHEN** 检查 package.json 的 dependencies
- **THEN** 不包含 pixelit、rgbquant 或其他图片处理库
- **AND** imageFileToGrid 仅使用浏览器原生 Canvas API

## Constraints

- 图片处理纯浏览器端，不调用任何服务端 API
- 不使用拖拽/粘贴上传，仅原生 file input
- 第一版不提供像素化参数调节 UI（固定策略：居中方裁 + 原色最近邻降采样）
- 文件大小上限 10MB
- 不新增任何 npm 依赖
- 不修改 store（复用 `loadGrid()`）
- 不修改 PixelCanvas / Palette / PreviewPanel 的渲染逻辑

## ADDED Requirements (continued)

### Requirement: Toolbar 布局扩展
The Toolbar's "快速生成" section SHALL include the new "导入图片" button alongside the existing "随机生成头像" button, with `.primary-btn.full.outline` style (outlined variant to distinguish from the primary action).

#### Scenario: 快速生成区域
- **WHEN** 渲染 Toolbar 快速生成面板
- **THEN** "随机生成头像"按钮下方出现"导入图片"按钮
- **AND** "导入图片"按钮为轮廓风格（非实心填充）

> AI生成