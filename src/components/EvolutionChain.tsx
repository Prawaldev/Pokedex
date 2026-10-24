import { Link } from 'react-router-dom'
import { idFromResourceUrl } from '../api/pokeapi'
import { useEvolutionChain } from '../hooks/useEvolutionChain'
import { artworkUrlById, formatName } from '../lib/format'
import type { EvolutionDetail, EvolutionSpeciesNode } from '../types/pokemon'
import { ErrorBox, Loader } from './Feedback'

function describeDetail(detail: EvolutionDetail): string | null {
  const parts: string[] = []

  if (detail.trigger === 'level-up') {
    parts.push(detail.minLevel === null ? 'Level up' : `Level ${detail.minLevel}`)
  } else if (detail.trigger === 'use-item') {
    parts.push(detail.item ? `Use ${formatName(detail.item)}` : 'Use item')
  } else if (detail.trigger === 'trade') {
    parts.push(
      detail.tradeSpecies ? `Trade for ${formatName(detail.tradeSpecies)}` : 'Trade',
    )
  } else if (detail.trigger) {
    parts.push(formatName(detail.trigger))
  }

  if (detail.trigger !== 'use-item' && detail.item) {
    parts.push(`Use ${formatName(detail.item)}`)
  }
  if (detail.heldItem) parts.push(`Held ${formatName(detail.heldItem)}`)
  if (detail.timeOfDay) parts.push(`During ${detail.timeOfDay}`)
  if (detail.minHappiness !== null) parts.push(`Happiness ${detail.minHappiness}+`)
  if (detail.minAffection) parts.push(`Affection ${detail.minAffection}+`)
  if (detail.minBeauty) parts.push(`Beauty ${detail.minBeauty}+`)
  if (detail.location) parts.push(`At ${formatName(detail.location)}`)
  if (detail.knownMove) parts.push(`Knows ${formatName(detail.knownMove)}`)
  if (detail.knownMoveType) {
    parts.push(`Knows a ${formatName(detail.knownMoveType)}-type move`)
  }
  if (detail.needsOverworldRain) parts.push('During rain')
  if (detail.turnUpsideDown) parts.push('While upside down')
  if (detail.relativePhysicalStats !== null) {
    const comparison = {
      '-1': 'Attack < Defense',
      '0': 'Attack = Defense',
      '1': 'Attack > Defense',
    }[String(detail.relativePhysicalStats)]
    if (comparison) parts.push(comparison)
  }
  if (detail.partySpecies) parts.push(`With ${formatName(detail.partySpecies)} in party`)
  if (detail.partyType) parts.push(`With a ${formatName(detail.partyType)}-type in party`)
  if (detail.gender === 1) parts.push('Female')
  if (detail.gender === 2) parts.push('Male')
  if (detail.gender === 3) parts.push('Genderless')
  if (detail.needsMultiplayer) parts.push('Needs multiplayer')

  return parts.length > 0 ? parts.join(' • ') : null
}

function EvolutionNode({
  node,
  currentName,
}: {
  node: EvolutionSpeciesNode
  currentName: string
}) {
  const name = node.species.name
  const id = idFromResourceUrl(node.species.url)
  const isCurrent = name === currentName.trim().toLowerCase()
  const image = id > 0 ? artworkUrlById(id) : null

  return (
    <li className="evolution-node">
      <Link
        to={`/pokemon/${name}`}
        className={`evolution-card${isCurrent ? ' is-current' : ''}`}
        aria-current={isCurrent ? 'page' : undefined}
      >
        <span className="pokemon-art evolution-art">
          {image ? (
            <img
              src={image}
              alt={`${formatName(name)} artwork`}
              width={120}
              height={120}
              loading="lazy"
              className="pokemon-image"
            />
          ) : (
            <span className="pokemon-art-fallback" aria-hidden="true">
              ×
            </span>
          )}
        </span>
        <span className="pokemon-name">{formatName(name)}</span>
        {node.isBaby && <span className="evolution-tag">Baby</span>}
      </Link>

      {node.evolvesTo.length > 0 && (
        <ul className="evolution-branches">
          {node.evolvesTo.map((child, childIndex) => {
            const conditions = [
              ...new Set(
                child.details
                  .map(describeDetail)
                  .filter((condition): condition is string => condition !== null),
              ),
            ]

            return (
              <li
                className="evolution-branch"
                key={`${child.species.name}-${childIndex}`}
              >
                <div className="evolution-path">
                  <span className="evolution-arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="evolution-conditions">
                    {conditions.length > 0 ? (
                      conditions.map((condition, index) => (
                        <span
                          className="evolution-condition"
                          key={`${condition}-${index}`}
                        >
                          {condition}
                        </span>
                      ))
                    ) : (
                      <span className="evolution-condition">Special condition</span>
                    )}
                  </span>
                </div>
                <ul className="evolution-child-list">
                  <EvolutionNode node={child} currentName={currentName} />
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export function EvolutionChainView({ pokemonName }: { pokemonName: string }) {
  const { state, retry } = useEvolutionChain(pokemonName)

  return (
    <section className="detail-section">
      <h2 className="label">Evolution Chain</h2>

      {state.status === 'loading' && <Loader label="Loading evolution" />}

      {state.status === 'error' && (
        <ErrorBox message={state.message} onRetry={retry} />
      )}

      {state.status === 'ready' && (
        <div className="panel-tight evolution-panel">
          <ul className="evolution-tree">
            <EvolutionNode node={state.chain.root} currentName={pokemonName} />
          </ul>

          {state.chain.root.evolvesTo.length === 0 && (
            <p className="meta evolution-note">This Pokémon does not evolve.</p>
          )}

          {state.chain.root.evolvesTo.length > 1 && (
            <p className="meta evolution-note">Branching evolution family.</p>
          )}
        </div>
      )}
    </section>
  )
}
