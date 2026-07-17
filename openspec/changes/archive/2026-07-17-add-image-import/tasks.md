---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '15da7041-87a1-45be-be53-94eba493b0d6'
  PropagateID: '15da7041-87a1-45be-be53-94eba493b0d6'
  ReservedCode1: 'fa64d6a3-ccc0-4fac-8889-b2d31f368fed'
  ReservedCode2: 'fa64d6a3-ccc0-4fac-8889-b2d31f368fed'
---

## 1. 图片转换工具

- [x] 1.1 新建 `src/utils/imageImport.ts`，导出 `imageFileToGrid(file: File, targetSize: number): Promise<PixelGrid>`
- [x] 1.2 实现 File → dataURL → HTMLImageElement 转换（FileReader.readAsDataURL + Image onload）
- [x] 1.3 实现居中方裁逻辑：非正方形图片取 min(w,h) 居中裁切为正方形
- [x] 1.4 实现纯 Canvas 最近邻降采样：imageSmoothingEnabled=false + drawImage(sx,sy,sw,sh,0,0,n,n)
- [x] 1.5 实现逐像素读取 → PixelGrid：alpha > 32 → #rrggbb，否则 null
- [x] 1.6 实现 10MB 文件大小限制前置检查
- [x] 1.7 实现文件类型校验（MIME 白名单）
- [x] 1.8 错误处理：非图片文件/文件过大/加载失败/解码失败 → 抛有意义的错误消息

## 2. UI 集成

- [x] 2.1 `Toolbar.tsx` 新增 `onImport` prop（类型 `(file: File) => void`）
- [x] 2.2 `Toolbar.tsx` 新增"导入图片"按钮（`.primary-btn.full.outline` 样式，image 图标）
- [x] 2.3 `Toolbar.tsx` 新增隐藏 `<input type="file" accept="image/png,...">`，按钮点击触发
- [x] 2.4 `App.tsx` 新增 `handleImport(file: File)` 函数：调用 `imageFileToGrid` → `loadGrid`
- [x] 2.5 `App.tsx` 将 `onImport` prop 传递给 Toolbar
- [x] 2.6 加载状态：导入中按钮 disabled，同步禁用随机/预设按钮
- [x] 2.7 `Icon.tsx` 新增 `image` 图标（图片/照片图标）
- [x] 2.8 `App.css` 新增 `.primary-btn.outline` 样式

## 3. 验证

- [x] 3.1 `tsc --noEmit` 零报错
- [x] 3.2 `npm run build` 通过
- [x] 3.3 Playwright 冒烟测试：上传正方形图片 → 网格载入 → 可绘制
- [x] 3.4 Playwright 冒烟测试：imageFileToGrid 单元测试（32×32 网格，704 非透明像素）
- [x] 3.5 回归测试：随机生成功能正常（不受影响）

## 4. 收尾

- [ ] 4.1 `openspec validate add-image-import`
- [ ] 4.2 `openspec archive add-image-import`（需用户确认）

> AI生成