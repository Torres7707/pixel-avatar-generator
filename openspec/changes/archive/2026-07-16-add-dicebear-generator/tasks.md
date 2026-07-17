---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'b49e4451-bed2-4e43-a13b-01fa60855b46'
  PropagateID: 'b49e4451-bed2-4e43-a13b-01fa60855b46'
  ReservedCode1: '5a546f2a-e6e7-4b4d-b00c-c9d2c5947c97'
  ReservedCode2: '5a546f2a-e6e7-4b4d-b00c-c9d2c5947c97'
---

## 1. Spike 验证 DiceBear API（首要风险）

- [x] 1.1 `npm i @dicebear/core @dicebear/styles`，确认版本 10.x 可装
- [x] 1.2 在 `.temp/` 写最小脚本：`import` core+style，用 pixel-art + seed 生成，确认返回 SVG 字符串（验证 `avatar.toString()` / `createAvatar().toString()` API 形态）
- [x] 1.3 确认 SVG 为 `viewBox="0 0 16 16"` + `shape-rendering="crispEdges"`，含 `<path>`/半透明 `<rect>`
- [x] 1.4 验证按需引入单风格的方式（控制包体积），若 `@dicebear/styles` 过大改子包按需

## 2. 新增 SVG→PixelGrid 采样模块

- [x] 2.1 新增 `src/utils/dicebear.ts`
- [x] 2.2 实现 `svgToGrid(svg): Promise<PixelGrid>`：Blob→Image→draw 到 16×16 canvas（`imageSmoothingEnabled=false`）→ `getImageData` → `alpha>32` 取 `#rrggbb` 否则 `null`
- [x] 2.3 实现 `scaleGrid(src, n)`：最近邻 `out[y][x]=src[⌊yu/n⌋][⌊xu/n⌋]`，支持 16→24/32/48
- [x] 2.4 实现 `generateAvatar(style, seed): Promise<string>`：调 DiceBear 产 SVG 字符串
- [x] 2.5 类型与单元自测：固定 seed 产 grid，对比同 seed 两次结果一致（确定性）

## 3. 改造常量与数据模型

- [x] 3.1 `src/constants.ts` 新增 `STYLE_OPTIONS: [{key:'pixel-art',name:'像素人'},{key:'bottts-pixel',name:'像素机器人'}]`
- [x] 3.2 `PRESETS` 改为 `{ id, name, style: key, seed: string }[]`，8 个固定 seed 映射到 pixel-art/bottts-pixel
- [x] 3.3 删除旧 `generate.ts` 的几何风格（genHuman/Robot/Cat/Alien/Monster）及 `STYLES`/旧 `PRESETS`

## 4. 接入状态与生成入口

- [x] 4.1 `usePixelArt` 增加 `currentStyle`（默认 `'pixel-art'`）与 `setStyle`
- [x] 4.2 `handleRandom` 改 async：`generateAvatar(currentStyle, 随机seed)` → `svgToGrid` → 若 `size!==16` 先 `scaleGrid` → `loadGrid`，失败 try/catch 提示
- [x] 4.3 `handlePreset` 改 async：用 preset.style + seed 同流程
- [x] 4.4 生成中 disable 对应按钮防重复点击（D7）

## 5. UI 适配

- [x] 5.1 `Toolbar.tsx` 「快速生成」区加风格切换 seg 控件，绑定 `currentStyle`/`setStyle`
- [x] 5.2 预设缩略图 `presetGrids` useMemo 改用新 `PRESETS`（style+seed 生成 16×16 grid → `gridToDataURL`）
- [x] 5.3 更新 import（移除 `generate.ts` 依赖，改引用 `utils/dicebear`）
- [x] 5.4 失败提示条：生成异常时顶部显示中文提示，可关闭

## 6. 验证

- [x] 6.1 `tsc` 零报错（strict，含 noUnusedLocals/Parameters）
- [x] 6.2 `npm run build` 通过
- [x] 6.3 dev 实测形象度：随机多 seed 出不同头像，五官清晰
- [x] 6.4 风格切换：pixel-art ↔ bottts-pixel 均正常生成
- [x] 6.5 尺寸：16↔24↔32↔48 切换后生成，放大无错位
- [x] 6.6 链路：生成→镜像绘制→撤销重做→导出 PNG 全程正常
- [x] 6.7 离线：拔网后随机生成 + 预设载入仍可用
- [x] 6.8 持久化：localStorage 旧数据刷新后画板内容不变

## 7. 收尾

- [x] 7.1 清理 `.temp/` spike 脚本
- [x] 7.2 `openspec validate add-dicebear-generator`
- [x] 7.3 `openspec archive add-dicebear-generator`

> AI生成