import { useSyncExternalStore } from 'react'
import { DEFAULT_ACCENT, isAccent } from '../lib/format'

const STORAGE_KEY = 'pokedex-accent'

function readStored(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && isAccent(saved) ? saved : null
  } catch {
    /* private mode — fall back to the default accent */
    return null
  }
}

/* Module level so the choice survives route changes and stays in sync if the
   picker is mounted in more than one place. */
let accent: string | null = typeof document === 'undefined' ? null : readStored()
const listeners = new Set<() => void>()

function apply() {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  if (accent) root.style.setProperty('--accent', accent)
  else root.style.removeProperty('--accent')
}

function emit() {
  for (const listener of listeners) listener()
}

if (typeof document !== 'undefined') apply()

export function setAccent(next: string | null) {
  accent = next && isAccent(next) ? next.toLowerCase() : null

  try {
    if (accent) localStorage.setItem(STORAGE_KEY, accent)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode — the accent just won't be remembered */
  }

  apply()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return accent
}

/** Reads and updates the accent colour, persisting it for the next visit. */
export function useAccent() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    accent: value ?? DEFAULT_ACCENT,
    isCustom: value !== null,
    setAccent,
  }
}
