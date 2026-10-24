export interface NamedResource {
  name: string
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: NamedResource[]
}

export interface PokemonType {
  slot: number
  type: NamedResource
}

export interface TypePokemonEntry {
  slot: number
  pokemon: NamedResource
}

export interface PokemonTypeListResponse {
  id: number
  name: string
  pokemon: TypePokemonEntry[]
}

export interface PokemonAbility {
  ability: NamedResource
  is_hidden: boolean
  slot: number
}

export interface PokemonStat {
  base_stat: number
  effort: number
  stat: NamedResource
}

export interface PokemonArtwork {
  front_default: string | null
  front_shiny?: string | null
}

export interface PokemonSprites {
  front_default: string | null
  other?: {
    'official-artwork'?: PokemonArtwork
  }
}

export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  species: NamedResource
  types: PokemonType[]
  abilities: PokemonAbility[]
  stats: PokemonStat[]
  sprites: PokemonSprites
}

export interface PokemonSpeciesFlavorTextEntry {
  flavor_text: string
  language: NamedResource
  version: NamedResource
}

export interface PokemonSpecies {
  id: number
  name: string
  flavor_text_entries: PokemonSpeciesFlavorTextEntry[]
  evolution_chain?: NamedResource | null
  generation?: NamedResource
  varieties?: Array<{
    is_default: boolean
    pokemon: NamedResource
  }>
}

export interface FinderStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

/**
 * One row of the local finder dataset generated from PokéAPI by
 * `npm run data`. It flattens everything the finder can match on so a written
 * description never has to hit the network at runtime.
 */
export interface FinderPokemon {
  id: number
  name: string
  height: number
  weight: number
  types: string[]
  abilities: string[]
  hiddenAbility: string | null
  color: string | null
  shape: string | null
  habitat: string | null
  genus: string
  flavor: string
  generation: number | null
  isLegendary: boolean
  isMythical: boolean
  isBaby: boolean
  stats: FinderStats
}

export interface EvolutionDetail {
  trigger: string | null
  minLevel: number | null
  item: string | null
  heldItem: string | null
  timeOfDay: string | null
  minHappiness: number | null
  minAffection?: number | null
  minBeauty?: number | null
  location: string | null
  knownMove: string | null
  knownMoveType: string | null
  needsOverworldRain: boolean
  turnUpsideDown: boolean
  relativePhysicalStats: number | null
  partySpecies: string | null
  partyType: string | null
  tradeSpecies: string | null
  gender: number | null
  needsMultiplayer?: boolean
}

export interface EvolutionSpeciesNode {
  species: NamedResource
  details: EvolutionDetail[]
  evolvesTo: EvolutionSpeciesNode[]
  isBaby?: boolean
}

export interface EvolutionChain {
  id: number
  root: EvolutionSpeciesNode
}

export interface EvolutionData {
  bySpecies: Record<string, number>
  chains: Record<string, EvolutionChain>
}

/** Raw shape returned by PokéAPI's evolution-chain endpoint. */
export interface EvolutionChainResource {
  id: number
  baby_trigger_item: NamedResource | null
  chain: EvolutionSpeciesResource
}

export interface EvolutionSpeciesResource {
  is_baby: boolean
  species: NamedResource
  evolution_details: EvolutionDetailResource[]
  evolves_to: EvolutionSpeciesResource[]
}

export interface EvolutionDetailResource {
  trigger: NamedResource | null
  min_level: number | null
  item: NamedResource | null
  held_item: NamedResource | null
  time_of_day: string
  min_happiness: number | null
  min_affection: number | null
  min_beauty: number | null
  location: NamedResource | null
  known_move: NamedResource | null
  known_move_type: NamedResource | null
  needs_overworld_rain: boolean
  turn_upside_down: boolean
  relative_physical_stats: number | null
  party_species: NamedResource | null
  party_type: NamedResource | null
  trade_species: NamedResource | null
  gender: number | null
  needs_multiplayer: boolean | null
}

