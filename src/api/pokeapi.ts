import type {
  EvolutionData,
  NamedResource,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeListResponse,
} from '../types/pokemon'
import {
  isOfflineMode,
  offlineEvolutionChain,
  offlinePokemon,
  offlinePokemonIndex,
  offlinePokemonType,
  offlineSpecies,
} from './offline'

const API_BASE = 'https://pokeapi.co/api/v2'
const OFFLINE = isOfflineMode()

/** Error carrying the HTTP status so the UI can tell a 404 from a real failure. */
export class PokeApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PokeApiError'
    this.status = status
  }
}

/**
 * Single fetch wrapper: turns any failure into a short, human message the UI
 * can show next to a retry button.
 */
async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal }).catch(() => {
    throw new Error('Network error — check your connection and try again.')
  })

  if (!response.ok) {
    throw new PokeApiError(
      `The Pokédex request failed (HTTP ${response.status}).`,
      response.status,
    )
  }

  return (await response.json()) as T
}

/** Pulls the numeric id out of a PokéAPI resource url. */
export function idFromResourceUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}

/** PokéAPI accepts either a name or an id in the same path segment. */
function normalizeIdentifier(identifier: string | number): string {
  return String(identifier).trim().toLowerCase()
}

export function fetchPokemonIndex(): Promise<NamedResource[]> {
  if (OFFLINE) return offlinePokemonIndex()
  return request<PokemonListResponse>(`${API_BASE}/pokemon?limit=100000&offset=0`).then(
    (data) => data.results,
  )
}

export async function fetchPokemon(
  identifier: string | number,
  signal?: AbortSignal,
): Promise<Pokemon> {
  if (OFFLINE) {
    const pokemon = await offlinePokemon(identifier)
    if (!pokemon) {
      throw new PokeApiError(`The Pokédex request failed (HTTP 404).`, 404)
    }
    return pokemon
  }
  return request<Pokemon>(`${API_BASE}/pokemon/${normalizeIdentifier(identifier)}`, signal)
}

export async function fetchPokemonSpecies(
  identifier: string | number,
  signal?: AbortSignal,
): Promise<PokemonSpecies> {
  if (OFFLINE) {
    const species = await offlineSpecies(identifier)
    if (!species) {
      throw new PokeApiError(`The Pokédex request failed (HTTP 404).`, 404)
    }
    return species
  }
  return request<PokemonSpecies>(
    `${API_BASE}/pokemon-species/${normalizeIdentifier(identifier)}`,
    signal,
  )
}

/** Every Pokémon that carries one of the eighteen types, e.g. "fire". */
export function fetchPokemonType(type: string, signal?: AbortSignal): Promise<NamedResource[]> {
  if (OFFLINE) return offlinePokemonType(type)
  return request<PokemonTypeListResponse>(
    `${API_BASE}/type/${normalizeIdentifier(type)}`,
    signal,
  ).then((data) => data.pokemon.map((entry) => entry.pokemon))
}

/* A type's roster is stable, so the fetched list is kept around. The promise
   is cached rather than the result so concurrent calls share one request. */
const typeCache = new Map<string, Promise<NamedResource[]>>()

export function fetchPokemonTypeCached(type: string): Promise<NamedResource[]> {
  const key = normalizeIdentifier(type)
  const cached = typeCache.get(key)
  if (cached) return cached

  const promise = fetchPokemonType(key).catch((error: unknown) => {
    typeCache.delete(key)
    throw error
  })

  typeCache.set(key, promise)
  return promise
}

/* The same Pokémon can be requested several times (route change, a card, a
   retry). Caching the in-flight promise dedupes those requests. Failures are
   evicted so a retry actually hits the network again. */
const detailCache = new Map<string, Promise<Pokemon>>()

export function fetchPokemonCached(identifier: string | number): Promise<Pokemon> {
  const key = normalizeIdentifier(identifier)
  const cached = detailCache.get(key)
  if (cached) return cached

  const promise = fetchPokemon(key).catch((error: unknown) => {
    detailCache.delete(key)
    throw error
  })

  detailCache.set(key, promise)
  return promise
}

/* Species records change rarely and are shared by every form of a Pokémon, so
   the same in-flight promise cache is used here too. */
const speciesCache = new Map<string, Promise<PokemonSpecies>>()

export function fetchPokemonSpeciesCached(
  identifier: string | number,
): Promise<PokemonSpecies> {
  const key = normalizeIdentifier(identifier)
  const cached = speciesCache.get(key)
  if (cached) return cached

  const promise = fetchPokemonSpecies(key).catch((error: unknown) => {
    speciesCache.delete(key)
    throw error
  })

  speciesCache.set(key, promise)
  return promise
}

const evolutionCache = new Map<string, Promise<EvolutionData>>()

export function fetchEvolutionDataCached(): Promise<EvolutionData> {
  const key = 'evolution'
  const cached = evolutionCache.get(key)
  if (cached) return cached

  const promise = (async () => {
    if (OFFLINE) {
      const data = await offlineEvolutionChain()
      if (!data) throw new Error('Evolution data not available')
      return data
    }
    // Try to load from offline dataset structure if present in public data? Or use offline structure
    // In online mode, better to construct from what we have - but easier to also check offline style
    // Fallback: try loading evolution data similar to offline if bundled
    const url = `${import.meta.env.BASE_URL}offline/pokedex.json`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('Evolution data not available')
    const json = (await resp.json()) as { evolution?: EvolutionData }
    if (!json.evolution) throw new Error('Evolution data not available')
    return json.evolution
  })().catch((error: unknown) => {
    evolutionCache.delete(key)
    throw error
  })

  evolutionCache.set(key, promise)
  return promise
}

