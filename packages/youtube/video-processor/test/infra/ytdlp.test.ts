import { describe, expect, it } from 'vitest'

import { YtUtilsError } from '@ytutils/core'

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

describe('downloadWithYtDlp', () => {
  it('builds an audio argv with --print, extract-audio, and audio-format', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.opus\n')

    const result = await downloadWithYtDlp(baseRequest, runner)

    expect(result).toBe('/tmp/out/dQw4w9WgXcQ.opus')
    const argv = calls[0]!
    expect(argv[0]).toBe('yt-dlp')
    expect(argv).toContain('--print')
    expect(argv[argv.indexOf('--print') + 1]).toBe('after_move:filepath')
    expect(argv).toContain('-f')
    expect(argv[argv.indexOf('-f') + 1]).toBe('bestaudio')
    expect(argv).toContain('--extract-audio')
    expect(argv).toContain('--audio-format')
    expect(argv[argv.indexOf('--audio-format') + 1]).toBe('opus')
    expect(argv).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(argv).toContain('-P')
    expect(argv[argv.indexOf('-P') + 1]).toBe('/tmp/out')
    expect(argv).toContain('-o')
    expect(argv[argv.indexOf('-o') + 1]).toBe('dQw4w9WgXcQ.%(ext)s')
  })

  it('uses worstaudio when quality is worst', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.opus\n')
    await downloadWithYtDlp({ ...baseRequest, quality: 'worst' }, runner)

    const argv = calls[0]!
    expect(argv[argv.indexOf('-f') + 1]).toBe('worstaudio')
  })

  it('builds a video argv with size-capped format selector', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.mp4\n')
    await downloadWithYtDlp(
      { ...baseRequest, kind: 'video', format: 'mp4', videoSizeMb: 50 },
      runner
    )

    const argv = calls[0]!
    expect(argv).not.toContain('--extract-audio')
    const format = argv[argv.indexOf('-f') + 1]
    expect(format).toBe('bv*[ext=mp4][filesize<=50M]+ba[ext=m4a]/b[ext=mp4][filesize<=50M]')
  })

  it('builds a video argv with worst-quality selector when no size limit is set', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.webm\n')
    await downloadWithYtDlp(
      { ...baseRequest, kind: 'video', format: 'mp4', quality: 'worst' },
      runner
    )

    const argv = calls[0]!
    expect(argv[argv.indexOf('-f') + 1]).toBe('worstvideo*+worstaudio/worst')
  })

  it('adds --download-sections with both bounds when a closed range is given', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.opus\n')
    await downloadWithYtDlp({ ...baseRequest, startTimeSec: 10, endTimeSec: 20 }, runner)

    const argv = calls[0]!
    expect(argv[argv.indexOf('--download-sections') + 1]).toBe('*10-20')
  })

  it('uses empty-sentinel start and inf end for a half-open range', async () => {
    const { runner, calls } = captureRunner('/tmp/out/dQw4w9WgXcQ.opus\n')
    await downloadWithYtDlp({ ...baseRequest, endTimeSec: 30 }, runner)

    const argv = calls[0]!
    expect(argv[argv.indexOf('--download-sections') + 1]).toBe('*-30')
  })

  it('returns the first non-empty line of stdout trimmed', async () => {
    const { runner } = captureRunner('  /tmp/out/dQw4w9WgXcQ.opus  \n')
    const result = await downloadWithYtDlp(baseRequest, runner)
    expect(result).toBe('/tmp/out/dQw4w9WgXcQ.opus')
  })

  it('throws NOT_FOUND when stderr reports the video is unavailable', async () => {
    const { runner } = captureRunner('', 'ERROR: Video unavailable')
    await expect(downloadWithYtDlp(baseRequest, runner)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('throws PARSING_ERROR when stdout is empty and stderr has no marker', async () => {
    const { runner } = captureRunner('', 'some unrelated stderr')
    await expect(downloadWithYtDlp(baseRequest, runner)).rejects.toBeInstanceOf(YtUtilsError)
    await expect(downloadWithYtDlp(baseRequest, runner)).rejects.toMatchObject({
      code: 'PARSING_ERROR',
    })
  })
})
