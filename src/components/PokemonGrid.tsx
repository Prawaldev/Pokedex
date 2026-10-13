import type { NamedResource } from '../types/pokemon'
import { PokemonCard } from './PokemonCard'

interface PokemonGridProps {
  resources: NamedResource[]
}

export function PokemonGrid({ resources }: PokemonGridProps) {
  return (
    <div className="pokemon-grid">
      {resources.map((resource) => (
        <PokemonCard key={resource.name} resource={resource} />
      ))}
    </div>
  )
}
