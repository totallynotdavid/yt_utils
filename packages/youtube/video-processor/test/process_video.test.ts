import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defaultVideoProcessorConfig } from '../src/domain/config'
import type { CommandRunner } from '../src/infra/command'
import { processVideo } from '../src'

let root: string

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'process-video-'))
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

function fakeRunner(downloaded: string): { runner: CommandRunner; commands: string[][] } {
  const commands: string[][] = []
  const runner: CommandRunner = {
    async run(argv) {
      commands.push(argv)
      return { stdout: argv[0] === 'yt-dlp' ? `${downloaded}\n` : '', stderr: '' }
    },
  }
  return { runner, commands }
}

describe('processVideo', () => {
  it('creates the output directory and returns one artifact in the requested format', async () => {
    const outputDir = join(root, 'audio')
    const { runner, commands } = fakeRunner(join(outputDir, 'dQw4w9WgXcQ.opus'))

    const result = await processVideo(
      { videoId: 'dQw4w9WgXcQ', format: 'opus', outputDir },
      defaultVideoProcessorConfig,
      runner
    )

    expect((await stat(outputDir)).isDirectory()).toBe(true)
    expect(result.artifacts).toEqual([
      { kind: 'audio', format: 'opus', path: join(outputDir, 'dQw4w9WgXcQ.opus') },
    ])
    expect(commands.map((argv) => argv[0])).toEqual(['yt-dlp'])
  })

  it('converts with ffmpeg when the downloaded format differs', async () => {
    const outputDir = join(root, 'video')
    const { runner, commands } = fakeRunner(join(outputDir, 'dQw4w9WgXcQ.webm'))

    const result = await processVideo(
      { videoId: 'dQw4w9WgXcQ', format: 'mp4', outputDir },
      defaultVideoProcessorConfig,
      runner
    )

    expect(result.artifacts.map((artifact) => artifact.format)).toEqual(['webm', 'mp4'])
    expect(result.artifacts[1]?.path).toBe(join(outputDir, 'dQw4w9WgXcQ.mp4'))
    expect(commands[1]).toEqual([
      'ffmpeg',
      '-y',
      '-i',
      join(outputDir, 'dQw4w9WgXcQ.webm'),
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      join(outputDir, 'dQw4w9WgXcQ.mp4'),
    ])
  })
})
