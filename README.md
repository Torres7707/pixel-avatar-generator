---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'e7aa7415-fb92-4f65-8552-a56a1f92fd78'
  PropagateID: 'e7aa7415-fb92-4f65-8552-a56a1f92fd78'
  ReservedCode1: 'ba948411-9aa7-4b32-8ae4-8525f787830d'
  ReservedCode2: 'ba948411-9aa7-4b32-8ae4-8525f787830d'
---

# 像素头像工坊

一个基于 React + TypeScript + Vite 的像素风格头像编辑器，支持 DiceBear 随机生成、图片导入像素化、自由绘制编辑和 PNG 导出。UI 采用星露谷物语温暖木质农场风格，搭配 Silkscreen + Zpix 像素字体。

## 功能

- **DiceBear 随机生成** — 4 种风格（像素人 / 暖底 / 冷底 / 暗底）+ 8 个预设头像
- **图片导入像素化** — 上传任意图片自动像素化为可编辑网格（纯 Canvas 最近邻降采样 + 居中方裁）
- **像素画板编辑** — 画笔 / 橡皮 / 填充 / 吸管，支持水平 / 垂直 / 四向镜像绘制
- **多尺寸画板** — 16/24/32/48 像素网格自由切换
- **撤销 / 重做** — 完整历史栈（最多 60 步）
- **localStorage 持久化** — 刷新页面自动恢复
- **PNG 导出** — 1×/4×/8×/16×/32× 倍率，支持透明背景
- **复制到剪贴板** — 一键复制 PNG 到系统剪贴板

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:5173/`。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 状态管理 | Zustand 5（含 persist + localStorage） |
| 头像生成 | DiceBear Core + pixel-art 风格 |
| 图片像素化 | 纯 Canvas API（无第三方依赖） |
| 像素字体 | Silkscreen（英文）+ Zpix 子集（中文，6.8KB woff2） |

## 项目结构

```
src/
├── App.tsx                   # 主组件，编排各面板
├── main.tsx                  # 入口
├── types.ts                  # PixelGrid / Tool / GridSize 等类型
├── constants.ts              # 调色板、预设、尺寸选项
├── store/
│   └── useAvatarStore.ts     # Zustand store（状态 + 操作 + 历史 + 持久化）
├── utils/
│   ├── dicebear.ts           # DiceBear 生成 + SVG→Grid Canvas 采样
│   ├── imageImport.ts        # 图片文件→PixelGrid（居中方裁 + 最近邻降采样）
│   └── canvas.ts             # Canvas 绘制 / 导出工具
└── components/
    ├── Toolbar.tsx           # 左侧工具栏（工具/操作/镜像/尺寸/风格/生成/导入）
    ├── PixelCanvas.tsx       # 中央画板（指针事件 + 实时渲染）
    ├── Palette.tsx           # 右侧调色板（分组色 + 自定义色）
    └── PreviewPanel.tsx      # 右侧预览 + 导出面板
```

## 开发流程

本项目采用 **Spec-Driven Development（规范驱动开发）**，使用 [OpenSpec](https://github.com/fission-ai/openspec) 管理变更规范。所有变更先产出规范文档，确认后实现，完成后归档。

已归档的变更记录见 `openspec/changes/archive/`：

| 日期 | Change | 说明 |
|------|--------|------|
| 2026-07-16 | `add-dicebear-generator` | DiceBear 头像生成 + SVG 像素采样管道 |
| 2026-07-17 | `refactor-zustand-state` | 自定义 hook → Zustand 全局 store 迁移 |
| 2026-07-17 | `redesign-stardew-ui` | 星露谷物语风格 UI 重构 |
| 2026-07-17 | `add-image-import` | 图片导入像素化功能（纯 Canvas 方案） |

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `B` | 画笔 |
| `E` | 橡皮 |
| `G` | 填充 |
| `I` | 吸管 |
| `H` | 切换网格 |
| `⌘Z` / `⌃Z` | 撤销 |
| `⌘⇧Z` / `⌃⇧Z` | 重做 |
| `⌘Y` / `⌃Y` | 重做 |

## License

MIT

> AI生成