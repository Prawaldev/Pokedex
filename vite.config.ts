import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode, isPreview }) => ({
  // GitHub Pages serves this from /Pokedex/, while the Android WebView and
  // local dev serve from the root.
  base:
    mode === 'android' ? '/' : command === 'build' || isPreview ? '/Pokedex/' : '/',
  plugins: [react()],
}))
