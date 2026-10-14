import { useEffect, useRef, useState } from 'react'
import { TYPE_COLORS, TYPE_NAMES, formatName } from '../lib/format'
import { ChevronDownIcon, TagIcon } from './Icons'

interface TypeFilterProps {
  selectedType: string | null
  onChange: (type: string | null) => void
}

/** Header control that narrows the grid to a single Pokémon type. */
export function TypeFilter({ selectedType, onChange }: TypeFilterProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

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

  function select(type: string | null) {
    onChange(type)
    setOpen(false)
  }

  return (
    <div className="type-filter" ref={root}>
      <button
        type="button"
        className={`header-action${selectedType ? ' is-active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          selectedType ? `Filtering by ${formatName(selectedType)} type` : 'Filter by type'
        }
        title="Filter by type"
        onClick={() => setOpen((value) => !value)}
      >
        <TagIcon />
        <span>{selectedType ? formatName(selectedType) : 'Types'}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="type-menu" role="listbox" aria-label="Pokémon types">
          <button
            type="button"
            role="option"
            aria-selected={selectedType === null}
            className={`type-option${selectedType === null ? ' is-selected' : ''}`}
            onClick={() => select(null)}
          >
            All types
          </button>

          {TYPE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={selectedType === name}
              className={`type-option${selectedType === name ? ' is-selected' : ''}`}
              onClick={() => select(name)}
            >
              <span className="type-dot" style={{ backgroundColor: TYPE_COLORS[name] }} />
              {formatName(name)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
