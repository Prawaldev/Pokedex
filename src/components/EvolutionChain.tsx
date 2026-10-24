import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBox, Loader } from '../components/Feedback'
import { fetchEvolutionDataCached } from '../api/pokeapi'
import { artworkUrlById, formatName } from '../lib/format'
import type { EvolutionChain, EvolutionSpeciesNode } from '../types/pokemon'

function describeDetails(details: any[]) {
  if (!details || details.length === 0) return []
  const d = details[0]
  const parts: string[] = []
  if (d.trigger) parts.push(d.trigger.replace(/-/g, ' '))
  if (d.minLevel) parts.push(`Level ${d.minLevel}`)
  if (d.item) parts.push(`Use ${formatName(d.item)}`)
  if (d.heldItem) parts.push(`Held ${formatName(d.heldItem)}`)
  if (d.minHappiness) parts.push(`Happiness ${d.minHappiness}+`)
  if (d.timeOfDay) parts.push(d.timeOfDay)
  if (d.tradeSpecies) parts.push(`Trade for ${formatName(d.tradeSpecies)}`)
  if (d.location) parts.push(`At ${formatName(d.location)}`)
  if (d.needsOverworldRain) parts.push('Rain')
  if (d.turnUpsideDown) parts.push('Upside down')
  return parts
}

export function EvolutionChainView({ pokemonName }: { pokemonName: string }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'ready'; chain: EvolutionChain | null } | { status: 'error'; message: string }>({ status: 'loading' })

  useEffect(() => {
    let active = true
    fetchEvolutionDataCached()
      .then((data) => {
        if (!active) return
        const chainId = data.bySpecies[pokemonName]
        if (!chainId) {
          setState({ status: 'ready', chain: null })
          return
        }
        const chain = data.chains[String(chainId)]
        if (!chain) {
          setState({ status: 'ready', chain: null })
          return
        }
        setState({ status: 'ready', chain })
      })
      .catch((err) => {
        if (active) setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load evolution data' })
      })
    return () => { active = false }
  }, [pokemonName])

  if (state.status === 'loading') return <Loader label="Loading evolution" />
  if (state.status === 'error') return <ErrorBox message={state.message} onRetry={() => { window.location.reload() }} />
  if (state.status === 'ready' && !state.chain) return <p className="meta">No evolution data available.</p>

  const chain = state.status === 'ready' && state.chain ? state.chain : null
  if (!chain) return null

  const renderNode = (node: EvolutionSpeciesNode, depth: number = 0) => {
    const details = describeDetails(node.details)
    return (
      <div key={node.species.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to={`/pokemon/${node.species.name}`} className="pokemon-card" style={{ width: '200px' }}>
            <span className="pokemon-art">
              <img src={artworkUrlById(parseInt(node.species.url.match(/\/(\d+)\/?$/)?.[1] || '0'))} alt="" width={120} height={120} loading="lazy" className="pokemon-image" />
            </span>
            <span className="pokemon-name">{formatName(node.species.name)}</span>
          </Link>
          {node.evolvesTo.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {node.evolvesTo.map((child) => (
                <div key={child.species.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--surface-sunken)', color: 'var(--ink-dim)' }}>
                    {details.length > 0 ? details.join(' • ') : child.details.length > 0 ? 'Special condition' : '→'}
                  </div>
                  {renderNode(child, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="detail-section">
      <h2 className="label">Evolution Chain</h2>
      <div className="panel-tight" style={{ marginTop: '0.75rem' }}>
        {renderNode(chain.root)}
        {chain.root.evolvesTo.length > 1 && (
          <p className="meta" style={{ marginTop: '0.75rem' }}>Branching evolution family.</p>
        )}
      </div>
    </section>
  )
}
