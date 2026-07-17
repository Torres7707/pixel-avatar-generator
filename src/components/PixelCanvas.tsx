import { useCallback, useEffect, useRef, useState } from 'react'
import { useAvatarStore } from '../store/useAvatarStore'
import { CANVAS_PX } from '../constants'
import { drawGrid } from '../utils/canvas'

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastCell = useRef<string>('')
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)

  const size = useAvatarStore((s) => s.size)
  const grid = useAvatarStore((s) => s.grid)
  const tool = useAvatarStore((s) => s.tool)
  const showGrid = useAvatarStore((s) => s.showGrid)
  const beginStroke = useAvatarStore((s) => s.beginStroke)
  const applyTool = useAvatarStore((s) => s.applyTool)
  const endStroke = useAvatarStore((s) => s.endStroke)
  const pickCellColor = useAvatarStore((s) => s.pickCellColor)

  const pixelSize = CANVAS_PX / size

  // 渲染
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    drawGrid(ctx, grid, pixelSize, showGrid, true)
  }, [grid, pixelSize, showGrid])

  // 悬停高亮层单独绘制（避免频繁重绘主层）
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    drawGrid(ctx, grid, pixelSize, showGrid, true)
    if (hover) {
      ctx.strokeStyle = '#5a3d1f'
      ctx.lineWidth = 2
      ctx.strokeRect(hover.x * pixelSize + 1, hover.y * pixelSize + 1, pixelSize - 2, pixelSize - 2)
    }
  }, [hover, grid, pixelSize, showGrid])

  const toCell = useCallback(
    (e: React.PointerEvent): { x: number; y: number } | null => {
      const cv = canvasRef.current
      if (!cv) return null
      const rect = cv.getBoundingClientRect()
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * size)
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * size)
      if (x < 0 || y < 0 || x >= size || y >= size) return null
      return { x, y }
    },
    [size],
  )

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const cell = toCell(e)
    if (!cell) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    drawing.current = true
    lastCell.current = ''

    if (tool === 'picker') {
      pickCellColor(cell.x, cell.y)
      return
    }
    beginStroke()
    if (tool === 'fill') {
      applyTool(cell.x, cell.y)
      endStroke()
      drawing.current = false
      return
    }
    lastCell.current = `${cell.x},${cell.y}`
    applyTool(cell.x, cell.y)
  }

  const handleMove = (e: React.PointerEvent) => {
    const cell = toCell(e)
    setHover(cell)
    if (!drawing.current || !cell) return
    if (tool === 'fill' || tool === 'picker') return
    const key = `${cell.x},${cell.y}`
    if (key === lastCell.current) return
    lastCell.current = key
    applyTool(cell.x, cell.y)
  }

  const handleUp = () => {
    if (drawing.current && tool !== 'fill' && tool !== 'picker') {
      endStroke()
    }
    drawing.current = false
  }

  const cursorClass = `tool-cursor tool-cursor--${tool}`

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        className={`pixel-canvas ${cursorClass}`}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={() => {
          setHover(null)
          handleUp()
        }}
        style={{ touchAction: 'none' }}
      />
      <div className="canvas-hint">
        {size}×{size} · {hover ? `(${hover.x}, ${hover.y})` : '准备作画'}
      </div>
    </div>
  )
}
