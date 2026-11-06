/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'src/renderer',
  resolve: {
    alias: {
      '@': resolve('src/renderer/src')
    }
  },
  plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } }), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/app/test-setup.ts'],
  }
})
