import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const packageSource = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@market-tycoon/simulation-engine': packageSource('simulation-engine'),
      '@market-tycoon/economy': packageSource('economy'),
      '@market-tycoon/analytics': packageSource('analytics'),
      '@market-tycoon/employees': packageSource('employees'),
      '@market-tycoon/events': packageSource('events'),
      '@market-tycoon/save': packageSource('save'),
      '@market-tycoon/catalog': packageSource('catalog'),
      '@market-tycoon/customers': packageSource('customers'),
    },
  },
})
