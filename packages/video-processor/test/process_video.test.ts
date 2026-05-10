import { describe, expect, it } from 'vitest'

import { processVideo } from '../src'

describe('processVideo', () => {
  it('downloads audio and returns one artifact when format matches', async () => {
    const result = await processVideo(
      { videoId: 'dQw4w9WgXcQ', format: 'opus', outputDir: './tmp-out' },
      undefined,
      {
        runner: { run: async () => ({ stdout: '', stderr: '' }) },
        ensureDirectoryExists: async () => {},
        downloadWithYtDlp: async () => '/tmp-out/dQw4w9WgXcQ.opus',
        convertWithFfmpeg: async () => '/tmp-out/dQw4w9WgXcQ.opus',
      }
    )

    expect(result.artifacts).toHaveLength(1)
    expect(result.artifacts[0]?.format).toBe('opus')
  })

  it('converts when downloaded format is different', async () => {
    const result = await processVideo(
      { videoId: 'dQw4w9WgXcQ', format: 'mp4', outputDir: './tmp-out' },
      undefined,
      {
        runner: { run: async () => ({ stdout: '', stderr: '' }) },
        ensureDirectoryExists: async () => {},
        downloadWithYtDlp: async () => '/tmp-out/dQw4w9WgXcQ.webm',
        convertWithFfmpeg: async () => '/tmp-out/dQw4w9WgXcQ.mp4',
      }
    )

    expect(result.artifacts).toHaveLength(2)
    expect(result.artifacts[1]?.format).toBe('mp4')
  })
})
