
import './App.css'

function App() {
  return (
    <main className="app">
      <header className="header">
        <h1>Pokédex</h1>
        <p>Discover and explore Pokémon.</p>
      </header>

      <section className="pokemon-section">
        <input
          type="text"
          placeholder="Search Pokémon..."
          className="search-input"
        />

        <div className="pokemon-grid">
          <article className="pokemon-card">
            <span className="pokemon-number">#001</span>
            <div className="pokemon-image">🌱</div>
            <h2>Bulbasaur</h2>
            <span className="pokemon-type">Grass / Poison</span>
          </article>

          <article className="pokemon-card">
            <span className="pokemon-number">#004</span>
            <div className="pokemon-image">🔥</div>
            <h2>Charmander</h2>
            <span className="pokemon-type">Fire</span>
          </article>

          <article className="pokemon-card">
            <span className="pokemon-number">#007</span>
            <div className="pokemon-image">💧</div>
            <h2>Squirtle</h2>
            <span className="pokemon-type">Water</span>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
