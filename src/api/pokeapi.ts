import type {
  EvolutionChain,
  EvolutionChainResource,
  EvolutionDetail,
  EvolutionDetailResource,
  EvolutionSpeciesNode,
  EvolutionSpeciesResource,
  NamedResource,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeListResponse,
} from '../types/pokemon'
import {
  isOfflineMode,
  offlineEvolutionForSpecies,
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

function normalizeEvolutionDetail(detail: EvolutionDetailResource): EvolutionDetail {
  if (!detail || typeof detail !== 'object') {
    throw new Error('The evolution chain contained an invalid condition.')
  }

  return {
    trigger: detail.trigger?.name ?? null,
    minLevel: detail.min_level ?? null,
    item: detail.item?.name ?? null,
    heldItem: detail.held_item?.name ?? null,
    timeOfDay: detail.time_of_day || null,
    minHappiness: detail.min_happiness ?? null,
    minAffection: detail.min_affection ?? null,
    minBeauty: detail.min_beauty ?? null,
    location: detail.location?.name ?? null,
    knownMove: detail.known_move?.name ?? null,
    knownMoveType: detail.known_move_type?.name ?? null,
    needsOverworldRain: Boolean(detail.needs_overworld_rain),
    turnUpsideDown: Boolean(detail.turn_upside_down),
    relativePhysicalStats: detail.relative_physical_stats ?? null,
    partySpecies: detail.party_species?.name ?? null,
    partyType: detail.party_type?.name ?? null,
    tradeSpecies: detail.trade_species?.name ?? null,
    gender: detail.gender ?? null,
    needsMultiplayer: detail.needs_multiplayer ?? undefined,
  }
}

function normalizeEvolutionNode(node: EvolutionSpeciesResource): EvolutionSpeciesNode {
  if (
    !node ||
    typeof node !== 'object' ||
    !node.species ||
    typeof node.species.name !== 'string' ||
    typeof node.species.url !== 'string'
  ) {
    throw new Error('The evolution chain response was missing a species entry.')
  }

  return {
    species: { name: node.species.name, url: node.species.url },
    details: Array.isArray(node.evolution_details)
      ? node.evolution_details.map(normalizeEvolutionDetail)
      : [],
    evolvesTo: Array.isArray(node.evolves_to)
      ? node.evolves_to.map(normalizeEvolutionNode)
      : [],
    isBaby: Boolean(node.is_baby),
  }
}

async function fetchEvolutionChain(url: string): Promise<EvolutionChain> {
  const data = await request<EvolutionChainResource>(url)
  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.id !== 'number' ||
    !data.chain ||
    typeof data.chain !== 'object'
  ) {
    throw new Error('The evolution chain response was incomplete.')
  }

  return { id: data.id, root: normalizeEvolutionNode(data.chain) }
}

/* Evolution chains are keyed by their own URL rather than by Pokémon id —
   several species share a family, so one chain is fetched once for all of
   them. Failures are evicted so retry can reach the network again. */
const evolutionChainCache = new Map<string, Promise<EvolutionChain>>()

export function fetchEvolutionChainCached(url: string): Promise<EvolutionChain> {
  const key = url.trim()
  if (!key) {
    return Promise.reject(new Error('No evolution chain URL was provided.'))
  }

  const cached = evolutionChainCache.get(key)
  if (cached) return cached

  const promise = fetchEvolutionChain(key).catch((error: unknown) => {
    evolutionChainCache.delete(key)
    throw error
  })

  evolutionChainCache.set(key, promise)
  return promise
}

/**
 * Follows the same path as the API: species record first, then the
 * evolution-chain URL it points at. Offline builds resolve the family from the
 * bundled dataset instead.
 */
export async function fetchEvolutionChainForSpecies(
  identifier: string | number,
): Promise<EvolutionChain> {
  if (OFFLINE) return offlineEvolutionForSpecies(identifier)

  const species = await fetchPokemonSpeciesCached(identifier)
  const url = species.evolution_chain?.url
  if (!url) {
    throw new Error('No evolution chain is recorded for this Pokémon.')
  }

  return fetchEvolutionChainCached(url)
}

