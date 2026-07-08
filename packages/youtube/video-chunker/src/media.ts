// Shared media types. Durations are seconds, sizes are bytes.
// Presentation units (MB, HH:MM:SS) never appear in core.

/** What run() is asked to do. No defaults live here; callers pass explicit values. */
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

/** A downloaded video before it has been inspected. */
export interface FetchedSource {
  path: string
  title: string
}

/** Measurements of a media file. */
export interface MediaInfo {
  durationSeconds: number
  sizeBytes: number
}

/** A downloaded video with its measurements. */
export interface Source extends FetchedSource, MediaInfo {}

/** One output segment on disk. */
export interface Chunk {
  index: number
  path: string
  durationSeconds: number
  sizeBytes: number
}

/** run()'s output: the source, every chunk, and where they landed. */
export interface ChunkResult {
  source: Source
  chunks: Chunk[]
  outDir: string
}
