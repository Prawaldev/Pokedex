import type { CSSProperties } from 'react'
import {
  STAT_LABELS,
  artworkUrl,
  formatHeight,
  formatName,
  formatNumber,
  formatWeight,
  typeColor,
} from '../lib/format'
import type { Pokemon } from '../types/pokemon'
import { StatBar } from './StatBar'
import { TypeBadge } from './TypeBadge'

export function PokemonProfile({ pokemon }: { pokemon: Pokemon }) {
  const image = artworkUrl(pokemon)
  const name = formatName(pokemon.name)

  /* The detail page borrows its accent from the Pokémon's primary type — the
     lowest slot — rather than the reader's chosen theme colour. */
  const primary = [...pokemon.types].sort((a, b) => a.slot - b.slot)[0]
  const accent = primary ? typeColor(primary.type.name) : undefined

  return (
    <div className="detail-content accent-scope" style={{ '--accent': accent } as CSSProperties}>
      <div className="detail-art">
        {image ? (
          <img
            src={image}
            alt={`${name} official artwork`}
            width={475}
            height={475}
            className="detail-image"
          />
        ) : (
          <span className="pokemon-art-fallback" role="img" aria-label="Artwork unavailable">
            ×
          </span>
        )}
      </div>

      <div className="detail-info">
        <p className="meta detail-number">{formatNumber(pokemon.id)}</p>
        <h1 className="display detail-name">{name}</h1>

        <div className="type-list detail-types">
          {pokemon.types.map((entry) => (
            <TypeBadge key={entry.slot} type={formatName(entry.type.name)} />
          ))}
        </div>

        <dl className="detail-measurements">
          <div>
            <dt className="label">Height</dt>
            <dd>{formatHeight(pokemon.height)}</dd>
          </div>
          <div>
            <dt className="label">Weight</dt>
            <dd>{formatWeight(pokemon.weight)}</dd>
          </div>
        </dl>

        <section className="detail-section">
          <h2 className="label">Abilities</h2>
          <ul className="ability-list">
            {pokemon.abilities.map((entry) => (
              <li key={entry.slot}>
                {formatName(entry.ability.name)}
                {entry.is_hidden && <span className="meta ability-hidden">hidden</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <h2 className="label">Base stats</h2>
          <ul className="stat-list">
            {pokemon.stats.map((entry) => (
              <StatBar
                key={entry.stat.name}
                label={STAT_LABELS[entry.stat.name] ?? formatName(entry.stat.name)}
                value={entry.base_stat}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
