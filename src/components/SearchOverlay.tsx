import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { idFromResourceUrl } from '../api/pokeapi'
import { artworkUrlById, filterResources, formatName, formatNumber } from '../lib/format'
import type { NamedResource } from '../types/pokemon'
import { SearchIcon } from './Icons'

interface SearchOverlayProps {
  onClose: () => void
  resources: NamedResource[]
}

const RESULT_LIMIT = 30

/**
 * A Wotaku-style search: the header magnifier opens this centred panel, and
 * results are picked with the keyboard or the mouse. Choosing one opens that
 * Pokémon's page. Mount it only while open so each session starts fresh.
 */
export function SearchOverlay({ onClose, resources }: SearchOverlayProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const results = useMemo(
    () => filterResources(resources, query).slice(0, RESULT_LIMIT),
    [resources, query],
  )

  function go(name: string) {
    onClose()
    navigate(`/pokemon/${name}`)
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault()
      go(results[active].name)
    }
  }

  const trimmed = query.trim()

  return (
    <div
      className="search-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="search-modal" role="dialog" aria-modal="true" aria-label="Search Pokémon">
        <div className="search-modal-bar">
          <span className="search-modal-icon">
            <SearchIcon size={17} />
          </span>
          <input
            ref={inputRef}
            type="search"
            className="search-modal-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search Pokémon by name or number"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Search Pokémon by name or number"
          />
          <kbd className="search-modal-kbd">Esc</kbd>
        </div>

        <div className="search-modal-results">
          {results.length === 0 ? (
            <p className="search-modal-empty">
              No Pokémon match &ldquo;{trimmed}&rdquo;. Try another name or number.
            </p>
          ) : (
            <ul className="search-result-list">
              {results.map((resource, index) => {
                const id = idFromResourceUrl(resource.url)
                return (
                  <li key={resource.name}>
                    <button
                      type="button"
                      className={`search-result${index === active ? ' is-active' : ''}`}
                      onMouseMove={() => setActive(index)}
                      onClick={() => go(resource.name)}
                    >
                      <span className="search-result-art">
                        <img
                          src={artworkUrlById(id)}
                          alt=""
                          width={96}
                          height={96}
                          loading="lazy"
                          decoding="async"
                          className="search-result-image"
                        />
                      </span>
                      <span className="search-result-text">
                        <span className="search-result-number">{formatNumber(id)}</span>
                        <span className="search-result-name">{formatName(resource.name)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
