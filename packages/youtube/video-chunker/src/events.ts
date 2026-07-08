// Progress has two layers:
// - raw progress reported by each tool
// - run events that add computed percentages
// Formatting (MB, HH:MM:SS) stays outside core.

import type { Source, Chunk } from "./media.ts";

/** Raw download progress from yt-dlp. */
export interface FetchProgress {
  receivedBytes: number;
  totalBytes: number | null;
}

/** Raw split progress from ffmpeg. There is no total, so no percent. */
export interface SplitProgress {
  processedSeconds: number;
}

export type RunEvent =
  | { type: "stage:start"; stage: string }
  | { type: "stage:done"; stage: string }
  | { type: "fetch:progress"; percent: number; receivedBytes: number; totalBytes: number | null }
  | { type: "probed"; source: Source }
  | { type: "split:progress"; percent: number; processedSeconds: number; totalSeconds: number }
  | { type: "chunk"; chunk: Chunk };

export type OnProgress = (event: RunEvent) => void;
