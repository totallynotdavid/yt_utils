import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@ytutils/core': resolve(__dirname, 'packages/shared/core/src/index.ts'),
      '@ytutils/metadata': resolve(__dirname, 'packages/youtube/metadata/src/index.ts'),
      '@ytutils/duration': resolve(__dirname, 'packages/youtube/duration/src/index.ts'),
      '@ytutils/most-replayed': resolve(__dirname, 'packages/youtube/most-replayed/src/index.ts'),
      '@ytutils/video-processor': resolve(__dirname, 'packages/youtube/video-processor/src/index.ts'),
      '@ytutils/video-chunker': resolve(__dirname, 'packages/youtube/video-chunker/src/index.ts'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'workspace',
          include: ['packages/*/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
        },
      },
    ],
  },
})
