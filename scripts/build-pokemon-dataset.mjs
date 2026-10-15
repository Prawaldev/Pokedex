import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/*
 * Builds the static dataset behind the Pokémon Finder.
 *
 * The finder matches a written description against types, Pokédex colour,
 * shape, abilities, species flavour text and body features. All of that is
 * fetched once here from PokéAPI's public GraphQL endpoint and written to
 * public/data/pokemon.json, so the running app can search locally without
 * touching the network (and without any AI service).
 *
 * Re-run with `npm run data` after a new generation of Pokémon ships.
 */

const ENDPOINT = 'https://beta.pokeapi.co/graphql/v1beta'
const BATCH_SIZE = 400
const OUTPUT = resolve(process.cwd(), 'public/data/pokemon.json')

const QUERY = `
  query Dataset($limit: Int!, $offset: Int!) {
    pokemon_v2_pokemon(
      where: { is_default: { _eq: true } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes( order_by: { slot: asc } ) {
        pokemon_v2_type { name }
      }
      pokemon_v2_pokemonabilities( order_by: { slot: asc } ) {
        is_hidden
        pokemon_v2_ability { name }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat { name }
      }
      pokemon_v2_pokemonspecy {
        pokemon_v2_pokemoncolor { name }
        pokemon_v2_pokemonshape { name }
        pokemon_v2_pokemonhabitat { name }
        is_legendary
        is_mythical
        is_baby
        generation_id
        pokemon_v2_pokemonspeciesflavortexts(
          where: { language_id: { _eq: 9 } }
          limit: 15
        ) {
          flavor_text
        }
        pokemon_v2_pokemonspeciesnames(
          where: { language_id: { _eq: 9 } }
          limit: 1
        ) {
          genus
        }
      }
    }
  }
`

const STAT_KEYS = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
}

/** PokéAPI flavour text is full of line breaks, form feeds and odd glyphs. */
function cleanText(value) {
  return value
    .replace(/[\n\r\f\u000b\u000c\u00ad]/g, ' ')
    .replace(/pok[eé]mon/gi, 'Pokémon')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchBatch(offset, attempt = 0) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { limit: BATCH_SIZE, offset } }),
  })

  if (!response.ok) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      return fetchBatch(offset, attempt + 1)
    }
    throw new Error(`PokéAPI responded with HTTP ${response.status} at offset ${offset}`)
  }

  const payload = await response.json()
  if (payload.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(payload.errors)}`)
  }
  return payload.data.pokemon_v2_pokemon
}

function toRecord(entry) {
  const species = entry.pokemon_v2_pokemonspecy ?? {}
  const stats = {}

  for (const stat of entry.pokemon_v2_pokemonstats ?? []) {
    const key = STAT_KEYS[stat.pokemon_v2_stat?.name]
    if (key) stats[key] = stat.base_stat
  }

  const flavorEntries = species.pokemon_v2_pokemonspeciesflavortexts ?? []
  const flavor = [...new Set(flavorEntries.map((row) => cleanText(row.flavor_text)))]
    .filter(Boolean)
    .join(' ')
  const genusEntry = species.pokemon_v2_pokemonspeciesnames?.[0]?.genus

  return {
    id: entry.id,
    name: entry.name,
    height: entry.height,
    weight: entry.weight,
    types: (entry.pokemon_v2_pokemontypes ?? [])
      .map((row) => row.pokemon_v2_type?.name)
      .filter(Boolean),
    abilities: (entry.pokemon_v2_pokemonabilities ?? [])
      .map((row) => row.pokemon_v2_ability?.name)
      .filter(Boolean),
    hiddenAbility: (entry.pokemon_v2_pokemonabilities ?? []).some((row) => row.is_hidden)
      ? (entry.pokemon_v2_pokemonabilities ?? []).find((row) => row.is_hidden)?.pokemon_v2_ability
          ?.name ?? null
      : null,
    color: species.pokemon_v2_pokemoncolor?.name ?? null,
    shape: species.pokemon_v2_pokemonshape?.name ?? null,
    habitat: species.pokemon_v2_pokemonhabitat?.name ?? null,
    genus: genusEntry ? cleanText(genusEntry) : '',
    flavor,
    generation: species.generation_id ?? null,
    isLegendary: Boolean(species.is_legendary),
    isMythical: Boolean(species.is_mythical),
    isBaby: Boolean(species.is_baby),
    stats: {
      hp: stats.hp ?? 0,
      attack: stats.attack ?? 0,
      defense: stats.defense ?? 0,
      specialAttack: stats.specialAttack ?? 0,
      specialDefense: stats.specialDefense ?? 0,
      speed: stats.speed ?? 0,
    },
  }
}

async function main() {
  const records = []

  for (let offset = 0; ; offset += BATCH_SIZE) {
    const batch = await fetchBatch(offset)
    if (batch.length === 0) break
    records.push(...batch.map(toRecord))
    console.log(`fetched ${records.length} Pokémon…`)
    if (batch.length < BATCH_SIZE) break
  }

  records.sort((a, b) => a.id - b.id)

  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(records))
  console.log(`wrote ${records.length} Pokémon to ${OUTPUT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
