import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorBox, Loader } from '../components/Feedback'
import { Header } from '../components/Header'
import { SearchOverlay } from '../components/SearchOverlay'
import { TypeBadge } from '../components/TypeBadge'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { artworkUrl, formatHeight, formatName, formatNumber, formatWeight, STAT_LABELS } from '../lib/format'
import type { NamedResource } from '../types/pokemon'

function PokemonSelect({ resources, value, onChange, label }: { resources: NamedResource[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="btn" value={value} onChange={(e) => onChange(e.target.value)} style={{ marginTop: '0.5rem', width: '100%' }}>
        <option value="">Select Pokémon</option>
        {resources.map((r) => (
          <option key={r.name} value={r.name}>
            {formatName(r.name)} ({formatNumber(r.url.match(/\/(\d+)\/?$/)?.[1] ? Number(r.url.match(/\/(\d+)\/?$/)?.[1]) : 0)})
          </option>
        ))}
      </select>
    </div>
  )
}

export function ComparePage() {
  const { state } = usePokemonIndex()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const a = searchParams.get('a') || ''
  const b = searchParams.get('b') || ''

  const resources = state.status === 'ready' ? state.resources : []

  const setA = (v: string) => {
    const p = new URLSearchParams(searchParams)
    if (v) p.set('a', v)
    else p.delete('a')
    setSearchParams(p)
  }
  const setB = (v: string) => {
    const p = new URLSearchParams(searchParams)
    if (v) p.set('b', v)
    else p.delete('b')
    setSearchParams(p)
  }

  const detailA = usePokemonDetail(a || '')
  const detailB = usePokemonDetail(b || '')

  const stats = useMemo(() => {
    const keys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
    const res: Array<{ key: string; label: string; va: number; vb: number }> = []
    if (detailA.state.status === 'ready' && detailB.state.status === 'ready') {
      const pa = detailA.state.pokemon
      const pb = detailB.state.pokemon
      for (const k of keys) {
        const sa = pa.stats.find((s) => s.stat.name === k)?.base_stat ?? 0
        const sb = pb.stats.find((s) => s.stat.name === k)?.base_stat ?? 0
        res.push({ key: k, label: STAT_LABELS[k] ?? formatName(k), va: sa, vb: sb })
      }
    }
    return res
  }, [detailA.state, detailB.state])

  const totalA = stats.reduce((sum, s) => sum + s.va, 0)
  const totalB = stats.reduce((sum, s) => sum + s.vb, 0)

  const renderCard = (det: ReturnType<typeof usePokemonDetail>, name: string) => {
    if (!name) return <div className="panel-tight"><p className="meta">Select a Pokémon</p></div>
    if (det.state.status === 'loading') return <Loader label="Loading" />
    if (det.state.status === 'error') return <ErrorBox message={det.state.message} onRetry={det.retry} />
    const p = det.state.pokemon
    const img = artworkUrl(p)
    return (
      <div className="panel-tight compare-card">
        <div className="compare-card-head">
          <div className="detail-art compare-art">
            {img ? <img src={img} alt={formatName(p.name)} className="detail-image" /> : <span className="pokemon-art-fallback">×</span>}
          </div>
          <div className="compare-card-body">
            <p className="meta">{formatNumber(p.id)}</p>
            <h2 className="display compare-card-title">{formatName(p.name)}</h2>
            <div className="type-list compare-card-types">
              {p.types.map((t) => <TypeBadge key={t.slot} type={formatName(t.type.name)} />)}
            </div>
          </div>
        </div>
        <div className="compare-measurements">
          <div><span className="label">Height</span><div>{formatHeight(p.height)}</div></div>
          <div><span className="label">Weight</span><div>{formatWeight(p.weight)}</div></div>
        </div>
        <section className="compare-abilities">
          <h3 className="label">Abilities</h3>
          <ul className="ability-list">
            {p.abilities.map((ab) => (
              <li key={ab.slot}>{formatName(ab.ability.name)}{ab.is_hidden && <span className="meta ability-hidden">hidden</span>}</li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  return (
    <>
      <Header selectedType={null} onTypeChange={() => {}} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} resources={resources} />}
      <section className="panel">
        <h1 className="display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Pokémon Comparison</h1>
        <p className="prose-dim" style={{ marginBottom: '1.5rem' }}>Compare two Pokémon side by side. Higher values are highlighted.</p>
        {state.status === 'loading' && <Loader label="Loading index" />}
        {state.status === 'ready' && (
          <>
            <div className="compare-selectors">
              <PokemonSelect resources={resources} value={a} onChange={setA} label="Pokémon 1" />
              <PokemonSelect resources={resources} value={b} onChange={setB} label="Pokémon 2" />
            </div>
            <div className="compare-cards">
              {renderCard(detailA, a)}
              {renderCard(detailB, b)}
            </div>
            {detailA.state.status === 'ready' && detailB.state.status === 'ready' && (
              <div className="panel-tight" style={{ marginTop: '1.5rem' }}>
                <h2 className="label" style={{ marginBottom: '1rem' }}>Base Stats Comparison</h2>
                <div className="compare-stats">
                  {stats.map((s) => {
                    const higherA = s.va > s.vb
                    const higherB = s.vb > s.va
                    const diff = Math.abs(s.va - s.vb)
                    return (
                      <div key={s.key} className="compare-stat-row">
                        <div className="compare-stat-value is-left" style={{ color: higherA ? 'var(--amber)' : 'var(--ink)' }}>{s.va}{higherA && ` (+${diff})`}</div>
                        <div className="compare-stat-label"><span className="label">{s.label}</span></div>
                        <div className="compare-stat-value is-right" style={{ color: higherB ? 'var(--amber)' : 'var(--ink)' }}>{s.vb}{higherB && ` (+${diff})`}</div>
                      </div>
                    )
                  })}
                  <div className="compare-stat-row is-total">
                    <div className="compare-stat-value is-left" style={{ color: totalA > totalB ? 'var(--amber)' : 'var(--ink)' }}>{totalA}{totalA > totalB && ` (+${totalA - totalB})`}</div>
                    <div className="compare-stat-label"><span className="label">Total</span></div>
                    <div className="compare-stat-value is-right" style={{ color: totalB > totalA ? 'var(--amber)' : 'var(--ink)' }}>{totalB}{totalB > totalA && ` (+${totalB - totalA})`}</div>
                  </div>
                </div>
                <p className="meta" style={{ marginTop: '1rem' }}>No absolute winner declared by total alone — comparison is objective.</p>
              </div>
            )}
            {(a || b) && (
              <div style={{ marginTop: '1rem' }}>
                <Link to="/" className="btn">Back to Pokédex</Link>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
