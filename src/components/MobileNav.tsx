import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloseIcon, MenuIcon } from './Icons'

const MOBILE_LINKS = [
  { to: '/compare', label: 'Compare', hint: 'Compare two Pokémon' },
  { to: '/types', label: 'Type calculator', hint: 'Type effectiveness calculator' },
  { to: '/tracker', label: 'Tracker', hint: 'Collection tracker' },
  { to: '/quiz', label: 'Quiz', hint: 'Pokémon quiz' },
]

/** Collapses the secondary header tools into a burger menu on small screens. */
export function MobileNav() {
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

  return (
    <div className="mobile-nav" ref={root}>
      <button
        type="button"
        className={`icon-button mobile-nav-toggle${open ? ' is-active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        title={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <nav id="mobile-nav-menu" className="mobile-nav-menu" aria-label="More Pokémon tools">
          {MOBILE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="mobile-nav-link"
              title={link.hint}
              onClick={() => setOpen(false)}
            >
              <span>{link.label}</span>
              <span className="mobile-nav-hint">{link.hint}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
