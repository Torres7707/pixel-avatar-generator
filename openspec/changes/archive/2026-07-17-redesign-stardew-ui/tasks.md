---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '3179de34-224f-4c5b-be4c-04ab9f9793be'
  PropagateID: '3179de34-224f-4c5b-be4c-04ab9f9793be'
  ReservedCode1: 'c1062a08-8695-42a7-99d9-b09f4451deb9'
  ReservedCode2: 'c1062a08-8695-42a7-99d9-b09f4451deb9'
---

## 1. 字体与 token 基础

- [ ] 1.1 `index.html` 加 Google Fonts preconnect + link（Press Start 2P + VT323）
- [ ] 1.2 `index.css` `:root` token 重构：紫调 → 木质暖色系（`--bg/#f4e8cc` `--panel/#c9a86a` `--accent/#d4a05a` `--accent-2/#6a8d4f` 等），新增 `--pixel-border/--pixel-shadow/--frame-inset` 边框 token，加 `--font-pixel/--font-body`
- [ ] 1.3 body 背景改暖米黄（可加轻微木纹/噪点纹理）

## 2. 像素边框基础系统

- [ ] 2.1 `App.css` 新增 `.panel-wood`：木质面板基底（`--panel` 底 + 4px `--pixel-border` 实线 + inset 高光 + 零模糊外投影）
- [ ] 2.2 新增 `.btn-pixel`：像素按钮（厚边 + 外投影 + `:active` 凹陷位移）
- [ ] 2.3 新增 `.seg-pixel` / `.swatch-pixel`：分段控件与色块的像素边框变体
- [ ] 2.4 验证边框视觉为"柔和立体"而非尖锐锯齿（对比 NES.css 截图确认差异）

## 3. 布局重组

- [ ] 3.1 重写 `.layout`：三栏 grid → 预览中心化（中间画板/预览最大，左右为选项/调色面板）
- [ ] 3.2 header 重做：像素字体标题（中英混排或像素感中文）+ 木牌装饰
- [ ] 3.3 新增底部居中主操作按钮条（随机 + 导出，呼应星露谷底栏）
- [ ] 3.4 调整 `.stage` / `.right-col` 为环绕预览的卡片容器

## 4. 组件换皮

- [ ] 4.1 `App.tsx` 壳：整体木质面板包裹，header 像素标题
- [ ] 4.2 `Toolbar.tsx`：拆为"外观选项"（工具/镜像/尺寸/风格）+ "快速生成"（随机/预设）两个木质面板；分段按钮换 `.seg-pixel`
- [ ] 4.3 `PixelCanvas.tsx`：画板外框换木质厚边；棋盘格透明底保留；网格线改浅木色
- [ ] 4.4 `Palette.tsx`：色块换 `.swatch-pixel`（厚边 + 按下凹陷）；分组面板木质
- [ ] 4.5 `PreviewPanel.tsx`：升格中心——加大预览 + 相框感装饰；导出按钮 `.btn-pixel`
- [ ] 4.6 toast/错误提示条换像素风样式

## 5. 响应式

- [ ] 5.1 `≤1100px`：三栏 → 预览上 + 选项下堆叠
- [ ] 5.2 `≤560px`：紧凑单列，面板全宽堆叠，底部按钮条全宽

## 6. 验证

- [ ] 6.1 `tsc` 零报错（strict）
- [ ] 6.2 `npm run build` 通过
- [ ] 6.3 Playwright 截图对比效果图：配色/边框/布局/字体是否逼近星露谷风，多轮调参
- [ ] 6.4 视觉验证：暖色木质 + 柔和像素边框 + 预览中心化 + 像素字体标题
- [ ] 6.5 交互回归：绘制/镜像/填充/撤销重做/快捷键/随机/预设/导出 全链路正常
- [ ] 6.6 离线 + 持久化刷新仍正常
- [ ] 6.7 可访问性：文字对比度达 AA

## 7. 收尾

- [ ] 7.1 `openspec validate redesign-stardew-ui`
- [ ] 7.2 `openspec archive redesign-stardew-ui`（需用户确认）

> AI生成