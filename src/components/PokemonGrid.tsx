import type { NamedResource } from '../types/pokemon'
import { PokemonCard } from './PokemonCard'

interface PokemonGridProps {
  resources: NamedResource[]
  onSelect: (resource: NamedResource) => void
}

export function PokemonGrid({ resources, onSelect }: PokemonGridProps) {
  return (
    <div className="pokemon-grid">
      {resources.map((resource) => (
        <PokemonCard key={resource.name} resource={resource} onSelect={onSelect} />
      ))}
    </div>
  )
}
