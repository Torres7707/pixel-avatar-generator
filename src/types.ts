/** 工具类型 */
export type Tool = 'pen' | 'eraser' | 'fill' | 'picker'

/** 画板尺寸（边长像素数） */
export type GridSize = 16 | 24 | 32 | 48

/** 像素网格：二维数组，null 表示透明 */
export type PixelGrid = (string | null)[][]

/** 镜像模式 */
export type MirrorMode = 'none' | 'horizontal' | 'vertical' | 'both'

/** 历史栈中的快照 */
export interface HistorySnapshot {
  grid: PixelGrid
  size: GridSize
}

/** 调色板分组 */
export interface PaletteGroup {
  name: string
  colors: string[]
}
