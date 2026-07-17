---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '3c57a55e-3231-4999-9f7e-788e226bdcb5'
  PropagateID: '3c57a55e-3231-4999-9f7e-788e226bdcb5'
  ReservedCode1: 'eccae116-77c3-4046-b84b-b2e55535acf0'
  ReservedCode2: 'eccae116-77c3-4046-b84b-b2e55535acf0'
---

# Proposal: add-image-import

## Why

当前像素头像工坊的初始素材来源仅有两条路径：DiceBear 随机生成和 8 个固定预设。用户如果想基于真实照片或手绘草图创作像素头像，无法实现——必须从零手绘。

"上传图片 → 像素化 → 可编辑"是一条高频需求路径：上传头像照片快速得到像素化基底，再手动调整细节，比纯手绘效率高数倍。

## What Changes

### 核心流程
1. **图片上传入口**：在 Toolbar"快速生成"区域新增"导入图片"按钮，点击弹出文件选择器（accept=图片 MIME 类型）
2. **图片像素化**：利用纯 Canvas API（与 svgDataUriToGrid 相同模式）将上传的任意图片转换为当前画板尺寸的 `PixelGrid`
3. **载入编辑**：像素化结果通过已有的 `loadGrid()` 载入 store，之后用户可像编辑任何网格一样绘制/撤销/导出

### 实现方案：纯 Canvas 最近邻降采样

不引入第三方库（pixelit 等），复用项目已有的 Canvas 采样模式（`svgDataUriToGrid`）：

1. `FileReader.readAsDataURL` → `HTMLImageElement`
2. 居中方裁：取 min(w,h) 为裁切边长，`drawImage(img, sx, sy, cropSize, cropSize, 0, 0, n, n)`
3. 最近邻降采样：`imageSmoothingEnabled = false`
4. 逐像素读取：`getImageData` → alpha > 32 → `#rrggbb`，否则 null
5. `store.loadGrid(grid)`

优势：零新增依赖、完全可控、与现有管道行为一致。

### UI 设计

- Toolbar"快速生成"区域：在"随机生成头像"按钮下方新增"导入图片"按钮（轮廓风格）
- 点击后弹出原生 `<input type="file">`
- 图片读取+像素化期间显示 loading 状态（复用现有 loading 逻辑）
- 像素化完成后自动载入网格，用户立即可以编辑

## Impact

- **新增文件**：`src/utils/imageImport.ts`（图片→PixelGrid 转换逻辑）
- **修改文件**：
  - `src/components/Toolbar.tsx` — 新增导入按钮 + onImport prop
  - `src/App.tsx` — 新增 `handleImport` 处理函数
  - `src/components/Icon.tsx` — 新增 `image` 图标
  - `src/App.css` — 新增 `.primary-btn.outline` 样式
- **不改**：store（`loadGrid` 已满足需求）、PixelCanvas、Palette、PreviewPanel、types.ts、constants.ts、package.json

## Non-goals

- 不做拖拽上传/粘贴上传（仅按钮触发文件选择器，保持简单）
- 不做像素化参数调节 UI（如缩放因子/调色板大小滑块），第一版用默认参数
- 不做导入历史/最近导入记录
- 不做批量导入
- 不改变现有随机生成/预设流程
- 不引入第三方 npm 依赖

> AI生成