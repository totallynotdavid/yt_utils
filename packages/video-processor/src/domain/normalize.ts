import { parseVideoId, YtUtilsError } from '@ytutils/core'

import { defaultVideoProcessorConfig } from './config'
import type { MediaKind, ProcessVideoRequest, Quality, VideoProcessorConfig } from './types'

const AUDIO_FORMATS = new Set(['opus', 'mp3', 'm4a', 'wav', 'flac'])

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
  const kind: MediaKind = AUDIO_FORMATS.has(format) ? 'audio' : 'video'
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
