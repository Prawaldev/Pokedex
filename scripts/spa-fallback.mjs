import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * GitHub Pages serves 404.html for any path it cannot find. Copying the built
 * index.html there lets the SPA boot on deep links like /Pokedex/pokemon/pikachu
 * and hand the path to React Router. Runs automatically as `postbuild`.
 */

const dist = resolve(process.cwd(), 'dist')
const index = resolve(dist, 'index.html')
const fallback = resolve(dist, '404.html')

if (!existsSync(index)) {
  console.error('spa-fallback: dist/index.html not found — run the Vite build first.')
  process.exit(1)
}

copyFileSync(index, fallback)
console.log('spa-fallback: wrote dist/404.html')
