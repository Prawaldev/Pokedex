import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader } from '../components/Feedback'
import { Header } from '../components/Header'
import { SearchOverlay } from '../components/SearchOverlay'
import { TypeBadge } from '../components/TypeBadge'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { artworkUrl, formatName } from '../lib/format'
import { createEmptyTeam, loadTeams, saveTeams, type Team } from '../lib/team'
import { getTypeMatchups } from '../lib/typeEffectiveness'

export function TeamBuilderPage() {
  const { state } = usePokemonIndex()
  const [searchOpen, setSearchOpen] = useState(false)
  const resources = state.status === 'ready' ? state.resources : []
  const [teamsData, setTeamsData] = useState(() => loadTeams())
  const [activeTeamId, setActiveTeamId] = useState(teamsData.teams[0]?.id)
  const activeTeam = teamsData.teams.find((t) => t.id === activeTeamId) || teamsData.teams[0]

  const updateTeam = (team: Team) => {
    const next = { teams: teamsData.teams.map((t) => (t.id === team.id ? team : t)) }
    setTeamsData(next)
    saveTeams(next)
  }

  const addTeam = () => {
    const newTeam = createEmptyTeam(`Team ${teamsData.teams.length + 1}`)
    const next = { teams: [...teamsData.teams, newTeam] }
    setTeamsData(next)
    setActiveTeamId(newTeam.id)
    saveTeams(next)
  }

  const clearTeam = () => {
    if (!confirm('Clear this team?')) return
    const cleared = { ...activeTeam, slots: [null, null, null, null, null, null] as any }
    updateTeam(cleared)
  }

  const setSlot = (idx: number, name: string | null) => {
    const slots = [...activeTeam.slots]
    if (!name) {
      slots[idx] = null
    } else {
      slots[idx] = { name, id: 0 }
    }
    updateTeam({ ...activeTeam, slots })
  }

  const teamPokemon = activeTeam.slots.filter(Boolean).map((s) => s!.name)
  const details = teamPokemon.map((name) => usePokemonDetail(name))

  const analysis = (() => {
    if (details.length === 0) return null
    const allTypes: string[] = []
    for (const d of details) {
      if (d.state.status === 'ready') {
        for (const t of d.state.pokemon.types) allTypes.push(t.type.name)
      }
    }
    // simple coverage: collect all types present
    const coverage = new Set(allTypes)
    // defensive analysis
    const weakCounts = new Map<string, number>()
    for (const d of details) {
      if (d.state.status === 'ready') {
        const defs = d.state.pokemon.types.map((t) => t.type.name as any)
        const m = getTypeMatchups(defs)
        for (const w of m.weaknesses) {
          weakCounts.set(w.type, (weakCounts.get(w.type) || 0) + 1)
        }
      }
    }
    const bigWeaknesses = Array.from(weakCounts.entries()).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1])
    return { coverage: Array.from(coverage), bigWeaknesses }
  })()

  const shareUrl = (() => {
    try {
      const names = activeTeam.slots.filter(Boolean).map((s) => s!.name).join(',')
      const url = new URL(window.location.href)
      url.searchParams.set('team', names)
      return url.toString()
    } catch {
      return ''
    }
  })()

  return (
    <>
      <Header selectedType={null} onTypeChange={() => {}} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} resources={resources} />}
      <section className="panel">
        <h1 className="display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Team Builder</h1>
        <p className="prose-dim" style={{ marginBottom: '1.5rem' }}>Build a team of up to 6 Pokémon. Analyze coverage and weaknesses.</p>

        <div className="panel-tight" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="btn" value={activeTeamId} onChange={(e) => setActiveTeamId(e.target.value)}>
            {teamsData.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn" onClick={addTeam}>New Team</button>
          <button className="btn" onClick={clearTeam}>Clear Team</button>
          {shareUrl && <button className="btn" onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Copied share URL'); }}>Share Team</button>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {activeTeam.slots.map((slot, idx) => (
            <div key={idx} className="panel-tight">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="label">Slot {idx + 1}</span>
                {slot && <button className="btn" onClick={() => setSlot(idx, null)}>Remove</button>}
              </div>
              {slot ? (
                <TeamSlot pokemonName={slot.name} />
              ) : (
                <select className="btn" style={{ width: '100%' }} onChange={(e) => setSlot(idx, e.target.value || null)}>
                  <option value="">Add Pokémon</option>
                  {resources.map((r) => <option key={r.name} value={r.name}>{formatName(r.name)}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>

        {analysis && (
          <div className="panel-tight" style={{ marginBottom: '1.5rem' }}>
            <h2 className="label" style={{ marginBottom: '0.75rem' }}>Team Analysis</h2>
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="meta">Type coverage (present): </span>
              {analysis.coverage.map((t) => <TypeBadge key={t} type={formatName(t)} />)}
            </div>
            <div>
              <span className="meta">Shared weaknesses (2+ team members weak): </span>
              {analysis.bigWeaknesses.length === 0 ? <span className="meta">None</span> : (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {analysis.bigWeaknesses.map(([t, c]) => (
                    <span key={t} className="btn">{formatName(t)} ({c})</span>
                  ))}
                </div>
              )}
            </div>
            <p className="meta" style={{ marginTop: '0.75rem' }}>Note: A simple score doesn't determine competitive strength.</p>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">Back to Pokédex</Link>
        </div>
      </section>
    </>
  )
}

function TeamSlot({ pokemonName }: { pokemonName: string }) {
  const det = usePokemonDetail(pokemonName)
  if (det.state.status === 'loading') return <Loader label="Loading" />
  if (det.state.status === 'error') return <p className="meta">Error</p>
  const p = det.state.pokemon
  const img = artworkUrl(p)
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <div className="detail-art" style={{ width: '80px', height: '80px' }}>
        {img ? <img src={img} alt="" className="detail-image" /> : <span>×</span>}
      </div>
      <div>
        <Link to={`/pokemon/${p.name}`} className="text-link" style={{ fontWeight: 700 }}>{formatName(p.name)}</Link>
        <div className="type-list" style={{ marginTop: '0.4rem' }}>
          {p.types.map((t) => <TypeBadge key={t.slot} type={formatName(t.type.name)} />)}
        </div>
      </div>
    </div>
  )
}
