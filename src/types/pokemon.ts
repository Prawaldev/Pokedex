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
