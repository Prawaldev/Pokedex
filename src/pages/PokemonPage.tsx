import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorBox, Loader } from '../components/Feedback'
import { PokemonProfile } from '../components/PokemonProfile'
import { ThemeToggle } from '../components/ThemeToggle'
import { EvolutionChainView } from '../components/EvolutionChain'
import { usePokemonDetail } from '../hooks/usePokemonDetail'
import { formatName } from '../lib/format'
import { loadCollection, saveCollection, setPokemonState } from '../lib/collection'

const BUBBLE_MESSAGES = [
  "Caught me if you can!",
  "Wanna catch me?",
  "I wanna go with you!",
  "Hey! You found me!",
  "Let's go on an adventure!",
  "Are you adding me to your team?",
  "You've found me again!",
  "Your journey starts here!",
  "Take me with you!",
  "Psst... I'm right here!",
]

function pickMessage(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return BUBBLE_MESSAGES[hash % BUBBLE_MESSAGES.length]
}

export function PokemonPage() {
  const { name = '' } = useParams()

  /* Keyed by the URL param so switching Pokémon remounts the view and its
     loading state, instead of showing the previous Pokémon's data. */
  return <PokemonView key={name} name={name} />
}

function PokemonView({ name }: { name: string }) {
  const { state, retry } = usePokemonDetail(name)
  const timerRef = useRef<number | null>(null)
  const [bubbleMsg] = useState(() => pickMessage(name))
  const [showBubble, setShowBubble] = useState(false)
  const [showCatch, setShowCatch] = useState(false)
  const [caught, setCaught] = useState(false)

  useEffect(() => {
    document.title =
      state.status === 'ready'
        ? `${formatName(state.pokemon.name)} · Pokédex`
        : state.status === 'error' && state.notFound
          ? 'Not found · Pokédex'
          : 'Pokédex'
  }, [state])

  useEffect(() => {
    setShowBubble(false)
    setShowCatch(false)
    setCaught(false)
  }, [name])

  useEffect(() => {
    // Clear any existing timer when switching Pokémon or unmounting
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (state.status !== 'ready') {
      return
    }
    const pokemonName = state.pokemon.name
    // Show bubble after 2-3 seconds
    const bubbleTimer = window.setTimeout(() => {
      setShowBubble(true)
      // Show catch button shortly after bubble
      window.setTimeout(() => {
        setShowCatch(true)
      }, 400)
    }, 2500)

    timerRef.current = window.setTimeout(() => {
      try {
        const collection = loadCollection()
        const existing = collection.entries[pokemonName]
        if (existing?.state === 'seen' || existing?.state === 'caught') {
          timerRef.current = null
          return
        }
        const updated = setPokemonState(collection, pokemonName, 'seen')
        saveCollection(updated)
      } catch {
        // ignore
      }
      timerRef.current = null
    }, 2500)

    return () => {
      window.clearTimeout(bubbleTimer)
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.status, state.status === 'ready' ? state.pokemon.name : name])

  const handleCatch = () => {
    if (state.status !== 'ready') return
    try {
      const collection = loadCollection()
      const updated = setPokemonState(collection, state.pokemon.name, 'caught')
      saveCollection(updated)
      setCaught(true)
    } catch {
      // ignore
    }
  }

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
          <div style={{ position: 'relative' }}>
            {showBubble && (
              <div
                className="manga-speech-bubble"
                style={{
                  position: 'absolute',
                  top: '-2.8rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: '260px',
                  background: 'var(--surface-raised)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  padding: '0.5rem 0.75rem',
                  fontFamily: "'Brass Mono Code', ui-monospace, monospace",
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  zIndex: 2,
                  textAlign: 'center',
                  animation: 'fadeIn 0.3s ease-in',
                }}
                aria-live="polite"
              >
                {bubbleMsg}
                <span
                  className="manga-speech-tail"
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid var(--surface-raised)',
                    filter: 'drop-shadow(0 1px 0 var(--line))',
                  }}
                  aria-hidden="true"
                />
              </div>
            )}
            <PokemonProfile pokemon={state.pokemon} />
          </div>
          {showCatch && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn btn-accent" onClick={handleCatch} disabled={caught}>
                {caught ? 'Caught!' : 'Catch'}
              </button>
            </div>
          )}
          <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
            <EvolutionChainView pokemonName={state.pokemon.name} />
          </div>
        </>
      )}
    </section>
  )
}
