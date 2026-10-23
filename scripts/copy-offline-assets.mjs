import { cpSync, existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * Copies the prebuilt offline dataset into dist/offline before Capacitor syncs
 * the web build into android/app/src/main/assets/public. Running this after the
 * Vite build means the APK contains the data and every local artwork/sprite.
 */

const offlineDir = resolve(process.cwd(), 'offline-data')
const distOfflineDir = resolve(process.cwd(), 'dist/offline')

if (!existsSync(offlineDir)) {
  console.error('copy-offline-assets: offline-data/ not found. Run "npm run data:offline" first.')
  process.exit(1)
}

if (!existsSync(resolve(process.cwd(), 'dist/index.html'))) {
  console.error('copy-offline-assets: dist/index.html not found. Run the Vite build first.')
  process.exit(1)
}

rmSync(distOfflineDir, { recursive: true, force: true })
cpSync(offlineDir, distOfflineDir, { recursive: true })
console.log('copy-offline-assets: copied offline-data to dist/offline')
