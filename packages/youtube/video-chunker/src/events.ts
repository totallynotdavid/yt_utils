import type { Source, Chunk } from './media'

export interface FetchProgress {
  receivedBytes: number
  totalBytes: number | null
}

// ffmpeg reports no total while splitting, so there is no percent here.
export interface SplitProgress {
  processedSeconds: number
}

export type RunEvent =
  | { type: 'stage:start'; stage: string }
  | { type: 'stage:done'; stage: string }
  | { type: 'fetch:progress'; percent: number; receivedBytes: number; totalBytes: number | null }
  | { type: 'probed'; source: Source }
  | { type: 'split:progress'; percent: number; processedSeconds: number; totalSeconds: number }
  | { type: 'chunk'; chunk: Chunk }

export type OnProgress = (event: RunEvent) => void
