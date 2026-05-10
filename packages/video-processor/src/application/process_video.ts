import { extname, resolve } from 'node:path'

import { defaultVideoProcessorConfig } from '../domain/config'
import { normalizeProcessVideoRequest } from '../domain/normalize'
import type { ProcessVideoRequest, ProcessVideoResult, VideoProcessorConfig } from '../domain/types'
import { ShellCommandRunner, type CommandRunner } from '../infra/command'
import { convertWithFfmpeg } from '../infra/ffmpeg'
import { ensureDirectoryExists } from '../infra/fs'
import { downloadWithYtDlp } from '../infra/ytdlp'

export type ProcessVideoDeps = {
  runner: CommandRunner
  ensureDirectoryExists: (path: string) => Promise<void>
  downloadWithYtDlp: typeof downloadWithYtDlp
  convertWithFfmpeg: typeof convertWithFfmpeg
}

const defaultDeps: ProcessVideoDeps = {
  runner: new ShellCommandRunner(),
  ensureDirectoryExists,
  downloadWithYtDlp,
  convertWithFfmpeg,
}

export async function processVideo(
  request: ProcessVideoRequest,
  config: VideoProcessorConfig = defaultVideoProcessorConfig,
  deps: ProcessVideoDeps = defaultDeps
): Promise<ProcessVideoResult> {
  const normalized = normalizeProcessVideoRequest(request, config)
  const outputDir = resolve(normalized.outputDir)

  await deps.ensureDirectoryExists(outputDir)

  const downloadedPathRaw = await deps.downloadWithYtDlp({ ...normalized, outputDir }, deps.runner)

  const downloadedPath = resolve(downloadedPathRaw)
  const artifacts: ProcessVideoResult['artifacts'] = [
    {
      kind: normalized.kind,
      format: extname(downloadedPath).slice(1),
      path: downloadedPath,
    },
  ]

  const currentFormat = extname(downloadedPath).slice(1)
  if (currentFormat !== normalized.format) {
    const convertedPathRaw = await deps.convertWithFfmpeg(
      downloadedPath,
      normalized.format,
      normalized.kind,
      deps.runner
    )

    artifacts.push({
      kind: normalized.kind,
      format: normalized.format,
      path: resolve(convertedPathRaw),
    })
  }

  return { artifacts }
}
