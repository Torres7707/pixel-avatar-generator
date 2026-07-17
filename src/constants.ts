import type { GridSize, PaletteGroup } from './types'

/** 默认画板尺寸 */
export const DEFAULT_SIZE: GridSize = 32

/** 可选尺寸 */
export const SIZE_OPTIONS: GridSize[] = [16, 24, 32, 48]

/** 画板在屏幕上的渲染边长（px） */
export const CANVAS_PX = 512

/** 透明像素的棋盘格底色（用于 canvas 绘制） */
export const CHECKER_LIGHT = '#f0e4c8'
export const CHECKER_DARK = '#dcc89e'

/** 透明色标记（业务层用） */
export const TRANSPARENT = null

/** 调色板分组 */
export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    name: '肤色',
    colors: [
      '#ffe0c4', '#ffcd9e', '#ffb88a', '#e8a06b',
      '#c68649', '#9c5e33', '#6b3e22', '#4a2a16',
    ],
  },
  {
    name: '头发',
    colors: [
      '#1a1a1a', '#3a2417', '#6b4226', '#a86b3c',
      '#d4a05a', '#f0c674', '#e8e0d0', '#b5b5c0',
      '#c0392b', '#8e44ad', '#2980b9', '#27ae60',
    ],
  },
  {
    name: '经典',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa',
    ],
  },
  {
    name: '现代',
    colors: [
      '#264653', '#2a9d8f', '#e9c46a', '#f4a261',
      '#e76f51', '#e63946', '#457b9d', '#1d3557',
      '#06d6a0', '#118ab2', '#073b4c', '#ffd166',
      '#ef476f', '#8338ec', '#3a86ff', '#fb5607',
    ],
  },
  {
    name: '灰阶',
    colors: [
      '#ffffff', '#e0e0e0', '#bdbdbd', '#9e9e9e',
      '#757575', '#616161', '#424242', '#212121',
      '#000000', '#f5f5f5', '#c8c8c8', '#888888',
    ],
  },
]

/** 所有可用颜色（展平） */
export const ALL_COLORS = PALETTE_GROUPS.flatMap((g) => g.colors)

/** 预设模板：固定 seed + 风格，基于 DiceBear pixel-art（确定性） */
export interface Preset {
  id: string
  name: string
  /** STYLE_OPTIONS 中风格 key */
  style: string
  /** DiceBear seed */
  seed: string
}

export const PRESETS: Preset[] = [
  { id: 'p1', name: '阿杰', style: 'pixel-art', seed: 'Jax' },
  { id: 'p2', name: '米娅', style: 'pixel-art-warm', seed: 'Mia' },
  { id: 'p3', name: '里奥', style: 'pixel-art-cool', seed: 'Leo' },
  { id: 'p4', name: '诺娃', style: 'pixel-art-dark', seed: 'Nova' },
  { id: 'p5', name: '凯',  style: 'pixel-art', seed: 'Kai' },
  { id: 'p6', name: '艾琳', style: 'pixel-art-warm', seed: 'Iris' },
  { id: 'p7', name: '雷',  style: 'pixel-art-cool', seed: 'Ray' },
  { id: 'p8', name: '佐伊', style: 'pixel-art-dark', seed: 'Zoe' },
]

/** 最近使用颜色的最大数量 */
export const MAX_RECENT_COLORS = 10

/** 历史栈最大长度 */
export const MAX_HISTORY = 60

/** 空网格工厂 */
export function createEmptyGrid(size: GridSize): (string | null)[][] {
  return Array.from({ length: size }, () => Array<string | null>(size).fill(null))
}
