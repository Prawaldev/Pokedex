import { useEffect, useRef, type MouseEvent } from 'react'
import { idFromResourceUrl } from '../api/pokeapi'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import {
  STAT_LABELS,
  artworkUrl,
  formatHeight,
  formatName,
  formatNumber,
  formatWeight,
} from '../lib/format'
import type { NamedResource, Pokemon } from '../types/pokemon'
import { ErrorBox, Loader } from './Feedback'
import { StatBar } from './StatBar'
import { TypeBadge } from './TypeBadge'

interface PokemonDetailProps {
  resource: NamedResource | null
  onClose: () => void
}

/**
 * A native <dialog> so focus trapping, Escape and the backdrop come for free.
 * The panel inside is keyed by id, so switching Pokémon remounts it and the
 * loading state starts clean.
 */
export function PokemonDetail({ resource, onClose }: PokemonDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = resource !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="detail-dialog"
      aria-label="Pokémon details"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {resource && (
        <DetailPanel key={resource.url} id={idFromResourceUrl(resource.url)} onClose={onClose} />
      )}
    </dialog>
  )
}

interface DetailPanelProps {
  id: number
  onClose: () => void
}

function DetailPanel({ id, onClose }: DetailPanelProps) {
  const { state, retry } = usePokemonDetail(id)

  return (
    <div className="detail-body">
      <div className="detail-bar">
        <p className="label">Entry {formatNumber(id)}</p>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close details"
          title="Close details"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {state.status === 'loading' && <Loader label="Loading entry" />}
      {state.status === 'error' && <ErrorBox message={state.message} onRetry={retry} />}
      {state.status === 'ready' && <DetailContent pokemon={state.pokemon} />}
    </div>
  )
}

function DetailContent({ pokemon }: { pokemon: Pokemon }) {
  const image = artworkUrl(pokemon)
  const name = formatName(pokemon.name)

  return (
    <div className="detail-content">
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
        <h2 className="display detail-name">{name}</h2>

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
          <h3 className="label">Abilities</h3>
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
          <h3 className="label">Base stats</h3>
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
