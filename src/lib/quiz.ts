export interface QuizQuestion {
  id: string
  type: 'silhouette' | 'clues' | 'number'
  question: string
  answer: string // pokemon name
  options?: string[]
  hint?: string
}

const QUIZ_BEST_KEY = 'pokedex-quiz-best'

export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(QUIZ_BEST_KEY)
    if (!raw) return 0
    const n = parseInt(raw, 10)
    return isNaN(n) ? 0 : n
  } catch {
    return 0
  }
}

export function saveBestScore(score: number) {
  try {
    localStorage.setItem(QUIZ_BEST_KEY, String(score))
  } catch {
    // ignore
  }
}
