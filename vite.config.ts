import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves this from /Pokedex/, but that subpath is only noise
  // locally — dev runs at the root, the production build keeps the base.
  base: command === 'build' || isPreview ? '/Pokedex/' : '/',
  plugins: [react()],
}))
