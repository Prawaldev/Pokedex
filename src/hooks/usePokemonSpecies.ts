import { useCallback, useEffect, useState } from 'react'
import { PokeApiError, fetchPokemonSpeciesCached } from '../api/pokeapi'
import { selectEnglishFlavorText } from '../lib/format'

export type SpeciesState =
  | { status: 'loading' }
  | { status: 'ready'; description: string | null }
  | { status: 'error'; message: string }

function messageOf(error: unknown): string {
  if (error instanceof PokeApiError && error.status === 404) {
    return 'No species record was found for this Pokémon.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'The description could not be loaded. Please try again.'
}

/**
 * Loads a Pokémon species record and extracts its English description. Kept
 * separate from the main detail request so a species failure never blocks the
 * rest of the page.
 */
export function usePokemonSpecies(identifier: string | number) {
  const [state, setState] = useState<SpeciesState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    fetchPokemonSpeciesCached(identifier)
      .then((species) => {
        if (active) {
          setState({
            status: 'ready',
            description: selectEnglishFlavorText(species.flavor_text_entries),
          })
        }
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
