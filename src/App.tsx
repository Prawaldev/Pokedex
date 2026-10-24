import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ComparePage } from './pages/ComparePage'
import { FinderPage } from './pages/FinderPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PokemonPage } from './pages/PokemonPage'
import { QuizPage } from './pages/QuizPage'
import { TeamBuilderPage } from './pages/TeamBuilderPage'
import { TrackerPage } from './pages/TrackerPage'
import { TypeCalculatorPage } from './pages/TypeCalculatorPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="finder" element={<FinderPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="types" element={<TypeCalculatorPage />} />
        <Route path="team" element={<TeamBuilderPage />} />
        <Route path="tracker" element={<TrackerPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="pokemon/:name" element={<PokemonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
