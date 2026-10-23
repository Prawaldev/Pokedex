import { useCallback, useEffect, useState } from 'react'
import { FinderEngine } from '../lib/finder'
import { isOfflineMode, offlineFinderPokemon } from '../api/offline'
import type { FinderPokemon } from '../types/pokemon'

export type FinderDataState =
  | { status: 'loading' }
  | { status: 'ready'; pokemon: FinderPokemon[]; engine: FinderEngine }
  | { status: 'error'; message: string }

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'The Pokémon Finder data could not be loaded. Please try again.'
}

/**
 * Loads the static finder dataset generated from PokéAPI by `npm run data`,
 * then wraps it in a matching engine. Fetching the JSON (rather than bundling
 * it) keeps the main bundle small; after this one request every search is
 * local.
 */
export function useFinderData() {
  const [state, setState] = useState<FinderDataState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    const request: Promise<FinderPokemon[]> = isOfflineMode()
      ? offlineFinderPokemon()
      : fetch(`${import.meta.env.BASE_URL}data/pokemon.json`).then((response) => {
          if (!response.ok) {
            throw new Error(`The finder data request failed (HTTP ${response.status}).`)
          }
          return response.json() as Promise<FinderPokemon[]>
        })

    request
      .then((pokemon) => {
        if (active) setState({ status: 'ready', pokemon, engine: new FinderEngine(pokemon) })
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
    setAttempt((count) => count + 1)
  }, [])

  return { state, retry }
}
