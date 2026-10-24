export type TypeName =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy'

export const ALL_TYPES: TypeName[] = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

// Standard type effectiveness chart (attacking -> defending -> multiplier)
export const TYPE_CHART: Record<TypeName, Partial<Record<TypeName, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost: { psychic: 2, ghost: 2, normal: 0, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
}

export function getEffectiveness(attacking: TypeName, defending: TypeName[]): number {
  if (!defending || defending.length === 0) return 1
  let multiplier = 1
  for (const d of defending) {
    const val = TYPE_CHART[attacking]?.[d]
    if (val !== undefined) {
      multiplier *= val
    }
  }
  return multiplier
}

export function getTypeMatchups(defendingTypes: TypeName[]) {
  const weaknesses: Array<{ type: TypeName; multiplier: number }> = []
  const resistances: Array<{ type: TypeName; multiplier: number }> = []
  const immunities: Array<{ type: TypeName; multiplier: number }> = []
  
  for (const attacking of ALL_TYPES) {
    const mult = getEffectiveness(attacking, defendingTypes)
    if (mult === 0) {
      immunities.push({ type: attacking, multiplier: 0 })
    } else if (mult > 1) {
      weaknesses.push({ type: attacking, multiplier: mult })
    } else if (mult < 1) {
      resistances.push({ type: attacking, multiplier: mult })
    }
    // mult === 1 is normal, we can omit or include - requirement says distinguish
  }
  
  // Sort for clarity
  weaknesses.sort((a, b) => b.multiplier - a.multiplier)
  resistances.sort((a, b) => a.multiplier - b.multiplier)
  
  return { weaknesses, resistances, immunities, all: ALL_TYPES }
}

export function describeMultiplier(mult: number): string {
  if (mult === 0) return '0× (immune)'
  if (mult === 0.25) return '0.25× (quarter damage)'
  if (mult === 0.5) return '0.5× (half damage)'
  if (mult === 1) return '1× (normal)'
  if (mult === 2) return '2× (double damage)'
  if (mult === 4) return '4× (quad damage)'
  return `${mult}×`
}
