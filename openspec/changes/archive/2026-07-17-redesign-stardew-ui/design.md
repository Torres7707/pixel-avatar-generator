---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '91ed4100-04c1-4480-80b5-704ef7693655'
  PropagateID: '91ed4100-04c1-4480-80b5-704ef7693655'
  ReservedCode1: 'f1bf0bc2-6fed-40e7-ac14-5f58d40edf80'
  ReservedCode2: 'f1bf0bc2-6fed-40e7-ac14-5f58d40edf80'
---

# Design: redesign-stardew-ui

## Context

当前视觉：`index.css` `:root` 9 个语义 token（深紫调 `--bg:#14111f` / `--panel:#251f3a` / `--accent:#ffb454` / `--accent-2:#7c5cff`），等宽字体，518 行 `App.css` 三栏 grid 布局（244px / 1fr / 308px），毛玻璃 header。

参考目标（经 ImageGen 出图 + image_understanding 验证）：星露谷新建角色界面——米暖黄底 + 木质浮雕像素边框 + 中央角色预览 + 左右切换箭头面板 + 色块选择器 + 底部按钮 + 像素字体标题。氛围怀旧柔和、田园温暖。

探索结论：NES.css / 8bitcn / Pxlkit 经截图视觉验证均为街机/红白机冷硬风，硬套反而增加主题对抗成本，确定走纯自定义 CSS。

约束：TypeScript strict、不动状态逻辑（依赖 `refactor-zustand-state`）、不引 UI 库、保留响应式。

## Goals / Non-Goals

**Goals:**
- 视觉从"开发者工具暗紫"转为"星露谷温暖木质农场风"
- 布局从三栏改为以预览为中心的放射/环绕结构
- 建立可复用的像素厚边框 + 木质面板 CSS 体系（token + mixin）
- 交互功能 100% 保留，仅视觉变化

**Non-Goals:**
- 不动状态管理 / 业务算法
- 不引 UI 组件库
- 不改 DiceBear 生成逻辑

## Decisions

### D1. Token 重构：暖色木质系

`index.css :root` 重构为：

```css
:root {
  /* 基底：暖米黄 */
  --bg: #f4e8cc;           /* 米黄暖底 */
  --bg-2: #e8d5a8;         /* 略深米色 */
  /* 面板：木质 */
  --panel: #c9a86a;        /* 浅木 */
  --panel-2: #a8854a;      /* 中木 */
  --panel-dark: #6b4f2a;   /* 深木边框 */
  /* 文字 */
  --text: #3d2b1f;         /* 深棕字 */
  --muted: #7a5c3e;        /* 浅棕辅字 */
  /* 点缀 */
  --accent: #d4a05a;       /* 金黄（主操作色） */
  --accent-2: #6a8d4f;     /* 鼠尾草绿（次操作/成功） */
  --danger: #c0504d;       /* 暗红（删除/清空） */
  /* 像素边框系统 */
  --pixel-border: #5a3d1f; /* 边框深木 */
  --pixel-shadow: #2a1c0e; /* 阴影极深 */
  --frame-inset: #b8975a;  /* 内嵌浅木高光 */
  /* 字体 */
  --font-pixel: "Press Start 2P", monospace;   /* 标题像素体 */
  --font-body: "VT323", "Silkscreen", ui-monospace, monospace; /* 正文复古等宽 */
  --radius: 0;             /* 像素风去圆角，用 box-shadow 造边 */
}
```

字体引入：Google Fonts `<link>` 加载 Press Start 2P（标题）+ VT323（正文，比纯等宽更有复古游戏感且可读性好）。在 `index.html` 加 preconnect + link。

### D2. 像素厚边框 mixin（非锯齿，柔和立体）

星露谷的边框是"柔和厚边"而非 8-bit 尖锐锯齿。用多层 box-shadow 模拟 4px+ 立体边框：

```css
/* 木质像素面板 */
.panel-wood {
  background: var(--panel);
  border: 4px solid var(--pixel-border);
  box-shadow:
    inset 0 0 0 2px var(--frame-inset),   /* 内高光 */
    4px 4px 0 var(--pixel-shadow);         /* 外投影（无模糊=像素感） */
}
/* 像素按钮 */
.btn-pixel {
  background: var(--accent);
  border: 3px solid var(--pixel-border);
  box-shadow: 3px 3px 0 var(--pixel-shadow);
  transition: transform .05s, box-shadow .05s;
}
.btn-pixel:active {
  transform: translate(2px,2px);
  box-shadow: 1px 1px 0 var(--pixel-shadow);  /* 按下凹陷 */
}
```

关键：外投影 `Npx Npx 0`（零模糊）= 像素切边感，但不锐利锯齿；`inset` 高光模拟木纹凸起。这是与 NES.css 尖锐锯齿的核心区别。

### D3. 布局重组：预览中心化

```
┌─────────────────────────────────────────┐
│            ▦ 像素头像工坊（标题）          │  ← 像素字体 header
├──────────┬──────────────────┬───────────┤
│ 外观选项  │                  │  调色板    │
│ (工具/镜像│   中央角色预览     │ (色块)    │
│  /尺寸/  │  (大号画板 +      │           │
│  风格)   │   实时预览)       │           │
│          │                  │           │
├──────────┤                  │  导出      │
│ 快速生成  │                  │ (PNG/复制) │
│ (随机/预设)│                  │           │
└──────────┴──────────────────┴───────────┘
       [ 随机 ]  [ 导出 PNG ]             ← 底部主操作
```

改 `App.css .layout` 的 `grid-template`：从 `244px 1fr 308px` 改为以中间预览最大的三栏，预览占视觉中心。header 换像素字体标题。底部新增居中主操作按钮条（与星露谷底栏呼应）。

### D4. 组件视觉重做清单

| 组件 | 视觉改动 | 交互改动 |
|---|---|---|
| App 壳 | 木质面板包裹整体；header 像素字体标题 + 木牌装饰 | 无 |
| Toolbar | 拆为"外观选项"和"快速生成"两个木质面板；分段按钮换像素厚边 | 无 |
| PixelCanvas | 画板外框换木质厚边 + 棋盘格透明底保留；网格线改浅木色 | 无 |
| Palette | 色块换像素方框（厚边 + 按下凹陷）；分组面板木质 | 无 |
| PreviewPanel | 升格中心：加大预览 + 实际尺寸用"相框"感装饰；导出按钮像素风 | 无 |

### D5. 响应式策略

- `≤1100px`：三栏 → 预览上 + 选项下堆叠
- `≤560px`：紧凑单列，面板全宽堆叠
- 保留现有断点数值，仅调整断点内的布局规则

### D6. 颜色对比与可访问性

暖底深字（`#3d2b1f` on `#f4e8cc`）对比度 > 7:1（AAA）。辅色 `#7a5c3e` on `#f4e8cc` ≈ 4.5:1（AA）。确保按钮文字与背景对比达标；pixel-border 深木 `#5a3d1f` 提供足够边界辨识。

## Risks / Trade-offs

- **[Press Start 2P 仅英文]** → 标题像素字体只支持拉丁字符，中文标题需降级为 `--font-body`（VT323 也不含中文，中文回落 system mono）。方案：标题中英混排或纯像素感 CSS（letter-spacing + font-weight）模拟，中文用加粗等宽 + 字间距营造像素感
- **[VT323 可读性]** → VT323 比 Press Start 2P 易读，作为正文字体优先；若个别小字号仍糊，回退 system monospace
- **[box-shadow 性能]** → 多层 shadow 的大量面板可能影响低端机渲染。限制阴影层数（≤3 层），避免对每像素元素加 shadow
- **[视觉主观性]** → 像素风木质质感靠多参数调校，需多轮截图迭代逼近星露谷观感

## Migration Plan

1. `index.html` 加 Press Start 2P + VT323 字体 link
2. `index.css` `:root` token 重构（保留旧变量名做兼容过渡，或 grep 替换全部引用）
3. `App.css` 新增 `.panel-wood / .btn-pixel` 等像素边框基础类
4. 重写 `.layout/.stage/.right-col` 布局段为预览中心化
5. 逐组件换皮：App header → Toolbar → PixelCanvas → Palette → PreviewPanel
6. 响应式断点调整
7. tsc + build + Playwright 视觉迭代（截图对比效果图，多轮调参）

回滚：视觉改动集中在 CSS + 少量 className，`git revert` 即可恢复主题。

## Open Questions

- 中文标题字体方案：纯像素字体不覆盖中文，是否接受标题用英文 + 中文副标，还是用 CSS 模拟中文像素感？(倾向：中英混排，标题像素体 + 中文加粗间距)
- 是否保留 GitHub 链接 header？(倾向：保留但移到底部，净化顶部留给标题)

> AI生成