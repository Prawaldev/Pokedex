import { useCallback, useEffect, useState } from 'react'
import { fetchPokemonCached } from '../api/pokeapi'
import type { Pokemon } from '../types/pokemon'

export type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; pokemon: Pokemon }
  | { status: 'error'; message: string }

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'This Pokémon could not be loaded. Please try again.'
}

/**
 * Loads one Pokémon's full record. Cached across cards and the dialog, and the
 * component using it is keyed by id so a new Pokémon starts at `loading`.
 */
export function usePokemonDetail(id: number) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    fetchPokemonCached(id)
      .then((pokemon) => {
        if (active) setState({ status: 'ready', pokemon })
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: messageOf(error) })
      })

    return () => {
      active = false
    }
  }, [id, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
