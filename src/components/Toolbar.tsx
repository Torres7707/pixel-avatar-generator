import { useRef } from 'react'
import { useAvatarStore } from '../store/useAvatarStore'
import type { MirrorMode, Tool } from '../types'
import { SIZE_OPTIONS, PRESETS } from '../constants'
import type { Preset } from '../constants'
import { STYLE_OPTIONS } from '../utils/dicebear'
import { Icon } from './Icon'

interface Props {
  onRandom: () => void
  loading: boolean
  onPreset: (p: Preset) => void
  presetGrids: Record<string, string>
  onImport: (file: File) => void
}

const TOOLS: Array<{ key: Tool; name: string; icon: string; hint: string }> = [
  { key: 'pen', name: '画笔', icon: 'pen', hint: 'B' },
  { key: 'eraser', name: '橡皮', icon: 'eraser', hint: 'E' },
  { key: 'fill', name: '填充', icon: 'fill', hint: 'G' },
  { key: 'picker', name: '吸管', icon: 'picker', hint: 'I' },
]

const MIRRORS: Array<{ key: MirrorMode; name: string }> = [
  { key: 'none', name: '无' },
  { key: 'horizontal', name: '左右' },
  { key: 'vertical', name: '上下' },
  { key: 'both', name: '四向' },
]

export function Toolbar({ onRandom, loading, onPreset, presetGrids, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 从 store 精确订阅各自需要的字段
  const tool = useAvatarStore((s) => s.tool)
  const setTool = useAvatarStore((s) => s.setTool)
  const mirror = useAvatarStore((s) => s.mirror)
  const setMirror = useAvatarStore((s) => s.setMirror)
  const showGrid = useAvatarStore((s) => s.showGrid)
  const setShowGrid = useAvatarStore((s) => s.setShowGrid)
  const size = useAvatarStore((s) => s.size)
  const changeSize = useAvatarStore((s) => s.changeSize)
  const undo = useAvatarStore((s) => s.undo)
  const redo = useAvatarStore((s) => s.redo)
  const canUndo = useAvatarStore((s) => s.past.length > 0)
  const canRedo = useAvatarStore((s) => s.future.length > 0)
  const clear = useAvatarStore((s) => s.clear)
  const currentStyle = useAvatarStore((s) => s.currentStyle)
  const setStyle = useAvatarStore((s) => s.setStyle)
  const presets = PRESETS

  return (
    <aside className="panel toolbar">
      <section className="panel-sec">
        <h3 className="panel-title">绘图工具</h3>
        <div className="tool-grid">
          {TOOLS.map((t) => (
            <button
              key={t.key}
              className={`tool-btn ${tool === t.key ? 'active' : ''}`}
              onClick={() => setTool(t.key)}
              title={`${t.name} (${t.hint})`}
            >
              <Icon name={t.icon} />
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-sec">
        <h3 className="panel-title">操作</h3>
        <div className="btn-row">
          <button className="icon-btn" onClick={undo} disabled={!canUndo} title="撤销 (⌘Z)">
            <Icon name="undo" />
          </button>
          <button className="icon-btn" onClick={redo} disabled={!canRedo} title="重做 (⌘⇧Z)">
            <Icon name="redo" />
          </button>
          <button className="icon-btn danger" onClick={clear} title="清空画板">
            <Icon name="trash" />
          </button>
          <button
            className={`icon-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="网格 (H)"
          >
            <Icon name="grid" />
          </button>
        </div>
      </section>

      <section className="panel-sec">
        <h3 className="panel-title">镜像绘制</h3>
        <div className="seg">
          {MIRRORS.map((m) => (
            <button
              key={m.key}
              className={`seg-btn ${mirror === m.key ? 'active' : ''}`}
              onClick={() => setMirror(m.key)}
            >
              {m.name}
            </button>
          ))}
        </div>
        <p className="muted">左右镜像可快速绘制对称头像</p>
      </section>

      <section className="panel-sec">
        <h3 className="panel-title">画板尺寸</h3>
        <div className="seg">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              className={`seg-btn ${size === s ? 'active' : ''}`}
              onClick={() => changeSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-sec">
        <h3 className="panel-title">生成风格</h3>
        <div className="seg style-seg">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.key}
              className={`seg-btn ${currentStyle === s.key ? 'active' : ''}`}
              onClick={() => setStyle(s.key)}
              title={s.bg ? `背景 ${s.bg}` : '透明背景'}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-sec">
        <h3 className="panel-title">快速生成</h3>
        <button className="primary-btn full" onClick={onRandom} disabled={loading}>
          <Icon name="sparkles" /> {loading ? '生成中…' : '随机生成头像'}
        </button>
        <button
          className="primary-btn full outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Icon name="image" /> 导入图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImport(file)
            // 重置 value 使同一文件可重复选择
            e.target.value = ''
          }}
        />
        <div className="preset-grid">
          {presets.map((p) => (
            <button
              key={p.id}
              className="preset-btn"
              onClick={() => onPreset(p)}
              title={`载入「${p.name}」`}
            >
              {presetGrids[p.id] ? (
                <img src={presetGrids[p.id]} alt={p.name} />
              ) : (
                <span>{p.name}</span>
              )}
              <span className="preset-name">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="toolbar-foot muted">
        快捷键：B画笔 · E橡皮 · G填充 · I吸管 · H网格
      </footer>
    </aside>
  )
}
