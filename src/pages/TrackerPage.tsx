import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { idFromResourceUrl } from '../api/pokeapi'
import { Header } from '../components/Header'
import { SearchOverlay } from '../components/SearchOverlay'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { artworkUrlById, formatName, formatNumber } from '../lib/format'
import { loadCollection, saveCollection } from '../lib/collection'

export function TrackerPage() {
  const { state } = usePokemonIndex()
  const [searchOpen, setSearchOpen] = useState(false)
  const resources = state.status === 'ready' ? state.resources : []
  const [collection, setCollection] = useState(() => loadCollection())

  const reset = () => {
    if (!confirm('Reset seen Pokémon?')) return
    const next = { entries: {} }
    setCollection(next)
    saveCollection(next)
  }

  const seenResources = useMemo(() => {
    return resources
      .filter((resource) => collection.entries[resource.name])
      .sort((a, b) => {
        const aSeenAt = collection.entries[a.name]?.seenAt ?? 0
        const bSeenAt = collection.entries[b.name]?.seenAt ?? 0
        if (aSeenAt === bSeenAt) {
          return idFromResourceUrl(a.url) - idFromResourceUrl(b.url)
        }
        return bSeenAt - aSeenAt
      })
  }, [collection, resources])

  const counts = useMemo(() => {
    const total = resources.length
    const seen = seenResources.length
    const pctSeen = total === 0 ? 0 : Math.round((seen / total) * 100)
    return { total, seen, pctSeen }
  }, [resources.length, seenResources.length])

  return (
    <>
      <Header selectedType={null} onTypeChange={() => {}} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} resources={resources} />}
      <section className="panel">
        <h1 className="display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Seen Pokémon</h1>
        <p className="prose-dim" style={{ marginBottom: '1.5rem' }}>
          Pokémon you’ve viewed appear here with their artwork.
        </p>

        <div
          className="panel-tight"
          style={{
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <span className="label">Total</span>
            <div>{counts.total}</div>
          </div>
          <div>
            <span className="label">Seen</span>
            <div>
              {counts.seen} ({counts.pctSeen}%)
            </div>
          </div>
          <div>
            <span className="label">Unseen</span>
            <div>
              {counts.total - counts.seen} ({100 - counts.pctSeen}%)
            </div>
          </div>
        </div>

        <div className="panel-tight" style={{ marginBottom: '1.5rem' }}>
          <button className="btn" onClick={reset}>
            Reset Seen List
          </button>
        </div>

        {seenResources.length === 0 ? (
          <p className="empty">No Pokémon seen yet. Open a Pokémon page to add it to this list.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {seenResources.map((resource) => {
              const id = idFromResourceUrl(resource.url)
              const image = artworkUrlById(id)

              return (
                <Link
                  key={resource.name}
                  to={`/pokemon/${resource.name}`}
                  className="pokemon-card"
                  aria-label={`View details for ${formatName(resource.name)}, ${formatNumber(id)}`}
                >
                  <span className="pokemon-number">{formatNumber(id)}</span>
                  <span className="pokemon-art">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        width={475}
                        height={475}
                        loading="lazy"
                        decoding="async"
                        className="pokemon-image"
                      />
                    ) : (
                      <span className="pokemon-art-fallback" role="img" aria-label="Artwork unavailable">
                        ×
                      </span>
                    )}
                  </span>
                  <span className="pokemon-name">{formatName(resource.name)}</span>
                </Link>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">
            Back to Pokédex
          </Link>
        </div>
      </section>
    </>
  )
}
