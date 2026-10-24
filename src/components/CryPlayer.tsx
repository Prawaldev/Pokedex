import { useEffect, useRef, useState } from 'react'
import type { Pokemon } from '../types/pokemon'

export function CryPlayer({ pokemon }: { pokemon: Pokemon }) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Try to construct cry URL - common pattern
  const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`

  useEffect(() => {
    const audio = new Audio()
    audio.src = cryUrl
    audio.preload = 'none'
    audioRef.current = audio
    const onEnded = () => setPlaying(false)
    const onError = () => setError(true)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.pause()
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [cryUrl])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setError(true)
    }
  }

  if (error) {
    return (
      <section className="detail-section">
        <h2 className="label">Cry</h2>
        <div className="panel-tight" style={{ marginTop: '0.75rem' }}>
          <p className="meta">Cry not available.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="detail-section">
      <h2 className="label">Cry</h2>
      <div className="panel-tight" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn" onClick={toggle} aria-pressed={playing}>
          {playing ? 'Pause' : 'Play'} cry
        </button>
        <span className="meta">{playing ? 'Playing...' : 'Ready'}</span>
      </div>
    </section>
  )
}
