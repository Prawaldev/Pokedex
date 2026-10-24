import { useCallback, useEffect, useState } from 'react'
import { PokeApiError, fetchEvolutionChainForSpecies } from '../api/pokeapi'
import type { EvolutionChain } from '../types/pokemon'

export type EvolutionState =
  | { status: 'loading' }
  | { status: 'ready'; chain: EvolutionChain }
  | { status: 'error'; message: string }

function messageOf(error: unknown): string {
  if (error instanceof PokeApiError && error.status === 404) {
    return 'No evolution chain was found for this Pokémon.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'The evolution chain could not be loaded. Please try again.'
}

/**
 * Loads a Pokémon's complete evolution family. Switching Pokémon cancels the
 * previous result via the cleanup flag, and the API layer caches both the
 * species record and the evolution chain so repeat visits reuse one request.
 */
export function useEvolutionChain(identifier: string | number) {
  const [state, setState] = useState<EvolutionState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    fetchEvolutionChainForSpecies(identifier)
      .then((chain) => {
        if (active) setState({ status: 'ready', chain })
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: messageOf(error) })
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
