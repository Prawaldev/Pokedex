import { useEffect, useRef, useState } from 'react'
import { useAccent } from '../hooks/useAccent'
import { ACCENT_PRESETS, isAccent } from '../lib/format'
import { ChevronDownIcon, PaletteIcon } from './Icons'

/** Header control that lets the reader recolour the accent, preset or custom. */
export function ColorPicker() {
  const { accent, isCustom, setAccent } = useAccent()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)

  const hex = draft ?? accent

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggleOpen() {
    setOpen((value) => !value)
    setDraft(null)
  }

  function choosePreset(value: string) {
    setAccent(value)
    setDraft(null)
  }

  function updateCustom(value: string) {
    setDraft(value)
    if (isAccent(value)) setAccent(value)
  }

  return (
    <div className="type-filter" ref={root}>
      <button
        type="button"
        className={`header-action${open ? ' is-active' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Change accent colour"
        title="Change accent colour"
        onClick={toggleOpen}
      >
        <PaletteIcon />
        <span>Color</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="type-menu color-menu" role="dialog" aria-label="Accent colour">
          <p className="color-menu-title">Accent</p>

          <div className="color-swatches">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`color-swatch${accent === preset.value ? ' is-selected' : ''}`}
                style={{ backgroundColor: preset.value }}
                aria-label={preset.name}
                aria-pressed={accent === preset.value}
                title={preset.name}
                onClick={() => choosePreset(preset.value)}
              />
            ))}
          </div>

          <div className="color-custom">
            <input
              type="color"
              className="color-input"
              value={accent}
              aria-label="Custom accent colour picker"
              onChange={(event) => updateCustom(event.target.value)}
            />
            <input
              type="text"
              className="field color-hex"
              value={hex}
              spellCheck={false}
              aria-label="Custom accent colour hex value"
              placeholder="#e5484d"
              onChange={(event) => updateCustom(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="color-reset"
            onClick={() => {
              setAccent(null)
              setDraft(null)
            }}
            disabled={!isCustom && accent === ACCENT_PRESETS[0].value}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  )
}
