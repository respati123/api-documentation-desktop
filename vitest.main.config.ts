import { defineConfig } from 'vitest/config'

// The main process and preload are Node code, so their rule tests run in a Node environment, outside the renderer's jsdom setup.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/main/**/*.test.ts'],
  },
})
