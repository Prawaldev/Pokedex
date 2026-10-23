import { usePokemonSpecies } from '../hooks/usePokemonSpecies'

export function PokemonDescription({ identifier }: { identifier: string }) {
  const { state, retry } = usePokemonSpecies(identifier)

  return (
    <section className="detail-section">
      <h2 className="label">Description</h2>

      {state.status === 'loading' && (
        <p className="meta detail-description-status" role="status">
          Loading description…
        </p>
      )}

      {state.status === 'ready' && (
        <p className="prose-dim detail-description">
          {state.description ?? 'No description is available for this Pokémon.'}
        </p>
      )}

      {state.status === 'error' && (
        <>
          <p className="prose-dim detail-description" role="alert">
            The description could not be loaded. {state.message}
          </p>
          <button
            type="button"
            className="btn btn-accent detail-description-action"
            onClick={retry}
          >
            <span aria-hidden="true">↻</span> Retry
          </button>
        </>
      )}
    </section>
  )
}
