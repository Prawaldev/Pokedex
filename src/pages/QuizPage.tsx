import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { SearchOverlay } from '../components/SearchOverlay'
import { usePokemonIndex } from '../hooks/usePokemonIndex'
import { artworkUrlById, formatName } from '../lib/format'
import { loadBestScore, saveBestScore } from '../lib/quiz'

type Mode = 'silhouette' | 'clues' | 'number'

export function QuizPage() {
  const { state } = usePokemonIndex()
  const [searchOpen, setSearchOpen] = useState(false)
  const resources = state.status === 'ready' ? state.resources : []
  const [mode, setMode] = useState<Mode>('silhouette')
  const [question, setQuestion] = useState<any>(null)
  const [options, setOptions] = useState<string[]>([])
  const [answer, setAnswer] = useState<string>('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => loadBestScore())
  const [asked, setAsked] = useState<Set<string>>(new Set())

  const generateQuestion = () => {
    if (resources.length === 0) return
    // pick random not asked recently if possible
    let candidates = resources.filter((r) => !asked.has(r.name))
    if (candidates.length === 0) {
      candidates = resources
      setAsked(new Set())
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)]
    const correct = picked.name
    setAsked((s) => new Set(s).add(correct))
    // build options
    const opts = new Set<string>([correct])
    while (opts.size < 4 && resources.length >= 4) {
      const rand = resources[Math.floor(Math.random() * resources.length)].name
      opts.add(rand)
    }
    const optArr = Array.from(opts).sort(() => Math.random() - 0.5)
    setOptions(optArr)
    setQuestion({ name: correct, id: parseInt(picked.url.match(/\/(\d+)\/?$/)?.[1] || '0') })
    setAnswer('')
    setRevealed(false)
  }

  useEffect(() => {
    generateQuestion()
  }, [resources.length, mode])

  const submit = (choice: string) => {
    if (revealed) return
    setAnswer(choice)
    setRevealed(true)
    const correct = question?.name
    if (choice === correct) {
      const newScore = score + 1
      const newStreak = streak + 1
      setScore(newScore)
      setStreak(newStreak)
      if (newScore > best) {
        setBest(newScore)
        saveBestScore(newScore)
      }
    } else {
      setStreak(0)
    }
  }

  const next = () => {
    generateQuestion()
  }

  const restart = () => {
    setScore(0)
    setStreak(0)
    setAsked(new Set())
    generateQuestion()
  }

  const correct = question?.name

  return (
    <>
      <Header selectedType={null} onTypeChange={() => {}} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} resources={resources} />}
      <section className="panel">
        <h1 className="display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Pokémon Quiz</h1>
        <p className="prose-dim" style={{ marginBottom: '1.5rem' }}>Guess the Pokémon! Multiple modes available.</p>

        <div className="panel-tight" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span className="label">Mode</span>
            <select className="btn" value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ marginLeft: '0.5rem' }}>
              <option value="silhouette">Silhouette</option>
              <option value="clues">Clues (types/description)</option>
              <option value="number">From number</option>
            </select>
          </div>
          <div className="meta">Score: {score} | Streak: {streak} | Best: {best}</div>
          <button className="btn" onClick={restart}>Restart</button>
        </div>

        {question && (
          <div className="panel-tight" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 className="label" style={{ marginBottom: '1rem' }}>
              {mode === 'silhouette' && 'Who is this Pokémon?'}
              {mode === 'clues' && 'Guess from clues'}
              {mode === 'number' && `Guess Pokémon #${question.id}`}
            </h2>
            {mode === 'silhouette' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <img
                  src={artworkUrlById(question.id)}
                  alt="Silhouette"
                  style={{ width: '200px', height: '200px', filter: revealed ? 'none' : 'brightness(0) contrast(1.2)' }}
                />
              </div>
            )}
            {mode === 'clues' && (
              <p className="meta" style={{ marginBottom: '1rem' }}>Guess from type/name clues (hints revealed after answer)</p>
            )}
            {mode === 'number' && (
              <p className="meta" style={{ marginBottom: '1rem' }}>Identify from Pokédex number</p>
            )}

            <div className="quiz-options">
              {options.map((opt) => (
                <button
                  key={opt}
                  className="btn"
                  onClick={() => submit(opt)}
                  disabled={revealed}
                  style={{
                    backgroundColor: revealed && opt === correct ? 'var(--amber)' : revealed && opt === answer && opt !== correct ? 'var(--surface-sunken)' : 'var(--surface-raised)',
                  }}
                >
                  {formatName(opt)}
                </button>
              ))}
            </div>

            {revealed && (
              <div style={{ marginTop: '1rem' }}>
                <p className={answer === correct ? 'meta' : 'meta'} style={{ color: answer === correct ? 'var(--amber)' : 'var(--ink)' }}>
                  {answer === correct ? 'Correct!' : `Wrong! Correct answer: ${formatName(correct)}`}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                  <img src={artworkUrlById(question.id)} alt={formatName(correct)} style={{ width: '120px', height: '120px' }} />
                </div>
                <button className="btn" onClick={next} style={{ marginTop: '1rem' }}>Next Question</button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">Back to Pokédex</Link>
        </div>
      </section>
    </>
  )
}
