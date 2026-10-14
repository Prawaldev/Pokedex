import { useCallback, useEffect, useState } from 'react'
import { fetchPokemonTypeCached } from '../api/pokeapi'

export type TypeIndexState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; names: Set<string> }
  | { status: 'error'; message: string }

type LoadedState =
  | { type: string; attempt: number; status: 'ready'; names: Set<string> }
  | { type: string; attempt: number; status: 'error'; message: string }

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'That type could not be loaded. Please try again.'
}

/**
 * Loads the roster for one Pokémon type so the index can be filtered by it.
 * Passing `null` clears the filter and parks the hook in `idle`.
 */
export function usePokemonByType(type: string | null) {
  const [loaded, setLoaded] = useState<LoadedState | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!type) return

    let active = true

    fetchPokemonTypeCached(type)
      .then((resources) => {
        if (active) {
          setLoaded({
            type,
            attempt,
            status: 'ready',
            names: new Set(resources.map((r) => r.name)),
          })
        }
      })
      .catch((error: unknown) => {
        if (active) setLoaded({ type, attempt, status: 'error', message: messageOf(error) })
      })

    return () => {
      active = false
    }
  }, [type, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  /* The state only applies to the type/attempt it was fetched for; anything
     else reads as still loading, so a switch never flashes the old roster. */
  const state: TypeIndexState =
    !type || !loaded || loaded.type !== type || loaded.attempt !== attempt
      ? { status: type ? 'loading' : 'idle' }
      : loaded.status === 'ready'
        ? { status: 'ready', names: loaded.names }
        : { status: 'error', message: loaded.message }

  return { state, retry }
}
