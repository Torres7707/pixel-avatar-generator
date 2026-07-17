import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import type { GridSize, MirrorMode, PixelGrid, Tool } from '../types'
import { createEmptyGrid, MAX_HISTORY } from '../constants'
import { STYLE_OPTIONS } from '../utils/dicebear'
import { cloneGrid, gridEqual } from '../utils/canvas'

const STORAGE_KEY = 'pixel-avatar:save'

interface PersistShape {
  grid: PixelGrid
  size: GridSize
}

/**
 * 自定义 storage：兼容旧版手写 `{grid, size}` 格式。
 * persist 读取时期望 `{state, version}`，旧数据无 state 字段，这里包装一层。
 */
const customStorage: PersistStorage<PersistShape> = {
  getItem: (name) => {
    const str = localStorage.getItem(name)
    if (!str) return null
    try {
      const parsed = JSON.parse(str)
      // 新格式（persist 写入）：含 state 字段
      if (parsed && parsed.state !== undefined) {
        return parsed as StorageValue<PersistShape>
      }
      // 旧格式（手写）：直接 {grid, size}，包装成 persist 标准结构
      if (parsed && parsed.grid !== undefined && parsed.size !== undefined) {
        return { state: { grid: parsed.grid, size: parsed.size }, version: 0 }
      }
      return null
    } catch {
      return null
    }
  },
  setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => localStorage.removeItem(name),
}

export interface AvatarState {
  // —— 状态 ——
  size: GridSize
  grid: PixelGrid
  tool: Tool
  color: string
  recentColors: string[]
  mirror: MirrorMode
  showGrid: boolean
  currentStyle: string
  past: PixelGrid[]
  future: PixelGrid[]
  strokeSnapshot: PixelGrid | null

  // —— setters ——
  setTool: (t: Tool) => void
  setColor: (c: string) => void
  setMirror: (m: MirrorMode) => void
  setShowGrid: (v: boolean) => void
  setStyle: (k: string) => void

  // —— actions ——
  pushRecent: (c: string) => void
  applyTool: (x: number, y: number) => void
  pickCellColor: (x: number, y: number) => void
  beginStroke: () => void
  endStroke: () => void
  undo: () => void
  redo: () => void
  changeSize: (n: GridSize) => void
  clear: () => void
  loadGrid: (g: PixelGrid) => void
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => {
      /** 把前一帧 grid 入历史栈，清空 future（内部辅助） */
      const pushHistory = (prev: PixelGrid) =>
        set((s) => ({ past: [...s.past, prev].slice(-MAX_HISTORY), future: [] }))

      /** 获取镜像坐标集合（内部辅助） */
      const mirrorCells = (x: number, y: number): Array<[number, number]> => {
        const { mirror, size } = get()
        const cells: Array<[number, number]> = [[x, y]]
        const n = size
        if (mirror === 'horizontal' || mirror === 'both') cells.push([n - 1 - x, y])
        if (mirror === 'vertical' || mirror === 'both') cells.push([x, n - 1 - y])
        if (mirror === 'both') cells.push([n - 1 - x, n - 1 - y])
        return cells
      }

      /** 在指定格子执行画笔/橡皮（内部辅助） */
      const paintCell = (x: number, y: number, g: PixelGrid): PixelGrid => {
        const { tool, color, size } = get()
        const next = cloneGrid(g)
        const cells = mirrorCells(x, y)
        for (const [cx, cy] of cells) {
          if (cy < 0 || cy >= size || cx < 0 || cx >= size) continue
          next[cy][cx] = tool === 'eraser' ? null : color
        }
        return next
      }

      /** 油漆桶填充（内部辅助） */
      const fillCell = (x: number, y: number, g: PixelGrid): PixelGrid => {
        const { tool, color, size, mirror } = get()
        const target = g[y]?.[x]
        const replacement: string | null = tool === 'eraser' ? null : color
        if (target === replacement) return g
        const next = cloneGrid(g)
        const stack: Array<[number, number]> = [[x, y]]
        while (stack.length) {
          const [cx, cy] = stack.pop()!
          if (cx < 0 || cy < 0 || cx >= size || cy >= size) continue
          if (next[cy][cx] !== target) continue
          next[cy][cx] = replacement
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
        }
        // 填充也做镜像（填充后镜像同步）
        if (mirror !== 'none') {
          return makeMirrored(next, mirror, size)
        }
        return next
      }

      return {
        // —— 状态 ——
        size: 32,
        grid: createEmptyGrid(32),
        tool: 'pen',
        color: '#1a1a1a',
        recentColors: [],
        mirror: 'horizontal',
        showGrid: true,
        currentStyle: STYLE_OPTIONS[0].key,
        past: [],
        future: [],
        strokeSnapshot: null,

        // —— setters ——
        setTool: (tool) => set({ tool }),
        setColor: (color) => set({ color }),
        setMirror: (mirror) => set({ mirror }),
        setShowGrid: (showGrid) => set({ showGrid }),
        setStyle: (currentStyle) => set({ currentStyle }),

        // —— actions ——
        pushRecent: (c) =>
          set((s) => ({
            color: c,
            recentColors: [c, ...s.recentColors.filter((x) => x !== c)].slice(0, 10),
          })),

        pickCellColor: (x, y) => {
          const c = get().grid[y]?.[x]
          if (c !== null && c !== undefined) {
            set({ color: c, tool: 'pen' })
          }
        },

        applyTool: (x, y) => {
          const { tool } = get()
          if (tool === 'fill') {
            set((s) => ({ grid: fillCell(x, y, s.grid) }))
          } else if (tool === 'picker') {
            // picker 不改 grid，实际取色走 pickCellColor
          } else {
            set((s) => ({ grid: paintCell(x, y, s.grid) }))
          }
        },

        beginStroke: () => set({ strokeSnapshot: cloneGrid(get().grid) }),

        endStroke: () => {
          const snap = get().strokeSnapshot
          const cur = get().grid
          if (snap && !gridEqual(snap, cur)) {
            pushHistory(snap)
          }
          set({ strokeSnapshot: null })
        },

        undo: () => {
          const { past, future, grid } = get()
          if (!past.length) return
          const prev = past[past.length - 1]
          set({
            past: past.slice(0, -1),
            future: [...future, cloneGrid(grid)],
            grid: prev,
          })
        },

        redo: () => {
          const { past, future, grid } = get()
          if (!future.length) return
          const next = future[future.length - 1]
          set({
            past: [...past, cloneGrid(grid)],
            future: future.slice(0, -1),
            grid: next,
          })
        },

        changeSize: (newSize) => {
          const { grid, size } = get()
          const prev = cloneGrid(grid)
          const next = createEmptyGrid(newSize)
          const min = Math.min(size, newSize)
          for (let y = 0; y < min; y++) {
            for (let x = 0; x < min; x++) {
              next[y][x] = prev[y][x]
            }
          }
          pushHistory(grid)
          set({ size: newSize, grid: next })
        },

        clear: () => {
          const { grid, size } = get()
          if (grid.every((row) => row.every((c) => c === null))) return
          pushHistory(grid)
          set({ grid: createEmptyGrid(size) })
        },

        loadGrid: (newGrid) => {
          pushHistory(get().grid)
          set({ grid: newGrid })
        },
      }
    },
    {
      name: STORAGE_KEY,
      storage: customStorage,
      partialize: (s) => ({ grid: s.grid, size: s.size }),
    },
  ),
)

/** 生成水平/垂直镜像合成的网格（模块私有纯函数） */
function makeMirrored(g: PixelGrid, mode: MirrorMode, n: number): PixelGrid {
  const next = cloneGrid(g)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const src = g[y][x]
      if (mode === 'horizontal' || mode === 'both') {
        const mx = n - 1 - x
        if (next[y][mx] === g[y][mx]) next[y][mx] = src
      }
      if (mode === 'vertical' || mode === 'both') {
        const my = n - 1 - y
        if (next[my][x] === g[my][x]) next[my][x] = src
      }
      if (mode === 'both') {
        next[n - 1 - y][n - 1 - x] = src
      }
    }
  }
  return next
}
