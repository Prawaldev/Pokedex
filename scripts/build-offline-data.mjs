import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

/*
 * Prepares the complete offline dataset used by the Android build.
 *
 * Everything the app needs at runtime is written to `offline-data/`:
 *   - pokedex.json: Pokémon, English species descriptions, evolution chains and
 *     the Finder's flattened records
 *   - artwork/ and sprites/: local WebP images for every supported entry
 *
 * PokéAPI is only contacted while this script runs. The resulting assets are
 * copied into the Android APK by `npm run build:android`.
 *
 * Usage: npm run data:offline
 *        npm run data:offline -- --force     re-download cached API responses
 */

const API_BASE = 'https://pokeapi.co/api/v2'
const ROOT = resolve(process.cwd(), 'offline-data')
const CACHE = resolve(process.cwd(), '.cache/offline-api')
const ARTWORK = resolve(ROOT, 'artwork')
const SPRITES = resolve(ROOT, 'sprites')
const CONCURRENCY = 18
const FORCE = process.argv.includes('--force')

const STAT_KEYS = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
}

function resourceId(url) {
  const match = url?.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}

function cleanText(value) {
  return value
    .replace(/\u00ad/g, '')
    .replace(/pok[eé]mon/gi, 'Pokémon')
    .replace(/\s+/g, ' ')
    .trim()
}

function cachePath(url) {
  const hash = createHash('sha1').update(url).digest('hex')
  return resolve(CACHE, `${hash}.json`)
}

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms))

async function fetchJson(url, attempt = 0) {
  const file = cachePath(url)
  if (!FORCE && existsSync(file)) {
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {
      /* A partial cache write should never poison the build. */
    }
  }

  let status = 0
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'pokedex-offline-builder/1.0' },
      signal: AbortSignal.timeout(45_000),
    })
    status = response.status
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
    const data = await response.json()
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(data))
    return data
  } catch (error) {
    if (attempt < 6 && (status === 429 || status === 0 || status >= 500)) {
      await sleep(750 * (attempt + 1) ** 2)
      return fetchJson(url, attempt + 1)
    }
    throw error
  }
}

async function mapLimit(items, limit, worker, label) {
  let cursor = 0
  let finished = 0
  const results = new Array(items.length)

  async function run() {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
      finished += 1
      if (finished % 100 === 0 || finished === items.length) {
        console.log(`  ${label}: ${finished}/${items.length}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

async function downloadBinary(url, attempt = 0) {
  let status = 0
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'pokedex-offline-builder/1.0' },
      signal: AbortSignal.timeout(60_000),
    })
    status = response.status
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    if (attempt < 4 && (status === 429 || status === 0 || status >= 500)) {
      await sleep(500 * (attempt + 1) ** 2)
      return downloadBinary(url, attempt + 1)
    }
    throw error
  }
}

async function writeWebp(url, target, size, quality) {
  const buffer = await downloadBinary(url)
  await mkdir(dirname(target), { recursive: true })
  const temporary = `${target}.tmp`
  await sharp(buffer)
    .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toFile(temporary)
  await rename(temporary, target)
}

async function ensureImage(url, target, size, quality) {
  if (!url) return false
  if (!FORCE && existsSync(target)) {
    const info = await stat(target)
    if (info.size > 0) return true
  }
  await writeWebp(url, target, size, quality)
  return true
}

function simplifyEvolutionNode(node) {
  return {
    species: { name: node.species.name, url: node.species.url },
    details: (node.evolution_details ?? []).map((detail) => ({
      trigger: detail.trigger?.name ?? null,
      minLevel: detail.min_level ?? null,
      item: detail.item?.name ?? null,
      heldItem: detail.held_item?.name ?? null,
      timeOfDay: detail.time_of_day || null,
      minHappiness: detail.min_happiness ?? null,
      location: detail.location?.name ?? null,
      knownMove: detail.known_move?.name ?? null,
      knownMoveType: detail.known_move_type?.name ?? null,
      needsOverworldRain: Boolean(detail.needs_overworld_rain),
      turnUpsideDown: Boolean(detail.turn_upside_down),
      relativePhysicalStats: detail.relative_physical_stats ?? null,
      partySpecies: detail.party_species?.name ?? null,
      partyType: detail.party_type?.name ?? null,
      tradeSpecies: detail.trade_species?.name ?? null,
      gender: detail.gender ?? null,
    })),
    evolvesTo: (node.evolves_to ?? []).map(simplifyEvolutionNode),
  }
}

function speciesRecord(species) {
  const english = (species.flavor_text_entries ?? []).filter(
    (entry) => entry.language.name === 'en',
  )

  return {
    id: species.id,
    name: species.name,
    evolution_chain: species.evolution_chain
      ? {
          name: String(resourceId(species.evolution_chain.url)),
          url: species.evolution_chain.url,
        }
      : null,
    flavor_text_entries: english.map((entry) => ({
      flavor_text: entry.flavor_text,
      language: { name: 'en', url: entry.language.url },
      version: { name: entry.version.name, url: entry.version.url },
    })),
  }
}

function finderRecord(pokemon, species) {
  const stats = {}
  for (const entry of pokemon.stats ?? []) {
    const key = STAT_KEYS[entry.stat.name]
    if (key) stats[key] = entry.base_stat
  }

  const englishFlavor = (species.flavor_text_entries ?? [])
    .filter((entry) => entry.language.name === 'en')
    .map((entry) => cleanText(entry.flavor_text))
    .filter(Boolean)
  const flavor = [...new Set(englishFlavor)].join(' ')
  const hidden = (pokemon.abilities ?? []).find((entry) => entry.is_hidden)
  const genus = (species.genera ?? []).find((entry) => entry.language.name === 'en')?.genus

  return {
    id: pokemon.id,
    name: pokemon.name,
    height: pokemon.height,
    weight: pokemon.weight,
    types: (pokemon.types ?? [])
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name),
    abilities: (pokemon.abilities ?? [])
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.ability.name),
    hiddenAbility: hidden?.ability.name ?? null,
    color: species.color?.name ?? null,
    shape: species.shape?.name ?? null,
    habitat: species.habitat?.name ?? null,
    genus: genus ? cleanText(genus) : '',
    flavor,
    generation: species.generation ? resourceId(species.generation.url) : null,
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

function pokemonRecord(pokemon, species, images) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    height: pokemon.height,
    weight: pokemon.weight,
    species: {
      name: species.name,
      url: `${API_BASE}/pokemon-species/${species.id}/`,
    },
    types: (pokemon.types ?? []).map((entry) => ({
      slot: entry.slot,
      type: { name: entry.type.name, url: entry.type.url },
    })),
    abilities: (pokemon.abilities ?? []).map((entry) => ({
      ability: { name: entry.ability.name, url: entry.ability.url },
      is_hidden: entry.is_hidden,
      slot: entry.slot,
    })),
    stats: (pokemon.stats ?? []).map((entry) => ({
      base_stat: entry.base_stat,
      effort: entry.effort,
      stat: { name: entry.stat.name, url: entry.stat.url },
    })),
    sprites: {
      front_default: images.sprite,
      other: {
        'official-artwork': { front_default: images.artwork },
      },
    },
  }
}

async function main() {
  console.log('Fetching PokéAPI indexes…')
  const [pokemonIndex, speciesIndex] = await Promise.all([
    fetchJson(`${API_BASE}/pokemon?limit=100000&offset=0`),
    fetchJson(`${API_BASE}/pokemon-species?limit=100000&offset=0`),
  ])
  console.log(`  ${pokemonIndex.results.length} Pokémon, ${speciesIndex.results.length} species`)

  console.log('Downloading Pokémon details…')
  const pokemonDetails = await mapLimit(
    pokemonIndex.results,
    CONCURRENCY,
    (entry) => fetchJson(entry.url),
    'pokemon',
  )

  console.log('Downloading species details…')
  const speciesDetails = await mapLimit(
    speciesIndex.results,
    CONCURRENCY,
    (entry) => fetchJson(entry.url),
    'species',
  )

  const speciesById = new Map(speciesDetails.map((entry) => [entry.id, entry]))
  const evolutionUrls = [
    ...new Set(
      speciesDetails
        .map((entry) => entry.evolution_chain?.url)
        .filter(Boolean),
    ),
  ]

  console.log(`Downloading ${evolutionUrls.length} evolution chains…`)
  const evolutionResponses = await mapLimit(
    evolutionUrls,
    CONCURRENCY,
    (url) => fetchJson(url),
    'evolution',
  )

  const chains = {}
  for (const chain of evolutionResponses) {
    chains[chain.id] = { id: chain.id, root: simplifyEvolutionNode(chain.chain) }
  }
  const bySpecies = {}
  for (const species of speciesDetails) {
    if (species.evolution_chain) bySpecies[species.id] = resourceId(species.evolution_chain.url)
  }

  await mkdir(ARTWORK, { recursive: true })
  await mkdir(SPRITES, { recursive: true })

  console.log('Preparing local artwork and sprites…')
  const imageResults = await mapLimit(
    pokemonDetails,
    CONCURRENCY,
    async (pokemon) => {
      const artworkPath = resolve(ARTWORK, `${pokemon.id}.webp`)
      const spritePath = resolve(SPRITES, `${pokemon.id}.webp`)
      const remoteArtwork = pokemon.sprites?.other?.['official-artwork']?.front_default
      const remoteSprite = pokemon.sprites?.front_default

      const hasArtwork = await ensureImage(remoteArtwork ?? remoteSprite, artworkPath, 512, 82)
      const hasSprite = await ensureImage(remoteSprite, spritePath, 128, 85)

      return {
        artwork: hasArtwork ? `/offline/artwork/${pokemon.id}.webp` : null,
        sprite: hasSprite
          ? `/offline/sprites/${pokemon.id}.webp`
          : hasArtwork
            ? `/offline/artwork/${pokemon.id}.webp`
            : null,
      }
    },
    'images',
  )

  const pokemonRecords = pokemonDetails.map((pokemon, index) => {
    const species = speciesById.get(resourceId(pokemon.species.url))
    if (!species) throw new Error(`No species found for ${pokemon.name}`)
    return pokemonRecord(pokemon, species, imageResults[index])
  })

  const finderRecords = pokemonDetails.map((pokemon) => {
    const species = speciesById.get(resourceId(pokemon.species.url))
    if (!species) throw new Error(`No species found for ${pokemon.name}`)
    return finderRecord(pokemon, species)
  })

  const output = {
    pokemon: pokemonRecords.sort((a, b) => a.id - b.id),
    species: speciesDetails.map(speciesRecord).sort((a, b) => a.id - b.id),
    evolution: { bySpecies, chains },
    finder: finderRecords.sort((a, b) => a.id - b.id),
  }

  await mkdir(ROOT, { recursive: true })
  await writeFile(resolve(ROOT, 'pokedex.json'), JSON.stringify(output))

  console.log(`Wrote ${output.pokemon.length} Pokémon, ${output.species.length} species, ` +
    `${Object.keys(chains).length} evolution chains and ${output.finder.length} finder records.`)
  console.log(`Offline assets are in ${ROOT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
