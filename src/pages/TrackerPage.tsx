import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { SearchOverlay } from '../components/SearchOverlay'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { formatName, formatNumber } from '../lib/format'
import { loadCollection, saveCollection, setPokemonState, type CollectionState } from '../lib/collection'

const STATES: CollectionState[] = ['none', 'seen', 'caught']

export function TrackerPage() {
  const { state } = usePokemonIndex()
  const [searchOpen, setSearchOpen] = useState(false)
  const resources = state.status === 'ready' ? state.resources : []
  const [collection, setCollection] = useState(() => loadCollection())
  const [filter, setFilter] = useState<CollectionState | 'all'>('all')

  const update = (key: string, s: CollectionState) => {
    const next = setPokemonState(collection, key, s)
    setCollection(next)
    saveCollection(next)
  }

  const reset = () => {
    if (!confirm('Reset all collection progress?')) return
    const next = { entries: {} }
    setCollection(next)
    saveCollection(next)
  }

  const counts = useMemo(() => {
    const total = resources.length
    let seen = 0
    let caught = 0
    for (const r of resources) {
      const e = collection.entries[r.name]
      if (!e) continue
      if (e.state === 'seen') seen++
      if (e.state === 'caught') caught++
    }
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
    return { total, seen, caught, pctSeen: pct(seen), pctCaught: pct(caught) }
  }, [collection, resources])

  const filtered = useMemo(() => {
    if (filter === 'all') return resources
    return resources.filter((r) => collection.entries[r.name]?.state === filter)
  }, [resources, collection, filter])

  return (
    <>
      <Header selectedType={null} onTypeChange={() => {}} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} resources={resources} />}
      <section className="panel">
        <h1 className="display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Pokédex Completion Tracker</h1>
        <p className="prose-dim" style={{ marginBottom: '1.5rem' }}>Mark Pokémon as Seen or Caught. Progress saved locally.</p>

        <div className="panel-tight" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div><span className="label">Total</span><div>{counts.total}</div></div>
          <div><span className="label">Seen</span><div>{counts.seen} ({counts.pctSeen}%)</div></div>
          <div><span className="label">Caught</span><div>{counts.caught} ({counts.pctCaught}%)</div></div>
        </div>

        <div className="panel-tight" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="btn" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="seen">Seen</option>
            <option value="caught">Caught</option>
          </select>
          <button className="btn" onClick={reset}>Reset Progress</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {filtered.map((r) => {
            const id = parseInt(r.url.match(/\/(\d+)\/?$/)?.[1] || '0')
            const e = collection.entries[r.name]
            const cur = e?.state || 'none'
            return (
              <div key={r.name} className="panel-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link to={`/pokemon/${r.name}`} className="text-link">{formatName(r.name)}</Link>
                    <span className="meta">{formatNumber(id)}</span>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <select className="btn" value={cur} onChange={(e) => update(r.name, e.target.value as CollectionState)}>
                      {STATES.map((s) => <option key={s} value={s}>{s === 'none' ? 'None' : s === 'seen' ? 'Seen' : s === 'caught' ? 'Caught' : s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">Back to Pokédex</Link>
        </div>
      </section>
    </>
  )
}
