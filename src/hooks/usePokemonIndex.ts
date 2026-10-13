import { useCallback, useEffect, useState } from 'react'
import { fetchPokemonIndex } from '../api/pokeapi'
import type { NamedResource } from '../types/pokemon'

export type IndexState =
  | { status: 'loading' }
  | { status: 'ready'; resources: NamedResource[] }
  | { status: 'error'; message: string }

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}

/** Loads the full Pokémon name index once so search can run locally. */
export function usePokemonIndex() {
  const [state, setState] = useState<IndexState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    fetchPokemonIndex()
      .then((resources) => {
        if (active) setState({ status: 'ready', resources })
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: messageOf(error) })
      })

    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
