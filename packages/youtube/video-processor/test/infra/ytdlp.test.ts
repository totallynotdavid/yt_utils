import { describe, expect, it } from 'vitest'

import type { NormalizedProcessVideoRequest } from '../../src/domain/normalize'
import type { CommandRunner } from '../../src/infra/command'
import { downloadWithYtDlp } from '../../src/infra/ytdlp'

const baseRequest: NormalizedProcessVideoRequest = {
  videoId: 'dQw4w9WgXcQ',
  kind: 'audio',
  format: 'opus',
  quality: 'best',
  outputDir: '/tmp/out',
}

function captureRunner(
  stdout: string,
  stderr = ''
): {
  runner: CommandRunner
  calls: string[][]
} {
  const calls: string[][] = []
  const runner: CommandRunner = {
    async run(argv: string[]) {
      calls.push(argv)
      return { stdout, stderr }
    },
  }
  return { runner, calls }
}

function flagValue(argv: string[], flag: string): string | undefined {
  return argv[argv.indexOf(flag) + 1]
}

describe('downloadWithYtDlp', () => {
  it('builds an audio argv with --print, extract-audio, and audio-format', async () => {
    const { runner, calls } = captureRunner('  /tmp/out/dQw4w9WgXcQ.opus  \n')

    const result = await downloadWithYtDlp(baseRequest, runner)

    expect(result).toBe('/tmp/out/dQw4w9WgXcQ.opus')
    expect(calls[0]).toEqual([
      'yt-dlp',
      '--print',
      'after_move:filepath',
      '-f',
      'bestaudio',
      '--extract-audio',
      '--audio-format',
      'opus',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      '-P',
      '/tmp/out',
      '-o',
      'dQw4w9WgXcQ.%(ext)s',
    ])
  })

  it.each([
    ['audio quality worst', { quality: 'worst' }, '-f', 'worstaudio'],
    [
      'a video size cap',
      { kind: 'video', format: 'mp4', videoSizeMb: 50 },
      '-f',
      'bv*[ext=mp4][filesize<=50M]+ba[ext=m4a]/b[ext=mp4][filesize<=50M]',
    ],
    [
      'video quality worst without a size cap',
      { kind: 'video', format: 'mp4', quality: 'worst' },
      '-f',
      'worstvideo*+worstaudio/worst',
    ],
    ['a closed time range', { startTimeSec: 10, endTimeSec: 20 }, '--download-sections', '*10-20'],
    ['an open-start time range', { endTimeSec: 30 }, '--download-sections', '*-30'],
    ['an open-end time range', { startTimeSec: 30 }, '--download-sections', '*30-inf'],
  ] as const)('selects the yt-dlp flag for %s', async (_name, overrides, flag, expected) => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.opus\n')

    await downloadWithYtDlp({ ...baseRequest, ...overrides }, runner)

    expect(flagValue(calls[0], flag)).toBe(expected)
  })

  it('does not extract audio for a video request', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.mp4\n')

    await downloadWithYtDlp({ ...baseRequest, kind: 'video', format: 'mp4' }, runner)

    expect(calls[0]).not.toContain('--extract-audio')
  })

  it.each([
    ['stderr reports the video is unavailable', 'ERROR: Video unavailable', 'NOT_FOUND'],
    ['stdout is empty and stderr has no marker', 'some unrelated stderr', 'PARSING_ERROR'],
  ])('throws when %s', async (_name, stderr, code) => {
    const { runner } = captureRunner('', stderr)

    await expect(downloadWithYtDlp(baseRequest, runner)).rejects.toMatchObject({ code })
  })
})
