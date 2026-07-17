import { Style, Avatar } from '@dicebear/core'
import type { PixelGrid } from '../types'
import pixelArt from '@dicebear/styles/pixel-art.json'

export const GENERATE_BASE_SIZE = 16

/** 可见 alpha 阈值：高于此算有颜色像素 */
const ALPHA_THRESHOLD = 32

export interface StyleOption {
  /** 唯一 key */
  key: string
  /** 显示名 */
  name: string
  /** 背景色，undefined = 透明默认 */
  bg?: string
}

/**
 * 生成风格选项。
 * 说明：DiceBear styles 包不存在 bottts-pixel，唯一真像素风为 pixel-art（16×16）。
 * 故以 pixel-art 为基底，用背景主题做风格变体，保持像素一致性且不引入抗锯齿失真。
 */
export const STYLE_OPTIONS: StyleOption[] = [
  { key: 'pixel-art', name: '像素人' },
  { key: 'pixel-art-warm', name: '暖底', bg: '#f4a261' },
  { key: 'pixel-art-cool', name: '冷底', bg: '#2a9d8f' },
  { key: 'pixel-art-dark', name: '暗底', bg: '#1a1a2e' },
]

const sharedStyle = new Style(pixelArt as never)

/**
 * 生成头像 data URI（同步）。
 * @param styleKey STYLE_OPTIONS 之一
 * @param seed 任意字符串，同 seed 同结果
 */
export function generateAvatarDataUri(styleKey: string, seed: string): string {
  const opt = STYLE_OPTIONS.find((s) => s.key === styleKey) ?? STYLE_OPTIONS[0]
  const avatar = new Avatar(sharedStyle, {
    seed,
    ...(opt.bg ? { backgroundColor: [opt.bg] } : {}),
  })
  return avatar.toDataUri()
}

/**
 * 将 SVG data URI 光栅化采样为 PixelGrid。
 * 流程：dataUri → Image → draw 到 canvas（imageSmoothingEnabled=false）→ 读像素。
 */
export function svgDataUriToGrid(dataUri: string): Promise<PixelGrid> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const n = GENERATE_BASE_SIZE
      const canvas = document.createElement('canvas')
      canvas.width = n
      canvas.height = n
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, n, n)
      ctx.drawImage(img, 0, 0, n, n)
      const data = ctx.getImageData(0, 0, n, n).data
      const grid: PixelGrid = Array.from({ length: n }, () => Array<string | null>(n).fill(null))
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const i = (y * n + x) * 4
          const a = data[i + 3]
          if (a > ALPHA_THRESHOLD) {
            grid[y][x] = `#${hex(data[i])}${hex(data[i + 1])}${hex(data[i + 2])}`
          }
        }
      }
      resolve(grid)
    }
    img.onerror = () => reject(new Error('SVG 图片加载失败'))
    img.src = dataUri
  })
}

function hex(n: number): string {
  return n.toString(16).padStart(2, '0')
}

/**
 * 最近邻放大：把 16×16 grid 放大到 n×n。
 * out[y][x] = src[⌊y*16/n⌋][⌊x*16/n⌋]，保持像素硬边无插值。
 */
export function scaleGrid(src: PixelGrid, n: number): PixelGrid {
  const sn = src.length
  const out: PixelGrid = Array.from({ length: n }, () => Array<string | null>(n).fill(null))
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      out[y][x] = src[Math.floor((y * sn) / n)][Math.floor((x * sn) / n)]
    }
  }
  return out
}

/**
 * 一步到位：生成头像并采样为指定尺寸的 PixelGrid。
 * 失败抛异常，由调用方 try/catch 降级。
 */
export async function generateAvatarGrid(
  styleKey: string,
  seed: string,
  targetSize: number,
): Promise<PixelGrid> {
  const dataUri = generateAvatarDataUri(styleKey, seed)
  const base = await svgDataUriToGrid(dataUri)
  return targetSize === GENERATE_BASE_SIZE ? base : scaleGrid(base, targetSize)
}
