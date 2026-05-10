import { parseVideoId, YtUtilsError } from '@ytutils/core'

import type { ExtractionStrategy, GetMostReplayedOptions } from './types'

export type NormalizedGetMostReplayedOptions = {
  parts: number
  strategy: ExtractionStrategy
  allowSvgFallback: boolean
}

export function assertVideoId(videoId: string): void {
  parseVideoId(videoId)
}

export function normalizeGetMostReplayedOptions(
  options: GetMostReplayedOptions | undefined
): NormalizedGetMostReplayedOptions {
  const parts = options?.parts ?? 3
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new YtUtilsError('INVALID_INPUT', 'parts must be a positive integer')
  }

  const strategy = options?.strategy ?? 'auto'
  if (strategy !== 'auto' && strategy !== 'json' && strategy !== 'svg') {
    throw new YtUtilsError('INVALID_INPUT', 'strategy must be one of: auto, json, svg')
  }

  return {
    parts,
    strategy,
    allowSvgFallback: options?.allowSvgFallback ?? false,
  }
}
