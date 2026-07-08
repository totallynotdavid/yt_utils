// Public surface.

// The convenience: a YouTube URL in, fixed-length chunks out.
export { run } from "./run.ts";
export type { RunOptions } from "./run.ts";

// Operations: compose your own workflow from these, or use them on their own.
export { fetchVideo } from "./fetch.ts";
export type { FetchOptions } from "./fetch.ts";
export { probe } from "./probe.ts";
export type { ProbeOptions } from "./probe.ts";
export { splitVideo } from "./split.ts";
export type { SplitOptions } from "./split.ts";

// Shared types and error contracts.
export type {
  ChunkRequest,
  ChunkResult,
  Source,
  FetchedSource,
  MediaInfo,
  Chunk,
} from "./media.ts";
export type { RunEvent, OnProgress, FetchProgress, SplitProgress } from "./events.ts";
export { VideoError } from "./errors.ts";
export type { VideoErrorCode } from "./errors.ts";
export { defaultBinaries, resolveBinaries, verifyBinaries } from "./binaries.ts";
export type { Binaries } from "./binaries.ts";
