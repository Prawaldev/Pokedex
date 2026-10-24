export interface PokemonCollectionEntry {
  seenAt: number
}

export interface CollectionData {
  entries: Record<string, PokemonCollectionEntry> // keyed by pokemon name
}

const COLLECTION_KEY = 'pokedex-collection'

function emptyCollection(): CollectionData {
  return { entries: {} }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Reads the locally stored list of Pokémon the reader has opened. Older
 * entries used a `seen` / `caught` state; any stored entry now counts as seen
 * so existing progress survives while caught tracking is removed.
 */
export function loadCollection(): CollectionData {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY)
    if (!raw) return emptyCollection()

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.entries)) return emptyCollection()

    const entries: Record<string, PokemonCollectionEntry> = {}
    for (const [key, value] of Object.entries(parsed.entries)) {
      if (!isRecord(value)) continue
      entries[key] = {
        seenAt: typeof value.seenAt === 'number' ? value.seenAt : Date.now(),
      }
    }

    return { entries }
  } catch {
    return emptyCollection()
  }
}

export function saveCollection(data: CollectionData) {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/** Adds a Pokémon to the seen list, leaving an existing timestamp alone. */
export function markPokemonSeen(data: CollectionData, key: string): CollectionData {
  if (data.entries[key]) return data

  return {
    entries: {
      ...data.entries,
      [key]: { seenAt: Date.now() },
    },
  }
}
