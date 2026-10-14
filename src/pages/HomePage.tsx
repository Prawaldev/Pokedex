import { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBox, Loader } from '../components/Feedback'
import { Header } from '../components/Header'
import { PokemonGrid } from '../components/PokemonGrid'
import { SearchOverlay } from '../components/SearchOverlay'
import { usePokemonByType } from '../hooks/usePokemonByType'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { formatName } from '../lib/format'
import type { NamedResource } from '../types/pokemon'

const PAGE_SIZE = 24
const EMPTY_RESOURCES: NamedResource[] = []

export function HomePage() {
  const { state, retry } = usePokemonIndex()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { state: typeState, retry: retryType } = usePokemonByType(selectedType)

  const resources = state.status === 'ready' ? state.resources : EMPTY_RESOURCES

  const filtered = useMemo(() => {
    if (!selectedType) return resources
    if (typeState.status !== 'ready') return EMPTY_RESOURCES
    return resources.filter((resource) => typeState.names.has(resource.name))
  }, [resources, selectedType, typeState])

  const visible = filtered.slice(0, visibleCount)

  const typeLoading = Boolean(selectedType) && typeState.status === 'loading'
  const typeError = Boolean(selectedType) && typeState.status === 'error'
  const ready = state.status === 'ready' && !typeLoading && !typeError

  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === '/' && !typing) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleTypeChange(type: string | null) {
    setSelectedType(type)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      <Header
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {searchOpen && <SearchOverlay onClose={closeSearch} resources={resources} />}

      <section className="panel" aria-labelledby="pokedex-heading">
        <h2 id="pokedex-heading" className="sr-only">
          Pokémon
        </h2>

        {state.status === 'loading' && <Loader label="Loading Pokédex" />}

        {state.status === 'error' && <ErrorBox message={state.message} onRetry={retry} />}

        {typeLoading && <Loader label={`Loading ${formatName(selectedType ?? '')} Pokémon`} />}

        {typeError && typeState.status === 'error' && (
          <ErrorBox message={typeState.message} onRetry={retryType} />
        )}

        {ready &&
          (filtered.length === 0 ? (
            <p className="empty">
              {selectedType
                ? `No Pokémon of the ${formatName(selectedType)} type were found.`
                : 'No Pokémon match. Try another name or number.'}
            </p>
          ) : (
            <>
              <PokemonGrid resources={visible} />

              {visible.length < filtered.length && (
                <div className="load-more">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    Load more <span aria-hidden="true">↓</span>
                  </button>
                  <p className="meta">
                    Showing {visible.length} of {filtered.length}
                  </p>
                </div>
              )}
            </>
          ))}
      </section>
    </>
  )
}
