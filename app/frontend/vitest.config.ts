import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'json-summary', 'lcov'],
        exclude: [
          ...configDefaults.exclude,
          '**/__tests__/**',
          '**/types/**',
          '**/*.spec.ts',
          '**/*.test.ts',
          '**/node_modules/**',
          '**/dist/**',
          '**/.{idea,git,cache,output,temp}/**',
        ],
      },
    },
  }),
)
