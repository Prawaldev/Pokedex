import { useState } from 'react'
import type { Pokemon } from '../types/pokemon'
import { artworkUrl, formatName } from '../lib/format'

export function ShinyFormViewer({ pokemon }: { pokemon: Pokemon }) {
  const [showShiny, setShowShiny] = useState(false)
  const normal = artworkUrl(pokemon)
  // Try to get shiny from sprites
  const shiny =
    pokemon.sprites.other?.['official-artwork']?.front_shiny ??
    (pokemon.sprites as any).front_shiny ??
    null

  const image = showShiny && shiny ? shiny : normal

  return (
    <section className="detail-section">
      <h2 className="label">Artwork & Forms</h2>
      <div className="panel-tight" style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="detail-art" style={{ width: '160px', height: '160px' }}>
            {image ? (
              <img src={image} alt={`${formatName(pokemon.name)} ${showShiny ? 'shiny' : 'normal'} artwork`} className="detail-image" />
            ) : (
              <span className="pokemon-art-fallback">×</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={() => setShowShiny(false)} aria-pressed={!showShiny}>Normal</button>
              <button className="btn" onClick={() => setShowShiny(true)} aria-pressed={showShiny}>Shiny</button>
            </div>
            <div>
              <p className="meta">{formatName(pokemon.name)} — {showShiny ? 'Shiny' : 'Normal'}</p>
              {showShiny && !shiny && <p className="meta">Shiny sprite not available.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
