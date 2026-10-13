import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'

export function NotFoundPage() {
  return (
    <section className="panel" aria-label="Page not found">
      <div className="detail-bar">
        <Link to="/" className="btn">
          <span aria-hidden="true">←</span> Back to Pokédex
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="display not-found-title">Page not found</h1>
      <p className="prose-dim not-found-text">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-accent not-found-action">
        Back to Pokédex
      </Link>
    </section>
  )
}
