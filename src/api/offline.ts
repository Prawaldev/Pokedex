import type {
  EvolutionChain,
  FinderPokemon,
  NamedResource,
  Pokemon,
  PokemonSprites,
  PokemonSpecies,
} from '../types/pokemon'

interface OfflinePokedex {
  pokemon: Pokemon[]
  species: PokemonSpecies[]
  finder: FinderPokemon[]
  evolution?: import('../types/pokemon').EvolutionData
}

const API_BASE = 'https://pokeapi.co/api/v2'

let pending: Promise<OfflinePokedex> | null = null

export function isOfflineMode(): boolean {
  return import.meta.env.VITE_OFFLINE === 'true'
}

function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function localizeSprites(sprites: PokemonSprites): PokemonSprites {
  const artwork = sprites.other?.['official-artwork']?.front_default ?? null
  return {
    ...sprites,
    front_default: assetUrl(sprites.front_default),
    other: {
      ...sprites.other,
      'official-artwork': {
        ...sprites.other?.['official-artwork'],
        front_default: assetUrl(artwork),
      },
    },
  }
}

export function loadOfflinePokedex(): Promise<OfflinePokedex> {
  if (!pending) {
    const url = `${import.meta.env.BASE_URL}offline/pokedex.json`
    const request = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`The offline Pokédex data could not be loaded (HTTP ${response.status}).`)
        }
        return response.json() as Promise<OfflinePokedex>
      })
      .then((data) => ({
        ...data,
        pokemon: data.pokemon.map((pokemon) => ({
          ...pokemon,
          sprites: localizeSprites(pokemon.sprites),
        })),
      }))

    pending = request.catch((error: unknown) => {
      pending = null
      throw error
    })
  }

  return pending
}

function normalizeIdentifier(identifier: string | number): string {
  return String(identifier).trim().toLowerCase()
}

function resourceUrl(id: number): string {
  return `${API_BASE}/pokemon/${id}/`
}

export async function offlinePokemonIndex(): Promise<NamedResource[]> {
  const data = await loadOfflinePokedex()
  return data.pokemon.map((pokemon) => ({ name: pokemon.name, url: resourceUrl(pokemon.id) }))
}

export async function offlinePokemon(identifier: string | number): Promise<Pokemon | null> {
  const data = await loadOfflinePokedex()
  const key = normalizeIdentifier(identifier)
  return (
    data.pokemon.find(
      (pokemon) => String(pokemon.id) === key || pokemon.name === key,
    ) ?? null
  )
}

export async function offlineSpecies(
  identifier: string | number,
): Promise<PokemonSpecies | null> {
  const data = await loadOfflinePokedex()
  const key = normalizeIdentifier(identifier)
  return (
    data.species.find(
      (species) => String(species.id) === key || species.name === key,
    ) ?? null
  )
}

export async function offlinePokemonType(type: string): Promise<NamedResource[]> {
  const data = await loadOfflinePokedex()
  const key = normalizeIdentifier(type)
  return data.pokemon
    .filter((pokemon) => pokemon.types.some((entry) => entry.type.name === key))
    .map((pokemon) => ({ name: pokemon.name, url: resourceUrl(pokemon.id) }))
}

export async function offlineFinderPokemon(): Promise<FinderPokemon[]> {
  const data = await loadOfflinePokedex()
  return data.finder
}

export async function offlineEvolutionChain(): Promise<import('../types/pokemon').EvolutionData | undefined> {
  const data = await loadOfflinePokedex()
  return data.evolution
}

/**
 * Resolves a species' evolution chain from the bundled offline dataset. The
 * dataset keys families by species id, not by name, so the species record is
 * used to find the right chain.
 */
export async function offlineEvolutionForSpecies(
  identifier: string | number,
): Promise<EvolutionChain> {
  const data = await loadOfflinePokedex()
  const key = normalizeIdentifier(identifier)
  const species = data.species.find(
    (entry) => String(entry.id) === key || entry.name === key,
  )

  if (!species) {
    throw new Error('No species record was found in the offline dataset.')
  }
  if (!species.evolution_chain) {
    throw new Error('No evolution chain is recorded for this Pokémon.')
  }

  const evolution = data.evolution
  if (!evolution) {
    throw new Error('Evolution data is missing from the offline dataset.')
  }

  const chainId = evolution.bySpecies[String(species.id)]
  const chain = chainId === undefined ? undefined : evolution.chains[String(chainId)]
  if (!chain) {
    throw new Error('Evolution data is missing from the offline dataset.')
  }

  return chain
}

