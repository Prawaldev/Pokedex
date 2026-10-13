import type { NamedResource, Pokemon, PokemonListResponse } from '../types/pokemon'

const API_BASE = 'https://pokeapi.co/api/v2'

/**
 * Single fetch wrapper: turns any failure into a short, human message the UI
 * can show next to a retry button.
 */
async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal }).catch(() => {
    throw new Error('Network error — check your connection and try again.')
  })

  if (!response.ok) {
    throw new Error(`The Pokédex request failed (HTTP ${response.status}).`)
  }

  return (await response.json()) as T
}

/** Pulls the numeric id out of a PokéAPI resource url. */
export function idFromResourceUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}

export function fetchPokemonIndex(): Promise<NamedResource[]> {
  return request<PokemonListResponse>(`${API_BASE}/pokemon?limit=100000&offset=0`).then(
    (data) => data.results,
  )
}

export function fetchPokemon(id: number, signal?: AbortSignal): Promise<Pokemon> {
  return request<Pokemon>(`${API_BASE}/pokemon/${id}`, signal)
}

/* A page of cards can ask for the same Pokémon more than once (a card and the
   detail dialog, or a stray re-render). Caching the in-flight promise dedupes
   those requests and keeps them from firing twice. Failures are evicted so a
   retry actually hits the network again. */
const detailCache = new Map<number, Promise<Pokemon>>()

export function fetchPokemonCached(id: number): Promise<Pokemon> {
  const cached = detailCache.get(id)
  if (cached) return cached

  const promise = fetchPokemon(id).catch((error: unknown) => {
    detailCache.delete(id)
    throw error
  })

  detailCache.set(id, promise)
  return promise
}
