export interface TeamPokemon {
  name: string
  id: number
}

export interface Team {
  id: string
  name: string
  slots: (TeamPokemon | null)[]
}

export interface TeamsData {
  teams: Team[]
}

const TEAMS_KEY = 'pokedex-teams'

export function loadTeams(): TeamsData {
  try {
    const raw = localStorage.getItem(TEAMS_KEY)
    if (!raw) return { teams: [createEmptyTeam('Team 1')] }
    const parsed = JSON.parse(raw) as TeamsData
    if (!parsed || !Array.isArray(parsed.teams)) return { teams: [createEmptyTeam('Team 1')] }
    return parsed
  } catch {
    return { teams: [createEmptyTeam('Team 1')] }
  }
}

export function saveTeams(data: TeamsData) {
  try {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function createEmptyTeam(name: string): Team {
  return {
    id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    slots: [null, null, null, null, null, null],
  }
}
