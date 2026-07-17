import type { PixelGrid } from '../types'

/** 可见 alpha 阈值：高于此算有颜色像素 */
const ALPHA_THRESHOLD = 32

/** 最大文件大小（10 MB） */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/** 大图预缩放的安全尺寸上限：超过此值先双线性缩放到此尺寸再做锐化+区域平均 */
const MAX_PROCESS_SIZE = 1024

/** 允许的图片 MIME 类型 */
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml']

/**
 * 将用户上传的图片文件像素化为 PixelGrid。
 *
 * 流程：
 * 1. 校验文件类型与大小
 * 2. 读取为 data URL → Image 元素
 * 3. 居中方裁（取中心正方形区域），若边长 > 1024 则双线性预缩放
 * 4. 拉普拉斯锐化卷积（增强边缘）
 * 5. 区域平均降采样到 targetSize × targetSize（box filter 抗混叠）
 * 6. 构建 PixelGrid（alpha > 阈值 → #rrggbb，否则 null）
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
 * 图片像素化核心：居中方裁 → 锐化卷积 → 区域平均降采样 → PixelGrid。
 */
function sampleImage(img: HTMLImageElement, targetSize: number): PixelGrid {
  const w = img.naturalWidth
  const h = img.naturalHeight

  // 居中方裁参数
  const cropSize = Math.min(w, h)
  const sx = Math.floor((w - cropSize) / 2)
  const sy = Math.floor((h - cropSize) / 2)

  // 1. 裁切 + 预缩放到安全尺寸 → ImageData
  const { data, width: srcW, height: srcH } = cropToImageData(img, sx, sy, cropSize)

  // 2. 拉普拉斯锐化卷积（原地修改 RGB，增强边缘）
  sharpenConvolution(data, srcW, srcH)

  // 3. 区域平均降采样 → PixelGrid
  return areaAverageDownsample(data, srcW, srcH, targetSize)
}

/**
 * 裁切源图正方形区域，若边长超过 MAX_PROCESS_SIZE 则双线性预缩放。
 * 返回可用于卷积和降采样的 ImageData。
 */
function cropToImageData(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  cropSize: number,
): ImageData {
  const drawSize = Math.min(cropSize, MAX_PROCESS_SIZE)
  const canvas = document.createElement('canvas')
  canvas.width = drawSize
  canvas.height = drawSize
  const ctx = canvas.getContext('2d')!

  if (drawSize === cropSize) {
    // 原尺寸裁切，用最近邻保持像素准确
    ctx.imageSmoothingEnabled = false
  } else {
    // 大图预缩放，用高质量双线性保留信息
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
  }
  ctx.clearRect(0, 0, drawSize, drawSize)
  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, drawSize, drawSize)

  return ctx.getImageData(0, 0, drawSize, drawSize)
}

/**
 * 3×3 拉普拉斯锐化卷积（原地修改 ImageData 的 RGB 通道）。
 *
 * 核：           计算：
 *  0 -1  0       out = 5*center - up - down - left - right
 * -1  5 -1
 *  0 -1  0
 *
 * - 仅卷积 RGB，alpha 通道不动（保持透明区域边界清晰）
 * - 边缘像素用镜像填充（clamp 坐标）
 * - Uint8ClampedArray 自动 clamp 到 [0, 255]
 */
function sharpenConvolution(data: Uint8ClampedArray, w: number, h: number): void {
  // 复制原始数据作为卷积输入（避免原地修改影响后续计算）
  const src = new Uint8ClampedArray(data)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      // 镜像填充：边缘坐标 clamp 到有效范围
      const xm = Math.max(0, x - 1)
      const xp = Math.min(w - 1, x + 1)
      const ym = Math.max(0, y - 1)
      const yp = Math.min(h - 1, y + 1)

      const c = (y * w + x) * 4
      const l = (y * w + xm) * 4
      const r = (y * w + xp) * 4
      const u = (ym * w + x) * 4
      const d = (yp * w + x) * 4

      // RGB 三通道分别卷积：out = 5*center - left - right - up - down
      data[idx] = 5 * src[c] - src[l] - src[r] - src[u] - src[d]
      data[idx + 1] = 5 * src[c + 1] - src[l + 1] - src[r + 1] - src[u + 1] - src[d + 1]
      data[idx + 2] = 5 * src[c + 2] - src[l + 2] - src[r + 2] - src[u + 2] - src[d + 2]
      // alpha 不动：data[idx + 3] 保持原值
    }
  }
}

/**
 * 区域平均降采样（box filter 抗混叠）。
 *
 * 每个目标像素 (tx, ty) 的颜色 = 源图中对应矩形区域 [sx0,sx1)×[sy0,sy1)
 * 内所有像素的 RGBA 均值。
 *
 * 相比最近邻（取单点），覆盖 100% 源区域，颜色更准、细节更稳。
 */
function areaAverageDownsample(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  targetSize: number,
): PixelGrid {
  const grid: PixelGrid = Array.from({ length: targetSize }, () =>
    Array<string | null>(targetSize).fill(null),
  )

  for (let ty = 0; ty < targetSize; ty++) {
    const sy0 = Math.floor((ty * srcH) / targetSize)
    const sy1 = Math.floor(((ty + 1) * srcH) / targetSize)

    for (let tx = 0; tx < targetSize; tx++) {
      const sx0 = Math.floor((tx * srcW) / targetSize)
      const sx1 = Math.floor(((tx + 1) * srcW) / targetSize)

      // 累加 [sx0,sx1)×[sy0,sy1) 区域内所有像素的 RGBA
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let count = 0

      for (let y = sy0; y < sy1; y++) {
        for (let x = sx0; x < sx1; x++) {
          const i = (y * srcW + x) * 4
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          a += data[i + 3]
          count++
        }
      }

      if (count === 0) continue

      const avgA = a / count
      if (avgA > ALPHA_THRESHOLD) {
        grid[ty][tx] = `#${hex(r / count)}${hex(g / count)}${hex(b / count)}`
      }
    }
  }

  return grid
}

function hex(n: number): string {
  return Math.round(n).toString(16).padStart(2, '0')
}
