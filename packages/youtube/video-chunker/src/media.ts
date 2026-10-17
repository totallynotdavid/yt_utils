// Durations are seconds and sizes are bytes. No defaults live in ChunkRequest;
// callers pass explicit values.
export interface ChunkRequest {
  url: string
  /** Length of each chunk in seconds. Must be > 0. */
  chunkSeconds: number
  outDir: string
  /** Path to a Netscape-format cookies file for yt-dlp. */
  cookies?: string
  /** Keep the full download after splitting. Default false. */
  keepSource?: boolean
}

export interface FetchedSource {
  path: string
  title: string
}

export interface MediaInfo {
  durationSeconds: number
  sizeBytes: number
}

export interface Source extends FetchedSource, MediaInfo {}

export interface Chunk {
  index: number
  path: string
  durationSeconds: number
  sizeBytes: number
}

export interface ChunkResult {
  source: Source
  chunks: Chunk[]
  outDir: string
}
