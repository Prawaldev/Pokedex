export type CollectionState = 'none' | 'seen' | 'caught' | 'shinycaught'

export interface PokemonCollectionEntry {
  state: CollectionState
  seenAt?: number
  caughtAt?: number
  shinyCaughtAt?: number
}

export interface CollectionData {
  entries: Record<string, PokemonCollectionEntry> // keyed by pokemon name/id
}

const COLLECTION_KEY = 'pokedex-collection'

export function loadCollection(): CollectionData {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY)
    if (!raw) return { entries: {} }
    const parsed = JSON.parse(raw) as CollectionData
    if (!parsed || typeof parsed !== 'object' || !parsed.entries) return { entries: {} }
    return parsed
  } catch {
    return { entries: {} }
  }
}

export function saveCollection(data: CollectionData) {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function setPokemonState(data: CollectionData, key: string, state: CollectionState): CollectionData {
  const newData = { ...data, entries: { ...data.entries } }
  if (state === 'none') {
    delete newData.entries[key]
    return newData
  }
  const existing = newData.entries[key]
  const now = Date.now()
  newData.entries[key] = {
    state,
    seenAt: existing?.seenAt ?? now,
    caughtAt: state === 'caught' || state === 'shinycaught' ? now : (existing?.caughtAt),
    shinyCaughtAt: state === 'shinycaught' ? now : (existing?.shinyCaughtAt),
  }
  if (state === 'seen') {
    newData.entries[key].caughtAt = undefined
    newData.entries[key].shinyCaughtAt = undefined
  } else if (state === 'caught') {
    newData.entries[key].shinyCaughtAt = undefined
  }
  return newData
}

