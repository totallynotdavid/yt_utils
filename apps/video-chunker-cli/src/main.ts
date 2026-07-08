import { parseArgs } from 'node:util'

import { run, VideoError, type ChunkRequest } from '@ytutils/video-chunker'

import { parseDuration } from './duration'
import { createReporter } from './reporter'

const DEFAULT_CHUNK_SECONDS = 60 * 60
const DEFAULT_OUT_DIR = './output'

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

export async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
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

  const url = positionals[0]
  if (values.help === true || url === undefined) {
    process.stdout.write(HELP)
    process.exit(values.help === true ? 0 : 1)
  }

  let chunkSeconds: number
  try {
    chunkSeconds = values.chunk === undefined ? DEFAULT_CHUNK_SECONDS : parseDuration(values.chunk)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }

  const request: ChunkRequest = {
    url,
    chunkSeconds,
    outDir: values.out ?? DEFAULT_OUT_DIR,
    cookies: values.cookies,
    keepSource: values['keep-source'] ?? false,
  }

  const reporter = createReporter(chunkSeconds)

  try {
    const result = await run(request, { onProgress: reporter.onProgress })
    reporter.finish(result)
  } catch (error) {
    const message =
      error instanceof VideoError
        ? `Error [${error.code}]: ${error.message}`
        : `Error: ${error instanceof Error ? error.message : String(error)}`
    reporter.fail(message)
    process.exit(1)
  }
}
