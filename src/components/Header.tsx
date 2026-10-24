import { Link } from 'react-router-dom'
import { ColorPicker } from './ColorPicker'
import { ChatIcon, GitHubIcon, SearchIcon } from './Icons'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { TypeFilter } from './TypeFilter'

interface HeaderProps {
  selectedType: string | null
  onTypeChange: (type: string | null) => void
  onSearchOpen: () => void
}

export function Header({ selectedType, onTypeChange, onSearchOpen }: HeaderProps) {
  return (
    <header className="panel">
      <div className="header-bar">
        <div className="header-brand">
          <a
            href="https://github.com/prawaldev"
            className="icon-button"
            target="_blank"
            rel="noreferrer"
            aria-label="prawaldev on GitHub"
            title="prawaldev on GitHub"
          >
            <GitHubIcon />
          </a>
        </div>

        <div className="header-actions">
          <TypeFilter selectedType={selectedType} onChange={onTypeChange} />

          <button
            type="button"
            className="header-action"
            onClick={onSearchOpen}
            aria-label="Search Pokémon"
            title="Search Pokémon"
          >
            <SearchIcon />
            <span>Search</span>
          </button>

          <Link
            to="/finder"
            className="header-action"
            aria-label="Open the Pokémon Finder"
            title="Describe a Pokémon and find matches"
          >
            <ChatIcon />
            <span>Finder</span>
          </Link>
          <Link
            to="/compare"
            className="header-action"
            aria-label="Compare Pokémon"
            title="Compare two Pokémon"
          >
            <span>Compare</span>
          </Link>
          <Link
            to="/types"
            className="header-action"
            aria-label="Type effectiveness calculator"
            title="Type effectiveness calculator"
          >
            <span>Types</span>
          </Link>
          <Link
            to="/tracker"
            className="header-action"
            aria-label="Collection tracker"
            title="Collection tracker"
          >
            <span>Tracker</span>
          </Link>
          <Link
            to="/quiz"
            className="header-action"
            aria-label="Pokémon quiz"
            title="Pokémon quiz"
          >
            <span>Quiz</span>
          </Link>

          <ColorPicker />

          <ThemeToggle />
        </div>
      </div>

      <div className="header-lockup">
        <Logo className="header-logo" />
        <h1 className="display header-title">Pokédex</h1>
      </div>

      <p className="prose-dim header-subtitle">
        Search every Pokémon by name or Pokédex number, or describe one from memory in the
        Finder. Open a card for official artwork, types, abilities and base stats.
      </p>
    </header>
  )
}
