import { mkdir } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

import { defaultVideoProcessorConfig } from '../domain/config'
import { normalizeProcessVideoRequest } from '../domain/normalize'
import type { ProcessVideoRequest, ProcessVideoResult, VideoProcessorConfig } from '../domain/types'
import { spawnCommandRunner, type CommandRunner } from '../infra/command'
import { convertWithFfmpeg } from '../infra/ffmpeg'
import { downloadWithYtDlp } from '../infra/ytdlp'

export async function processVideo(
  request: ProcessVideoRequest,
  config: VideoProcessorConfig = defaultVideoProcessorConfig,
  runner: CommandRunner = spawnCommandRunner
): Promise<ProcessVideoResult> {
  const normalized = normalizeProcessVideoRequest(request, config)
  const outputDir = resolve(normalized.outputDir)

  await mkdir(outputDir, { recursive: true })

  const downloadedPath = resolve(await downloadWithYtDlp({ ...normalized, outputDir }, runner))

  const currentFormat = extname(downloadedPath).slice(1)
  const artifacts: ProcessVideoResult['artifacts'] = [
    {
      kind: normalized.kind,
      format: currentFormat,
      path: downloadedPath,
    },
  ]

  if (currentFormat !== normalized.format) {
    const convertedPath = resolve(
      await convertWithFfmpeg(downloadedPath, normalized.format, normalized.kind, runner)
    )

    artifacts.push({
      kind: normalized.kind,
      format: normalized.format,
      path: convertedPath,
    })
  }

  return { artifacts }
}
