import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * Copies the prebuilt offline dataset into the Android app's public assets
 * so the APK can load Pokémon data without a network connection.
 */

const offlineDir = resolve(process.cwd(), 'offline-data')
const androidAssetsDir = resolve(process.cwd(), 'android/app/src/main/assets/public/offline')
const distOfflineDir = resolve(process.cwd(), 'dist/offline')

if (!existsSync(offlineDir)) {
  console.error('copy-offline-assets: offline-data/ not found. Run "npm run data:offline" first.')
  process.exit(1)
}

// Copy to dist for web builds in offline mode
if (existsSync(distOfflineDir)) {
  console.log('copy-offline-assets: offline assets already in dist/')
} else {
  try {
    cpSync(offlineDir, distOfflineDir, { recursive: true })
    console.log('copy-offline-assets: copied offline-data to dist/offline')
  } catch (error) {
    console.error('copy-offline-assets: failed to copy to dist:', error.message)
  }
}

// Copy to Android assets if android directory exists
if (existsSync(resolve(process.cwd(), 'android'))) {
  mkdirSync(androidAssetsDir, { recursive: true })
  try {
    cpSync(offlineDir, androidAssetsDir, { recursive: true })
    console.log('copy-offline-assets: copied offline-data to android assets')
  } catch (error) {
    console.error('copy-offline-assets: failed to copy to android:', error.message)
  }
} else {
  console.log('copy-offline-assets: android/ not found, skipping Android asset copy')
}
