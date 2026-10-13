import { useDeferredValue, useMemo, useState } from 'react'
import { ErrorBox, Loader } from './components/Feedback'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { PokemonDetail } from './components/PokemonDetail'
import { PokemonGrid } from './components/PokemonGrid'
import { SearchBar } from './components/SearchBar'
import { usePokemonIndex } from './hooks/usePokemonIndex'
import { filterResources } from './lib/format'
import type { NamedResource } from './types/pokemon'

const PAGE_SIZE = 24
const EMPTY_RESOURCES: NamedResource[] = []

export default function App() {
  const { state, retry } = usePokemonIndex()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<NamedResource | null>(null)

  const resources = state.status === 'ready' ? state.resources : EMPTY_RESOURCES

  const filtered = useMemo(
    () => filterResources(resources, deferredQuery),
    [resources, deferredQuery],
  )

  const visible = filtered.slice(0, visibleCount)

  function handleQueryChange(value: string) {
    setQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div id="top" className="page">
      <a href="#pokedex" className="skip-link">
        Skip to Pokémon list
      </a>

      <main className="shell layout">
        <Header />

        <section id="pokedex" className="panel" aria-labelledby="pokedex-heading">
          <h2 id="pokedex-heading" className="sr-only">
            Pokémon
          </h2>

          <SearchBar
            value={query}
            onChange={handleQueryChange}
            resultCount={state.status === 'ready' ? filtered.length : null}
          />

          {state.status === 'loading' && <Loader label="Loading Pokédex" />}

          {state.status === 'error' && <ErrorBox message={state.message} onRetry={retry} />}

          {state.status === 'ready' &&
            (filtered.length === 0 ? (
              <p className="empty">
                No Pokémon match &quot;{deferredQuery.trim()}&quot;. Try another name or number.
              </p>
            ) : (
              <>
                <PokemonGrid resources={visible} onSelect={setSelected} />

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

        <Footer />
      </main>

      <PokemonDetail resource={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
