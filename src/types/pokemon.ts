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
  types: PokemonType[]
  abilities: PokemonAbility[]
  stats: PokemonStat[]
  sprites: PokemonSprites
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
