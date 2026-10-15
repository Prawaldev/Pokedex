import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { FinderPage } from './pages/FinderPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PokemonPage } from './pages/PokemonPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="finder" element={<FinderPage />} />
        <Route path="pokemon/:name" element={<PokemonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
