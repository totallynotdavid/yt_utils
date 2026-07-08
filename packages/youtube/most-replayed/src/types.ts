import type { HttpClient } from '@ytutils/core'

export type ReplayMarker = {
  startMillis: number
  durationMillis: number
  intensityScoreNormalized: number
}

export type ExtractionStrategy = 'auto' | 'json' | 'svg'

export type ReplaySegment = {
  position: number
  start: number
  end: number
  score: number
}

export type MostReplayedResult = {
  videoId: string
  durationSec: number
  source: 'json' | 'svg'
  segments: ReplaySegment[]
}

export type GetMostReplayedOptions = {
  parts?: number
  strategy?: ExtractionStrategy
  allowSvgFallback?: boolean
  /**
   * Optional HTTP client used to fetch the YouTube watch page. Provide one to
   * control timeouts, headers, proxy behavior, or to stub network calls in
   * tests.
   */
  httpClient?: HttpClient
}
