import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="panel">
      <div className="header-bar">
        <p className="label">National Pokédex</p>
        <ThemeToggle />
      </div>

      <h1 className="display header-title">Pokédex</h1>

      <p className="prose-dim header-subtitle">
        Search every Pokémon by name or Pokédex number, then open a card for official
        artwork, types, abilities and base stats.
      </p>
    </header>
  )
}
