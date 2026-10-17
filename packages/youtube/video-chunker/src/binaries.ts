import { spawnSync } from 'node:child_process'

import { VideoError, isErrnoException } from './errors'

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

export function resolveBinaries(overrides?: Partial<Binaries>): Binaries {
  return { ...defaultBinaries, ...overrides }
}

export function verifyBinaries(
  binaries: Binaries,
  roles: readonly (keyof Binaries)[] = ALL_ROLES
): void {
  for (const role of roles) {
    const command = binaries[role]
    const result = spawnSync(command, ['--version'], { stdio: 'ignore' })
    if (isErrnoException(result.error) && result.error.code === 'ENOENT') {
      throw new VideoError('MISSING_BINARY', `${command} not found on PATH (needed for ${role})`)
    }
  }
}
