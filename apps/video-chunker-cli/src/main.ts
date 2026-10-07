import { parseArgs } from 'node:util'

import { run, VideoError, type ChunkRequest } from '@ytutils/video-chunker'

import { parseDuration } from './duration'
import { createReporter } from './reporter'

const DEFAULT_CHUNK_SECONDS = 60 * 60
const DEFAULT_OUT_DIR = './output'

type CliValues = ReturnType<typeof parseCliOptions>['values']

const HELP = `split a YouTube video into fixed-length chunks

usage:
  bun run start <youtube-url> [options]

options:
  --chunk <dur>     chunk length: "1h", "30m", "3600" (default 1h)
  --out <dir>       output directory (default ./output)
  --cookies <file>  Netscape-format cookies file for yt-dlp (login/age-gated)
  --keep-source     keep the full download after splitting
  -h, --help        show this help
`

function parseCliOptions() {
  return parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      chunk: { type: 'string' },
      out: { type: 'string' },
      cookies: { type: 'string' },
      'keep-source': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  })
}

function requireUrl(values: CliValues, positionals: string[]): string {
  const url = positionals[0]
  if (values.help === true || url === undefined) {
    process.stdout.write(HELP)
    process.exit(values.help === true ? 0 : 1)
  }
  return url
}

function parseChunkSeconds(value: string | undefined): number {
  try {
    return value === undefined ? DEFAULT_CHUNK_SECONDS : parseDuration(value)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    return process.exit(1)
  }
}

function createRequest(url: string, values: CliValues, chunkSeconds: number): ChunkRequest {
  return {
    url,
    chunkSeconds,
    outDir: values.out ?? DEFAULT_OUT_DIR,
    cookies: values.cookies,
    keepSource: values['keep-source'] ?? false,
  }
}

function formatRunError(error: unknown): string {
  if (error instanceof VideoError) return `Error [${error.code}]: ${error.message}`
  return `Error: ${error instanceof Error ? error.message : String(error)}`
}

async function runWithReporter(
  request: ChunkRequest,
  reporter: ReturnType<typeof createReporter>
): Promise<void> {
  try {
    const result = await run(request, { onProgress: reporter.onProgress })
    reporter.finish(result)
  } catch (error) {
    reporter.fail(formatRunError(error))
    process.exit(1)
  }
}

export async function main(): Promise<void> {
  const { values, positionals } = parseCliOptions()
  const url = requireUrl(values, positionals)
  const chunkSeconds = parseChunkSeconds(values.chunk)
  const request = createRequest(url, values, chunkSeconds)
  const reporter = createReporter(chunkSeconds)

  await runWithReporter(request, reporter)
}
