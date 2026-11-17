import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Le site sera servi par GitHub Pages sous /projet_coc/.
  base: '/projet_coc/',
  plugins: [react()],
  test: {
    // Le moteur tourne en Node pur ; les tests UI demandent jsdom
    // via le commentaire `// @vitest-environment jsdom` en tête de fichier.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
