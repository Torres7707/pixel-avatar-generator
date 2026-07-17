import type { PixelGrid } from '../types'
import { CHECKER_DARK, CHECKER_LIGHT } from '../constants'

/**
 * 将像素网格绘制到 canvas 上。
 * @param ctx canvas 2d 上下文
 * @param grid 像素网格
 * @param pixelSize 单个像素在 canvas 上的边长（px）
 * @param showGrid 是否绘制网格线
 * @param showChecker 是否绘制透明区棋盘格底
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  pixelSize: number,
  showGrid: boolean,
  showChecker: boolean,
): void {
  const size = grid.length
  ctx.clearRect(0, 0, size * pixelSize, size * pixelSize)

  // 棋盘格底
  if (showChecker) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] !== null) continue
        ctx.fillStyle = (x + y) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
      }
    }
  }

  // 像素
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = grid[y][x]
      if (color === null) continue
      ctx.fillStyle = color
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }

  // 网格线
  if (showGrid && pixelSize >= 4) {
    ctx.strokeStyle = 'rgba(90,61,31,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i <= size; i++) {
      const p = Math.round(i * pixelSize) + 0.5
      ctx.moveTo(p, 0)
      ctx.lineTo(p, size * pixelSize)
      ctx.moveTo(0, p)
      ctx.lineTo(size * pixelSize, p)
    }
    ctx.stroke()
  }
}

/**
 * 导出像素网格为 PNG 并触发下载。
 * @param grid 像素网格
 * @param scale 放大倍数（1 = 原始像素大小）
 * @param transparent 是否透明背景
 */
export function exportPNG(
  grid: PixelGrid,
  scale: number,
  transparent: boolean,
  filename = 'pixel-avatar.png',
): void {
  const size = grid.length
  const canvas = document.createElement('canvas')
  canvas.width = size * scale
  canvas.height = size * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  if (!transparent) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = grid[y][x]
      if (color === null) continue
      ctx.fillStyle = color
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

/** 将像素网格转换为 data URL（用于预览 / 复制） */
export function gridToDataURL(grid: PixelGrid, pixelSize: number, showChecker: boolean): string {
  const size = grid.length
  const canvas = document.createElement('canvas')
  canvas.width = size * pixelSize
  canvas.height = size * pixelSize
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  drawGrid(ctx, grid, pixelSize, false, showChecker)
  return canvas.toDataURL('image/png')
}

/** 深拷贝网格 */
export function cloneGrid(grid: PixelGrid): PixelGrid {
  return grid.map((row) => row.slice())
}

/** 网格尺寸转字符串（用于 localStorage key） */
export function gridSizeKey(): string {
  return 'pixel-avatar:save'
}

/** 网格深比较 */
export function gridEqual(a: PixelGrid, b: PixelGrid): boolean {
  if (a.length !== b.length) return false
  for (let y = 0; y < a.length; y++) {
    for (let x = 0; x < a[y].length; x++) {
      if (a[y][x] !== b[y][x]) return false
    }
  }
  return true
}

/** 在网格内 */
export function inBounds(grid: PixelGrid, x: number, y: number): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < grid.length
}
