import { useState } from 'react'
import { useAvatarStore } from '../store/useAvatarStore'
import { PALETTE_GROUPS, ALL_COLORS } from '../constants'

export function Palette() {
  const color = useAvatarStore((s) => s.color)
  const recentColors = useAvatarStore((s) => s.recentColors)
  const pushRecent = useAvatarStore((s) => s.pushRecent)
  const [custom, setCustom] = useState(color)

  return (
    <div className="palette">
      <div className="palette-head">
        <span className="current-chip" style={{ background: color }} />
        <span className="mono">{color.toUpperCase()}</span>
        <label className="custom-pick">
          <input
            type="color"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              pushRecent(e.target.value)
            }}
          />
          <span>+ 自定义</span>
        </label>
      </div>

      {recentColors.length > 0 && (
        <div className="palette-group">
          <div className="pg-title">最近使用</div>
          <div className="swatches">
            {recentColors.map((c, i) => (
              <button
                key={i}
                className={`swatch ${c === color ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => pushRecent(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {PALETTE_GROUPS.map((g) => (
        <div className="palette-group" key={g.name}>
          <div className="pg-title">{g.name}</div>
          <div className="swatches">
            {g.colors.map((c) => (
              <button
                key={c}
                className={`swatch ${c === color ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => pushRecent(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        className="swatch swatch-none"
        onClick={() => pushRecent(ALL_COLORS[0])}
        title="重置为第一个颜色"
      />
    </div>
  )
}
