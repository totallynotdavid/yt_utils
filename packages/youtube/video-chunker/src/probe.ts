// Runs ffprobe to read media duration and file size.

import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'

import type { Binaries } from './binaries'
import { resolveBinaries, verifyBinaries } from './binaries'
import { VideoError } from './errors'
import { readText } from './lines'
import type { MediaInfo } from './media'

export interface ProbeOptions {
  binaries?: Partial<Binaries>
}

// Internal helper for repeated probes after one binary verification.
export async function readDurationSeconds(path: string, ffprobe: string): Promise<number> {
  const proc = spawn(
    ffprobe,
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      path,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  const exited = new Promise<number | null>((resolve, reject) => {
    proc.once('error', reject)
    proc.once('close', resolve)
  })
  const out = await readText(proc.stdout!)
  if ((await exited) !== 0) {
    throw new VideoError('PROBE_FAILED', `ffprobe could not read ${path}`)
  }
  const seconds = Number(out.trim())
  if (!Number.isFinite(seconds)) {
    throw new VideoError('PROBE_FAILED', `ffprobe returned no duration for ${path}`)
  }
  return seconds
}

/** Return duration and size for a media file. */
export async function probe(path: string, opts: ProbeOptions = {}): Promise<MediaInfo> {
  const binaries = resolveBinaries(opts.binaries)
  verifyBinaries(binaries, ['ffprobe'])
  const durationSeconds = await readDurationSeconds(path, binaries.ffprobe)
  return { durationSeconds, sizeBytes: (await stat(path)).size }
}
