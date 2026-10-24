import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { SearchOverlay } from '../components/SearchOverlay'
import { TypeBadge } from '../components/TypeBadge'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { artworkUrl, formatName } from '../lib/format'
import { ALL_TYPES, describeMultiplier, getEffectiveness, getTypeMatchups, type TypeName } from '../lib/typeEffectiveness'

export function TypeCalculatorPage() {
  const { state } = usePokemonIndex()
  const [searchOpen, setSearchOpen] = useState(false)
  const resources = state.status === 'ready' ? state.resources : []
  const [mode, setMode] = useState<'pokemon' | 'types'>('pokemon')
  const [selectedPokemon, setSelectedPokemon] = useState('')
  const [t1, setT1] = useState<TypeName>('normal')
  const [t2, setT2] = useState<TypeName>('normal')

  const detail = usePokemonDetail(selectedPokemon)
  const defending = useMemo<TypeName[]>(() => {
    if (mode === 'pokemon' && detail.state.status === 'ready') {
      return detail.state.pokemon.types.map((t) => t.type.name.toLowerCase() as TypeName)
    }
    if (mode === 'types') {
      return [t1, t2].filter((t, i, arr) => arr.indexOf(t) === i) // unique? but dual types can be same? rare but keep distinct; better include as given
    }
    return []
  }, [mode, detail.state, t1, t2])

  const matchups = useMemo(() => getTypeMatchups(defending), [defending])

  useEffect(() => {
    // if same type selected twice for dual typing in calculator, that's fine - we pass both; our getEffectiveness multiplies both
  }, [])

  return (
    <>
      <Header selectedType={null} onTypeChange={() => {}} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} resources={resources} />}
      <section className="panel">
        <h1 className="display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Type Effectiveness Calculator</h1>
        <p className="prose-dim" style={{ marginBottom: '1.5rem' }}>Calculate weaknesses, resistances, and immunities using standard type matchups.</p>

        <div className="panel-tight" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button className="btn" onClick={() => setMode('pokemon')}>Select Pokémon</button>
            <button className="btn" onClick={() => setMode('types')}>Select Types</button>
          </div>
          {mode === 'pokemon' && (
            <div>
              <label className="label">Pokémon</label>
              <select className="btn" value={selectedPokemon} onChange={(e) => setSelectedPokemon(e.target.value)} style={{ marginTop: '0.5rem', width: '100%' }}>
                <option value="">Select Pokémon</option>
                {resources.map((r) => <option key={r.name} value={r.name}>{formatName(r.name)}</option>)}
              </select>
              {detail.state.status === 'ready' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
                  <div className="detail-art" style={{ width: '60px', height: '60px' }}>
                    {artworkUrl(detail.state.pokemon) ? <img src={artworkUrl(detail.state.pokemon)!} alt="" className="detail-image" /> : <span>×</span>}
                  </div>
                  <div className="type-list">
                    {detail.state.pokemon.types.map((t) => <TypeBadge key={t.slot} type={formatName(t.type.name)} />)}
                  </div>
                </div>
              )}
            </div>
          )}
          {mode === 'types' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Type 1</label>
                <select className="btn" value={t1} onChange={(e) => setT1(e.target.value as TypeName)} style={{ marginTop: '0.5rem', width: '100%' }}>
                  {ALL_TYPES.map((t) => <option key={t} value={t}>{formatName(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type 2 (optional)</label>
                <select className="btn" value={t2} onChange={(e) => setT2(e.target.value as TypeName)} style={{ marginTop: '0.5rem', width: '100%' }}>
                  <option value={t1}>Same as type 1</option>
                  {ALL_TYPES.map((t) => <option key={t} value={t}>{formatName(t)}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {defending.length > 0 && (
          <div className="panel-tight" style={{ marginBottom: '1.5rem' }}>
            <h2 className="label" style={{ marginBottom: '0.75rem' }}>Defending types: {defending.map(d => formatName(d)).join(' / ')}</h2>
            <p className="meta">Multiplier calculation: for each attacking type, multiply effectiveness against each defending type. Dual types combine multiplicatively.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="panel-tight">
            <h3 className="label" style={{ marginBottom: '0.75rem', color: 'var(--amber)' }}>Weaknesses (super effective)</h3>
            {matchups.weaknesses.length === 0 ? <p className="meta">None</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {matchups.weaknesses.map((w) => (
                  <li key={w.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TypeBadge type={formatName(w.type)} />
                    <span className="meta">{describeMultiplier(w.multiplier)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel-tight">
            <h3 className="label" style={{ marginBottom: '0.75rem' }}>Resistances (not very effective)</h3>
            {matchups.resistances.length === 0 ? <p className="meta">None</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {matchups.resistances.map((r) => (
                  <li key={r.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TypeBadge type={formatName(r.type)} />
                    <span className="meta">{describeMultiplier(r.multiplier)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel-tight">
            <h3 className="label" style={{ marginBottom: '0.75rem' }}>Immunities</h3>
            {matchups.immunities.length === 0 ? <p className="meta">None</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {matchups.immunities.map((i) => (
                  <li key={i.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TypeBadge type={formatName(i.type)} />
                    <span className="meta">{describeMultiplier(i.multiplier)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel-tight" style={{ marginTop: '1.5rem' }}>
          <h3 className="label" style={{ marginBottom: '0.75rem' }}>All attacking types</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {ALL_TYPES.map((att) => {
              const mult = defending.length > 0 ? getEffectiveness(att, defending) : 1
              return (
                <div key={att} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: 'var(--surface-raised)' }}>
                  <TypeBadge type={formatName(att)} />
                  <span className="meta">{describeMultiplier(mult)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">Back to Pokédex</Link>
        </div>
      </section>
    </>
  )
}
