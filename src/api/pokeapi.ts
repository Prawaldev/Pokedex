import type { NamedResource, Pokemon, PokemonListResponse } from '../types/pokemon'

const API_BASE = 'https://pokeapi.co/api/v2'

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
  return request<PokemonListResponse>(`${API_BASE}/pokemon?limit=100000&offset=0`).then(
    (data) => data.results,
  )
}

export function fetchPokemon(
  identifier: string | number,
  signal?: AbortSignal,
): Promise<Pokemon> {
  return request<Pokemon>(`${API_BASE}/pokemon/${normalizeIdentifier(identifier)}`, signal)
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
