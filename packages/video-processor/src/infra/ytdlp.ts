import { join } from 'node:path'

import { YtUtilsError } from '@ytutils/core'

import type { NormalizedProcessVideoRequest } from '../domain/normalize'
import type { CommandRunner } from './command'

function quote(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`
}

function buildVideoFormat(sizeLimitMb?: number, quality?: string): string {
  if (sizeLimitMb) {
    const sizeLimitBytes = `${sizeLimitMb}M`
    return `bv*[ext=mp4][filesize<=${sizeLimitBytes}]+ba[ext=m4a]/b[ext=mp4][filesize<=${sizeLimitBytes}]`
  }

  return quality === 'worst' ? 'worstvideo*+worstaudio/worst' : 'bestvideo*+bestaudio/best'
}

function extractOutputPath(stdout: string): string | null {
  const patterns = [
    /\[Merger\] Merging formats into "([^"]+)"/u,
    /\[ExtractAudio\] Destination: ([^\n\r]+)/u,
    /Destination: ([^\n\r]+)/u,
    /\[download\] ([^\n\r]+) has already been downloaded/u,
  ]

  for (const pattern of patterns) {
    const match = stdout.match(pattern)
    const raw = match?.[1]?.trim()
    if (raw) return raw
  }

  return null
}

export async function downloadWithYtDlp(
  request: NormalizedProcessVideoRequest,
  runner: CommandRunner
): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${request.videoId}`
  const outputTemplate = `${request.videoId}.%(ext)s`
  const outputDir = quote(request.outputDir)
  const quotedTemplate = quote(outputTemplate)

  const commandParts = ['yt-dlp -v']

  if (request.kind === 'video') {
    commandParts.push(`-f ${quote(buildVideoFormat(request.videoSizeMb, request.quality))}`)
  } else {
    const audioQuality = request.quality === 'worst' ? 'worstaudio' : 'bestaudio'
    commandParts.push(`-f ${audioQuality} --extract-audio --audio-format ${request.format}`)
  }

  if (request.startTimeSec !== undefined || request.endTimeSec !== undefined) {
    const start = request.startTimeSec ?? ''
    const end = request.endTimeSec ?? 'inf'
    commandParts.push(`--download-sections ${quote(`*${start}-${end}`)}`)
  }

  commandParts.push(quote(url))
  commandParts.push(`-P ${outputDir}`)
  commandParts.push(`-o ${quotedTemplate}`)

  const { stdout, stderr } = await runner.run(commandParts.join(' '))
  const found = extractOutputPath(stdout)
  if (!found) {
    if (stderr.includes('Video unavailable')) {
      throw new YtUtilsError('NOT_FOUND', 'YouTube video is unavailable')
    }

    throw new YtUtilsError('PARSING_ERROR', 'Could not parse yt-dlp output file path')
  }

  return join(found)
}
