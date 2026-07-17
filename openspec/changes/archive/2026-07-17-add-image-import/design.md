---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'c739417c-8fa4-4141-bb8a-0fa98b9474b3'
  PropagateID: 'c739417c-8fa4-4141-bb8a-0fa98b9474b3'
  ReservedCode1: 'ae33ad38-c77c-4e30-95df-b0b1ef3955cc'
  ReservedCode2: 'ae33ad38-c77c-4e30-95df-b0b1ef3955cc'
---

# Design: add-image-import

## Context

当前项目已有成熟的 `svgDataUriToGrid` + `scaleGrid` 管道：SVG data URI → Canvas 采样 → PixelGrid。但该管道的输入是 DiceBear SVG（固定 16×16 viewBox），不支持用户上传的任意图片。

需要新增一条 `imageFile → PixelGrid` 管道，核心挑战是**将任意分辨率/色彩空间的图片降采样到目标网格尺寸（16~48），同时保持视觉可辨识度**。

现有 store 的 `loadGrid(newGrid)` 已提供完整的网格替换+undo 历史管理，无需修改。

## Goals / Non-Goals

**Goals:**
- 用户可通过文件选择器上传任意图片
- 上传图片自动像素化为当前画板尺寸的 PixelGrid 并载入
- 像素化结果可立即编辑（绘制/撤销/导出），与随机生成/预设行为一致
- 使用纯 Canvas 最近邻降采样方案，零外部依赖

**Non-Goals:**
- 不做拖拽/粘贴上传（仅 `<input type="file">`）
- 不做像素化参数调节 UI（第一版固定策略）
- 不做导入历史/缩略图缓存
- 不改变现有随机生成/预设流程
- 不做服务端处理（纯浏览器端）

## Decisions

### D1. 纯 Canvas 最近邻降采样（零依赖）

不使用第三方库（pixelit），改用与 `svgDataUriToGrid` 相同的 Canvas 采样模式。理由：

1. **项目已有成熟模式**：`svgDataUriToGrid` 已证明 Canvas + `imageSmoothingEnabled=false` + `getImageData` 管道可靠
2. **零新增依赖**：不需要 pixelit npm 包、不需要手写 .d.ts、不需要管理第三方库版本
3. **完全可控**：居中方裁逻辑直接在 `drawImage(img, sx, sy, sw, sh, 0, 0, n, n)` 中一步完成
4. **最近邻降采样足够**：像素化效果与 svgDataUriToGrid 一致——像素硬边、无抗锯齿

核心流程：

```typescript
// 1. File → dataURL → HTMLImageElement
// 2. 居中方裁 + 最近邻降采样
const cropSize = Math.min(img.naturalWidth, img.naturalHeight)
const sx = Math.floor((img.naturalWidth - cropSize) / 2)
const sy = Math.floor((img.naturalHeight - cropSize) / 2)

const canvas = document.createElement('canvas')
canvas.width = canvas.height = targetSize
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false
ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize)

// 3. 逐像素读取 → PixelGrid
const data = ctx.getImageData(0, 0, targetSize, targetSize).data
// alpha > 32 → #rrggbb，否则 null
```

### D2. 图片→PixelGrid 转换流程

```
用户选择文件
  │
  ▼
FileReader.readAsDataURL → dataURL
  │
  ▼
new Image() → HTMLImageElement (onload)
  │
  ▼
居中方裁 + 最近邻降采样 (Canvas drawImage)
  │  cropSize = min(w, h)
  │  drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize)
  │  imageSmoothingEnabled = false
  │
  ▼
getImageData → 逐像素构建 PixelGrid
  │  alpha > 32 → #rrggbb
  │  alpha ≤ 32 → null
  │
  ▼
store.loadGrid(grid)  ← 复用现有入口
```

### D3. 新增文件 `src/utils/imageImport.ts`

```typescript
/**
 * 将用户上传的图片文件转换为指定尺寸的 PixelGrid。
 * 纯 Canvas 最近邻降采样，零外部依赖。
 * @param file 用户选择的图片文件
 * @param targetSize 目标网格尺寸 (16/24/32/48)
 * @returns Promise<PixelGrid>
 */
export function imageFileToGrid(
  file: File,
  targetSize: number,
): Promise<PixelGrid>
```

内部步骤：
1. 校验文件类型和大小（MIME 白名单 + 10MB 上限）
2. `file` → `dataURL` → `HTMLImageElement`（FileReader + Image onload）
3. 居中方裁 + 最近邻降采样（Canvas drawImage 一步完成）
4. 逐像素读取 → `PixelGrid` 格式

错误处理：
- 非 image 类型 → 抛 Error（含格式信息，UI 显示 Toast）
- 文件过大（>10MB）→ 抛 Error（含文件大小信息）
- 图片加载/解码失败 → 抛 Error

### D4. UI 集成

**Toolbar 变更**：

在"快速生成"面板中，"随机生成头像"按钮下方新增"导入图片"按钮：

```
┌─ 快速生成 ─────────────┐
│  [🎲 随机生成头像]      │  ← 现有
│  [🖼 导入图片]          │  ← 新增（轮廓风格）
│                         │
│  阿杰  米娅  里奥  ...   │  ← 现有预设
└─────────────────────────┘
```

- 按钮样式用 `.primary-btn.full.outline`（轮廓风格，区分主操作）
- 点击触发隐藏的 `<input type="file" accept="image/png,image/jpeg,...">`
- 像素化期间复用现有 `loading` 状态（按钮 disabled）

**App.tsx 变更**：

新增 `handleImport` 函数，模式与 `handleRandom`/`handlePreset` 一致：

```typescript
const handleImport = async (file: File) => {
  setLoading(true)
  setError(null)
  try {
    const { size, loadGrid } = useAvatarStore.getState()
    const grid = await imageFileToGrid(file, size)
    loadGrid(grid)
  } catch (e) {
    setError(e instanceof Error ? e.message : '导入图片失败，请重试')
  } finally {
    setLoading(false)
  }
}
```

Toolbar 新增 prop：`onImport: (file: File) => void`

### D5. 像素化调色板策略（第一版）

第一版不限制调色板，保留原图颜色直接降采样。理由：
- 用户上传的图片色彩各异，强制映射到当前 Palette 色组可能严重失真
- 保留原色给用户最大自由度——载入后可用画笔+Palette 手动调整个别像素
- 后续版本可增加"使用当前调色板"选项做颜色映射

### D6. 图片预处理：居中方裁

用户上传的图片不一定是正方形。处理策略：

```
原始: 400×300
  → 取 min(400,300) = 300
  → 居中裁切为 300×300（水平方向偏移 (400-300)/2 = 50）
  → 缩放到 targetSize × targetSize
  → 像素化
```

实现方式：用 `drawImage(img, sx, sy, sw, sh, 0, 0, targetSize, targetSize)` 做居中裁切+缩放一步完成。

## Risks / Trade-offs

- **[高分辨率照片降采样质量]** → 简单最近邻降采样对照片效果可能不如专业像素化工具，但与现有 svgDataUriToGrid 行为一致，第一版可接受
- **[非正方形图片裁切损失]** → 居中方裁可能丢失重要内容，但保持 grid 方形是硬约束；后续可考虑"裁切模式"选项
- **[大文件内存]** → 10MB 限制 + FileReader（dataURL 模式），内存可控

## Migration Plan

1. 新建 `src/utils/imageImport.ts`，实现 `imageFileToGrid`（纯 Canvas 采样）
2. `App.tsx` 新增 `handleImport` + 传 `onImport` prop 给 Toolbar
3. `Toolbar.tsx` 新增"导入图片"按钮 + 隐藏 file input + `onImport` prop
4. `Icon.tsx` 新增 `image` 图标
5. `App.css` 新增 `.primary-btn.outline` 样式
6. 验证：tsc + build + Playwright 冒烟测试

回滚：删除 imageImport.ts + 还原 Toolbar/App/Icon/CSS 变更。

> AI生成