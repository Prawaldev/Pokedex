import { Link } from 'react-router-dom'
import { FinderChat } from '../components/FinderChat'
import { ThemeToggle } from '../components/ThemeToggle'

export function FinderPage() {
  return (
    <section className="panel finder-panel" aria-label="Pokémon Finder">
      <div className="detail-bar">
        <Link to="/" className="btn">
          <span aria-hidden="true">←</span> Back to Pokédex
        </Link>
        <ThemeToggle />
      </div>

      <FinderChat />
    </section>
  )
}
