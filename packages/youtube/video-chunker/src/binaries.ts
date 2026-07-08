// External binaries used by the workflow.
// Callers can override paths; defaults resolve from PATH.

import { spawnSync } from 'node:child_process'

import { VideoError } from './errors'

export interface Binaries {
  ffmpeg: string
  ffprobe: string
  ytdlp: string
}

export const defaultBinaries: Binaries = {
  ffmpeg: 'ffmpeg',
  ffprobe: 'ffprobe',
  ytdlp: 'yt-dlp',
}

const ALL_ROLES = ['ffmpeg', 'ffprobe', 'ytdlp'] as const

/** Fill in PATH defaults for any binary the caller did not override. */
export function resolveBinaries(overrides?: Partial<Binaries>): Binaries {
  return { ...defaultBinaries, ...overrides }
}

/** Fail fast with an actionable error if a required program is missing. */
export function verifyBinaries(
  binaries: Binaries,
  roles: readonly (keyof Binaries)[] = ALL_ROLES
): void {
  for (const role of roles) {
    const command = binaries[role]
    const result = spawnSync(command, ['--version'], { stdio: 'ignore' })
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      throw new VideoError('MISSING_BINARY', `${command} not found on PATH (needed for ${role})`)
    }
  }
}
