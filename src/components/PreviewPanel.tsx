import { useEffect, useRef, useState } from 'react'
import { useAvatarStore } from '../store/useAvatarStore'
import { drawGrid, exportPNG, gridToDataURL } from '../utils/canvas'
import { Icon } from './Icon'

const SCALES = [1, 4, 8, 16, 32]

export function PreviewPanel() {
  const bigRef = useRef<HTMLCanvasElement>(null)
  const smallRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(16)
  const [transparent, setTransparent] = useState(true)

  const grid = useAvatarStore((s) => s.grid)
  const size = useAvatarStore((s) => s.size)

  // 大预览
  useEffect(() => {
    const cv = bigRef.current
    if (!cv) return
    const pxSize = 8
    cv.width = size * pxSize
    cv.height = size * pxSize
    const ctx = cv.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    drawGrid(ctx, grid, pxSize, false, true)
  }, [grid, size])

  // 实际尺寸
  useEffect(() => {
    const cv = smallRef.current
    if (!cv) return
    cv.width = size
    cv.height = size
    const ctx = cv.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    drawGrid(ctx, grid, 1, false, true)
    // 放大显示靠 CSS image-rendering
  }, [grid, size])

  const handleExport = () => {
    exportPNG(grid, scale, transparent, `pixel-avatar-${size}x${size}.png`)
  }

  const handleCopy = async () => {
    try {
      const url = gridToDataURL(grid, Math.max(4, scale), false)
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
    } catch {
      // 降级：复制 dataURL 文本
      try {
        await navigator.clipboard.writeText(gridToDataURL(grid, scale, false))
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="preview panel">
      <div className="preview-head">
        <h3 className="panel-title">实时预览</h3>
      </div>

      <div className="preview-big">
        <canvas ref={bigRef} style={{ imageRendering: 'pixelated' }} />
      </div>

      <div className="preview-row">
        <span className="muted">实际尺寸</span>
        <canvas
          ref={smallRef}
          className="preview-actual"
          style={{ imageRendering: 'pixelated', width: size * 3, height: size * 3 }}
        />
      </div>

      <div className="export-opts">
        <label className="field">
          <span>导出尺寸</span>
          <div className="seg">
            {SCALES.map((s) => (
              <button
                key={s}
                className={`seg-btn ${scale === s ? 'active' : ''}`}
                onClick={() => setScale(s)}
              >
                {s}×
              </button>
            ))}
          </div>
          <span className="muted mini">{size * scale}×{size * scale}px</span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => setTransparent(e.target.checked)}
          />
          <span>透明背景</span>
        </label>

        <div className="btn-row">
          <button className="primary-btn" onClick={handleExport}>
            <Icon name="download" /> 导出 PNG
          </button>
          <button className="icon-btn" onClick={handleCopy} title="复制到剪贴板">
            <Icon name="copy" />
          </button>
        </div>
      </div>
    </div>
  )
}
