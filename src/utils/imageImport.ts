import type { PixelGrid } from '../types'

/** 可见 alpha 阈值：高于此算有颜色像素 */
const ALPHA_THRESHOLD = 32

/** 最大文件大小（10 MB） */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/** 允许的图片 MIME 类型 */
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml']

/**
 * 将用户上传的图片文件像素化为 PixelGrid。
 *
 * 流程：
 * 1. 校验文件类型与大小
 * 2. 读取为 data URL → Image 元素
 * 3. 居中方裁（取中心正方形区域）
 * 4. 最近邻降采样到 targetSize × targetSize
 * 5. 构建 PixelGrid（alpha > 阈值 → #rrggbb，否则 null）
 */
export function imageFileToGrid(file: File, targetSize: number): Promise<PixelGrid> {
  // —— 校验 ——
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return Promise.reject(new Error(`不支持的图片格式：${file.type || '未知'}，请上传 PNG/JPEG/WebP/GIF/BMP/SVG`))
  }
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new Error(`文件过大（${(file.size / 1024 / 1024).toFixed(1)} MB），上限 10 MB`))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片解码失败，请确认文件未损坏'))
      img.onload = () => {
        try {
          const grid = sampleImage(img, targetSize)
          resolve(grid)
        } catch (e) {
          reject(e instanceof Error ? e : new Error('像素化处理失败'))
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * 纯 Canvas 采样：居中方裁 + 最近邻降采样 → PixelGrid。
 *
 * 居中方裁逻辑：
 * - 取图片较短边为方裁边长 cropSize
 * - 裁剪起点 (sx, sy) 使正方形区域居中
 * - 用 drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize) 一步完成方裁+降采样
 */
function sampleImage(img: HTMLImageElement, targetSize: number): PixelGrid {
  const w = img.naturalWidth
  const h = img.naturalHeight

  // 居中方裁参数
  const cropSize = Math.min(w, h)
  const sx = Math.floor((w - cropSize) / 2)
  const sy = Math.floor((h - cropSize) / 2)

  // 离屏 canvas，目标尺寸
  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext('2d')!

  // 最近邻降采样：关闭平滑
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, targetSize, targetSize)
  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize)

  // 逐像素构建 PixelGrid
  const data = ctx.getImageData(0, 0, targetSize, targetSize).data
  const grid: PixelGrid = Array.from({ length: targetSize }, () =>
    Array<string | null>(targetSize).fill(null),
  )
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const i = (y * targetSize + x) * 4
      const a = data[i + 3]
      if (a > ALPHA_THRESHOLD) {
        grid[y][x] = `#${hex(data[i])}${hex(data[i + 1])}${hex(data[i + 2])}`
      }
    }
  }
  return grid
}

function hex(n: number): string {
  return n.toString(16).padStart(2, '0')
}
