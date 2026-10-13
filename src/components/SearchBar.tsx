interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number | null
}

export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="search">
      <label className="label" htmlFor="pokedex-search">
        Search
      </label>

      <input
        id="pokedex-search"
        type="search"
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="charizard or 6"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-describedby={resultCount !== null ? 'search-count' : undefined}
      />

      {resultCount !== null && (
        <p id="search-count" className="meta search-count" aria-live="polite">
          {resultCount} Pokémon found
        </p>
      )}
    </div>
  )
}
