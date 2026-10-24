import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorBox, Loader } from '../components/Feedback'
import { PokemonProfile } from '../components/PokemonProfile'
import { ThemeToggle } from '../components/ThemeToggle'
import { EvolutionChainView } from '../components/EvolutionChain'
import { ShinyFormViewer } from '../components/ShinyFormViewer'
import { CryPlayer } from '../components/CryPlayer'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import { formatName } from '../lib/format'

export function PokemonPage() {
  const { name = '' } = useParams()

  /* Keyed by the URL param so switching Pokémon remounts the view and its
     loading state, instead of showing the previous Pokémon's data. */
  return <PokemonView key={name} name={name} />
}

function PokemonView({ name }: { name: string }) {
  const { state, retry } = usePokemonDetail(name)

  useEffect(() => {
    document.title =
      state.status === 'ready'
        ? `${formatName(state.pokemon.name)} · Pokédex`
        : state.status === 'error' && state.notFound
          ? 'Not found · Pokédex'
          : 'Pokédex'
  }, [state])

  return (
    <section className="panel" aria-label="Pokémon details">
      <div className="detail-bar">
        <Link to="/" className="btn">
          <span aria-hidden="true">←</span> Back to Pokédex
        </Link>
        <ThemeToggle />
      </div>

      {state.status === 'loading' && <Loader label="Loading Pokémon" />}

      {state.status === 'error' && state.notFound && (
        <>
          <h1 className="display not-found-title">No Pokémon found</h1>
          <p className="prose-dim not-found-text">
            Nothing matches &quot;{name}&quot;. Check the name or number, or head back to the
            Pokédex.
          </p>
          <Link to="/" className="btn btn-accent not-found-action">
            Back to Pokédex
          </Link>
        </>
      )}

      {state.status === 'error' && !state.notFound && (
        <ErrorBox message={state.message} onRetry={retry} />
      )}

      {state.status === 'ready' && (
        <>
          <PokemonProfile pokemon={state.pokemon} />
          <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
            <ShinyFormViewer pokemon={state.pokemon} />
            <CryPlayer pokemon={state.pokemon} />
            <EvolutionChainView pokemonName={state.pokemon.name} />
          </div>
        </>
      )}
    </section>
  )
}
