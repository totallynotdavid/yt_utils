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
}
