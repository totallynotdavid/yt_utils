import { join } from 'node:path'

import { YtUtilsError } from '@ytutils/core'

import type { NormalizedProcessVideoRequest } from '../domain/normalize'
import type { CommandRunner } from './command'

function buildVideoFormat(sizeLimitMb?: number, quality?: string): string {
  if (sizeLimitMb) {
    const sizeLimitWithSuffix = `${sizeLimitMb}M`
    return `bv*[ext=mp4][filesize<=${sizeLimitWithSuffix}]+ba[ext=m4a]/b[ext=mp4][filesize<=${sizeLimitWithSuffix}]`
  }

  return quality === 'worst' ? 'worstvideo*+worstaudio/worst' : 'bestvideo*+bestaudio/best'
}

export async function downloadWithYtDlp(
  request: NormalizedProcessVideoRequest,
  runner: CommandRunner
): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${request.videoId}`
  const outputTemplate = `${request.videoId}.%(ext)s`

  const argv = ['yt-dlp', '--print', 'after_move:filepath']

  if (request.kind === 'video') {
    argv.push('-f', buildVideoFormat(request.videoSizeMb, request.quality))
  } else {
    const audioQuality = request.quality === 'worst' ? 'worstaudio' : 'bestaudio'
    argv.push('-f', audioQuality, '--extract-audio', '--audio-format', request.format)
  }

  if (request.startTimeSec !== undefined || request.endTimeSec !== undefined) {
    const start = request.startTimeSec ?? ''
    const end = request.endTimeSec ?? 'inf'
    argv.push('--download-sections', `*${start}-${end}`)
  }

  argv.push(url, '-P', request.outputDir, '-o', outputTemplate)

  const { stdout, stderr } = await runner.run(argv)
  const found = stdout
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!found) {
    if (stderr.includes('Video unavailable')) {
      throw new YtUtilsError('NOT_FOUND', 'YouTube video is unavailable')
    }

    throw new YtUtilsError('PARSING_ERROR', 'Could not parse yt-dlp output file path')
  }

  return join(found)
}
