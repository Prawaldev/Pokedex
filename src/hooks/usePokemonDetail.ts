import { useCallback, useEffect, useState } from 'react'
import { PokeApiError, fetchPokemonCached } from '../api/pokeapi'
import type { Pokemon } from '../types/pokemon'

export type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; pokemon: Pokemon }
  | { status: 'error'; message: string; notFound: boolean }

function messageOf(error: unknown): string {
  if (error instanceof PokeApiError && error.status === 404) {
    return 'We could not find that Pokémon. Check the name or number and try again.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'This Pokémon could not be loaded. Please try again.'
}

/**
 * Loads one Pokémon's full record by name or id. Callers key the component
 * using this hook so a new Pokémon always starts from `loading`.
 */
export function usePokemonDetail(identifier: string | number) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const id = String(identifier).trim()
    if (!id) {
      setState({ status: 'error', message: 'No Pokémon selected.', notFound: true })
      return () => {
        active = false
      }
    }

    setState({ status: 'loading' })
    fetchPokemonCached(id)
      .then((pokemon) => {
        if (active) setState({ status: 'ready', pokemon })
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: messageOf(error),
            notFound: error instanceof PokeApiError && error.status === 404,
          })
        }
      })

    return () => {
      active = false
    }
  }, [identifier, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
