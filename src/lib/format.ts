import type { NamedResource, Pokemon } from '../types/pokemon'
import { idFromResourceUrl } from '../api/pokeapi'

/** "mr-mime" -> "Mr Mime" */
export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ')
}

/** 25 -> "#0025" */
export function formatNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

/** PokéAPI height is in decimetres. */
export function formatHeight(decimetres: number): string {
  return `${(decimetres / 10).toFixed(1)} m`
}

/** PokéAPI weight is in hectograms. */
export function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}

/* PokéAPI's official artwork lives on its sprite CDN, so a thumbnail can be
   built from the id alone — no extra detail request for every search result. */
const SPRITE_ART_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

export function artworkUrlById(id: number): string {
  return `${SPRITE_ART_BASE}/${id}.png`
}

export function artworkUrl(pokemon: Pokemon): string | null {
  return (
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.front_default
  )
}

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

/* Canonical Pokémon type colours. */
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
}

export function typeColor(name: string): string {
  return TYPE_COLORS[name.trim().toLowerCase()] ?? '#6b7280'
}

/** The eighteen types, in PokéAPI's canonical order. */
export const TYPE_NAMES = Object.keys(TYPE_COLORS)

/* Accent presets for the theme colour picker. Red mirrors the default. */
export const ACCENT_PRESETS = [
  { name: 'Red', value: '#e5484d' },
  { name: 'Orange', value: '#f76b15' },
  { name: 'Yellow', value: '#f5c518' },
  { name: 'Green', value: '#30a46c' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
] as const

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].value

export const ACCENT_PATTERN = /^#[0-9a-f]{6}$/i

export function isAccent(value: string): boolean {
  return ACCENT_PATTERN.test(value)
}

/** Picks dark or light text so a coloured type chip stays readable. */
export function contrastInk(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }

  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  return luminance > 0.45 ? '#0a0a0a' : '#f8f4e1'
}

/** The highest base stat any Pokémon has; used to scale the stat bars. */
export const MAX_BASE_STAT = 255

/** Name or exact Pokédex number search. */
export function filterResources(resources: NamedResource[], query: string): NamedResource[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return resources

  const digits = trimmed.replace(/^#/, '')
  const isNumeric = /^\d+$/.test(digits)

  if (isNumeric) {
    const wanted = Number(digits)
    return resources.filter((resource) => idFromResourceUrl(resource.url) === wanted)
  }

  return resources.filter((resource) => {
    const name = formatName(resource.name).toLowerCase()
    return resource.name.includes(trimmed) || name.includes(trimmed)
  })
}
