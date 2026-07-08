// Runs yt-dlp to download one video and return its path and title.

import { spawn, spawnSync } from 'node:child_process'

import type { Binaries } from './binaries'
import { resolveBinaries, verifyBinaries } from './binaries'
import { VideoError } from './errors'
import type { FetchProgress } from './events'
import { eachLine } from './lines'
import type { FetchedSource } from './media'

export interface FetchOptions {
  outDir: string
  cookies?: string
  binaries?: Partial<Binaries>
  signal?: AbortSignal
  onProgress?: (progress: FetchProgress) => void
}

const PROGRESS_TEMPLATE =
  'PIPE|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s'

// YouTube requires solving a JS "n challenge" to get real media formats. yt-dlp
// only enables Deno by default, so we point it at whatever runtime is on PATH and
// let it fetch the EJS solver scripts from GitHub if they are not bundled.
function detectJsRuntime(): string | null {
  for (const runtime of ['deno', 'node', 'bun', 'quickjs']) {
    if (
      (
        spawnSync(runtime, ['--version'], { stdio: 'ignore' }).error as
          | NodeJS.ErrnoException
          | undefined
      )?.code !== 'ENOENT'
    ) {
      return runtime
    }
  }
  return null
}

function asNumber(token: string | undefined): number | null {
  if (token === undefined || token === '' || token === 'NA') return null
  const value = Number(token)
  return Number.isFinite(value) ? value : null
}

/** Download one video into outDir and return the output path and title. */
export async function fetchVideo(url: string, opts: FetchOptions): Promise<FetchedSource> {
  const binaries = resolveBinaries(opts.binaries)
  verifyBinaries(binaries, ['ytdlp', 'ffmpeg'])

  const args = [
    binaries.ytdlp,
    // Prefer best video+audio; fall back to best single stream.
    '-f',
    'bv*+ba/b',
    '--merge-output-format',
    'mp4',
    '--no-playlist',
    '--newline',
    '--progress-template',
    PROGRESS_TEMPLATE,
    '--print',
    'after_move:TITLE|%(title)s',
    '--print',
    'after_move:FILE|%(filepath)s',
    '-o',
    `${opts.outDir}/source.%(ext)s`,
    // fetch the EJS challenge solver from GitHub if it isn't bundled
    '--remote-components',
    'ejs:github',
  ]
  const runtime = detectJsRuntime()
  if (runtime !== null) args.push('--js-runtimes', runtime)
  if (opts.cookies !== undefined && opts.cookies !== '') args.push('--cookies', opts.cookies)
  args.push(url)

  const proc = spawn(args[0]!, args.slice(1), {
    stdio: ['ignore', 'pipe', 'pipe'],
    signal: opts.signal,
  })
  const exited = new Promise<number | null>((resolve, reject) => {
    proc.once('error', reject)
    proc.once('close', resolve)
  })

  let path = ''
  let title = ''
  const errorLines: string[] = []

  const handle = (line: string) => {
    if (line.startsWith('PIPE|')) {
      const [, received, total, estimate] = line.split('|')
      opts.onProgress?.({
        receivedBytes: asNumber(received) ?? 0,
        totalBytes: asNumber(total) ?? asNumber(estimate),
      })
    } else if (line.startsWith('FILE|')) {
      path = line.slice('FILE|'.length).trim()
    } else if (line.startsWith('TITLE|')) {
      title = line.slice('TITLE|'.length).trim()
    }
  }

  await Promise.all([
    eachLine(proc.stdout!, handle),
    eachLine(proc.stderr!, (line) => {
      handle(line)
      if (!line.startsWith('PIPE|')) errorLines.push(line)
    }),
  ])

  const code = await exited
  if (code !== 0) {
    throw new VideoError(
      'FETCH_FAILED',
      `yt-dlp exited ${code}:\n${errorLines.join('\n').slice(-2000)}`
    )
  }
  if (!path) {
    throw new VideoError('FETCH_FAILED', 'yt-dlp finished but reported no output file')
  }

  return { path, title: title || 'video' }
}
