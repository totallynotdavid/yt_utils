import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@ytutils/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@ytutils/metadata': resolve(__dirname, 'packages/metadata/src/index.ts'),
      '@ytutils/duration': resolve(__dirname, 'packages/duration/src/index.ts'),
      '@ytutils/most-replayed': resolve(__dirname, 'packages/most-replayed/src/index.ts'),
      '@ytutils/video-processor': resolve(__dirname, 'packages/video-processor/src/index.js'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'workspace',
          include: ['packages/*/test/**/*.test.ts'],
        },
      },
    ],
  },
})
