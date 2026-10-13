import { idFromResourceUrl } from '../api/pokeapi'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import { artworkUrl, formatName, formatNumber } from '../lib/format'
import type { NamedResource } from '../types/pokemon'
import { TypeBadge } from './TypeBadge'

interface PokemonCardProps {
  resource: NamedResource
  onSelect: (resource: NamedResource) => void
}

export function PokemonCard({ resource, onSelect }: PokemonCardProps) {
  const id = idFromResourceUrl(resource.url)
  const { state } = usePokemonDetail(id)
  const name = formatName(resource.name)

  const pokemon = state.status === 'ready' ? state.pokemon : null
  const image = pokemon ? artworkUrl(pokemon) : null

  return (
    <button
      type="button"
      className="pokemon-card"
      onClick={() => onSelect(resource)}
      aria-label={`View details for ${name}, ${formatNumber(id)}`}
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
        ) : state.status === 'error' ? (
          <span className="pokemon-art-fallback" role="img" aria-label="Artwork unavailable">
            ×
          </span>
        ) : null}
      </span>

      <span className="pokemon-name">{name}</span>

      <span className="type-list">
        {pokemon && pokemon.types.length > 0 ? (
          pokemon.types.map((entry) => (
            <TypeBadge key={entry.slot} type={formatName(entry.type.name)} />
          ))
        ) : (
          <span className="type-badge type-badge-empty">
            {state.status === 'loading' ? '…' : '—'}
          </span>
        )}
      </span>
    </button>
  )
}
