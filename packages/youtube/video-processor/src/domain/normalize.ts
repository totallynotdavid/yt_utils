import { parseVideoId, YtUtilsError } from '@ytutils/core'

import { defaultVideoProcessorConfig } from './config'
import {
  AUDIO_FORMATS,
  OUTPUT_FORMATS,
  type MediaKind,
  type ProcessVideoRequest,
  type Quality,
  type VideoProcessorConfig,
} from './types'

const AUDIO_FORMAT_SET = new Set<string>(AUDIO_FORMATS)
const OUTPUT_FORMAT_SET = new Set<string>(OUTPUT_FORMATS)

export type NormalizedProcessVideoRequest = {
  videoId: string
  kind: MediaKind
  format: string
  quality: Quality
  outputDir: string
  startTimeSec?: number
  endTimeSec?: number
  videoSizeMb?: number
}

function assertTimeRange(startTimeSec?: number, endTimeSec?: number): void {
  if (startTimeSec !== undefined && (!Number.isFinite(startTimeSec) || startTimeSec < 0)) {
    throw new YtUtilsError('INVALID_INPUT', 'startTimeSec must be a non-negative number')
  }

  if (endTimeSec !== undefined && (!Number.isFinite(endTimeSec) || endTimeSec <= 0)) {
    throw new YtUtilsError('INVALID_INPUT', 'endTimeSec must be a positive number')
  }

  if (startTimeSec !== undefined && endTimeSec !== undefined && startTimeSec >= endTimeSec) {
    throw new YtUtilsError('INVALID_INPUT', 'startTimeSec must be lower than endTimeSec')
  }
}

export function normalizeProcessVideoRequest(
  request: ProcessVideoRequest,
  config: VideoProcessorConfig = defaultVideoProcessorConfig
): NormalizedProcessVideoRequest {
  const videoId = parseVideoId(request.videoId)
  assertTimeRange(request.startTimeSec, request.endTimeSec)

  const format = request.format ?? config.defaults.audioFormat
  if (!OUTPUT_FORMAT_SET.has(format)) {
    throw new YtUtilsError('INVALID_INPUT', `Unsupported format: ${format}`)
  }

  const kind: MediaKind = AUDIO_FORMAT_SET.has(format) ? 'audio' : 'video'
  const quality =
    request.quality ??
    (kind === 'audio' ? config.defaults.audioQuality : config.defaults.videoQuality)
  const outputDir = request.outputDir?.trim() || config.defaults.outputDir

  const videoSizeMb =
    kind === 'video' && request.videoSize ? config.videoSizeLimitMb[request.videoSize] : undefined

  return {
    videoId,
    kind,
    format,
    quality,
    outputDir,
    startTimeSec: request.startTimeSec,
    endTimeSec: request.endTimeSec,
    videoSizeMb,
  }
}
