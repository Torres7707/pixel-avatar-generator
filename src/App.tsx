import { useEffect, useMemo, useState } from 'react'
import { useAvatarStore } from './store/useAvatarStore'
import { PixelCanvas } from './components/PixelCanvas'
import { Toolbar } from './components/Toolbar'
import { Palette } from './components/Palette'
import { PreviewPanel } from './components/PreviewPanel'
import { PRESETS } from './constants'
import type { Preset } from './constants'
import { generateAvatarDataUri, generateAvatarGrid } from './utils/dicebear'
import { imageFileToGrid } from './utils/imageImport'
import { Icon } from './components/Icon'
import './App.css'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 预设缩略图：用 DiceBear 同步生成 SVG dataURI
  const presetGrids = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of PRESETS) {
      map[p.id] = generateAvatarDataUri(p.style, p.seed)
    }
    return map
  }, [])

  const handleRandom = async () => {
    setLoading(true)
    setError(null)
    try {
      const seed = Math.random().toString(36).slice(2)
      const { currentStyle, size, loadGrid } = useAvatarStore.getState()
      const grid = await generateAvatarGrid(currentStyle, seed, size)
      loadGrid(grid)
    } catch (e) {
      console.error(e)
      setError('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePreset = async (p: Preset) => {
    setLoading(true)
    setError(null)
    try {
      const { size, loadGrid } = useAvatarStore.getState()
      const grid = await generateAvatarGrid(p.style, p.seed, size)
      loadGrid(grid)
    } catch (e) {
      console.error(e)
      setError('载入预设失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const { size, loadGrid } = useAvatarStore.getState()
      const grid = await imageFileToGrid(file, size)
      loadGrid(grid)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : '导入图片失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 键盘快捷键：全局监听，通过 getState() 调用 action（无需 subscribe）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const cmd = e.metaKey || e.ctrlKey
      const s = useAvatarStore.getState()
      if (cmd && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        s.redo()
      } else if (e.key.toLowerCase() === 'b') s.setTool('pen')
      else if (e.key.toLowerCase() === 'e') s.setTool('eraser')
      else if (e.key.toLowerCase() === 'g') s.setTool('fill')
      else if (e.key.toLowerCase() === 'i') s.setTool('picker')
      else if (e.key.toLowerCase() === 'h') s.setShowGrid(!s.showGrid)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo" aria-hidden>▦</span>
          <div>
            <h1>像素头像生成器</h1>
            <p>DiceBear 部件 · 镜像绘制 · 可编辑 · 导出 PNG</p>
          </div>
        </div>
        <a className="gh" href="https://github.com" target="_blank" rel="noreferrer">
          React + TS + Vite
        </a>
      </header>

      {error && (
        <div className="toast">
          <span>{error}</span>
          <button className="toast-close" onClick={() => setError(null)} aria-label="关闭">
            <Icon name="trash" />
          </button>
        </div>
      )}

      <main className="layout">
        <Toolbar
          onRandom={handleRandom}
          loading={loading}
          onPreset={handlePreset}
          presetGrids={presetGrids}
          onImport={handleImport}
        />

        <div className="stage">
          <PixelCanvas />
        </div>

        <div className="right-col">
          <PreviewPanel />
          <div className="palette-card panel">
            <h3 className="panel-title">调色板</h3>
            <Palette />
          </div>
        </div>
      </main>
    </div>
  )
}
