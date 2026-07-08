// Public surface.

// The convenience: a YouTube URL in, fixed-length chunks out.
export { run } from './run'
export type { RunOptions } from './run'

// Operations: compose your own workflow from these, or use them on their own.
export { fetchVideo } from './fetch'
export type { FetchOptions } from './fetch'
export { probe } from './probe'
export type { ProbeOptions } from './probe'
export { splitVideo } from './split'
export type { SplitOptions } from './split'

// Shared types and error contracts.
export type { ChunkRequest, ChunkResult, Source, FetchedSource, MediaInfo, Chunk } from './media'
export type { RunEvent, OnProgress, FetchProgress, SplitProgress } from './events'
export { VideoError } from './errors'
export type { VideoErrorCode } from './errors'
export { defaultBinaries, resolveBinaries, verifyBinaries } from './binaries'
export type { Binaries } from './binaries'
