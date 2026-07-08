// Default workflow: URL in, chunks out.
// This function validates inputs, verifies binaries, runs fetch/probe/split,
// and converts raw step progress into one RunEvent stream.
// Call fetchVideo/probe/splitVideo directly when you need a custom flow.

import { mkdir, rm } from "node:fs/promises";

import type { Binaries } from "./binaries.ts";
import { resolveBinaries, verifyBinaries } from "./binaries.ts";
import { VideoError } from "./errors.ts";
import type { OnProgress } from "./events.ts";
import { fetchVideo } from "./fetch.ts";
import type { ChunkRequest, ChunkResult, Source } from "./media.ts";
import { probe } from "./probe.ts";
import { splitVideo } from "./split.ts";

export interface RunOptions {
  binaries?: Partial<Binaries>;
  signal?: AbortSignal;
  onProgress?: OnProgress;
}

function validateRequest(req: ChunkRequest): void {
  if (!req.url?.trim()) throw new VideoError("INVALID_REQUEST", "url is required");
  if (!req.outDir?.trim()) throw new VideoError("INVALID_REQUEST", "outDir is required");
  if (!(req.chunkSeconds > 0)) {
    throw new VideoError("INVALID_REQUEST", "chunkSeconds must be greater than zero");
  }
}

function percentOf(done: number, total: number | null): number {
  if (total === null || total <= 0) return 0;
  return Math.min(100, (done / total) * 100);
}

export async function run(req: ChunkRequest, opts: RunOptions = {}): Promise<ChunkResult> {
  validateRequest(req);

  const binaries = resolveBinaries(opts.binaries);
  // Fail fast before download if any required binary is missing.
  verifyBinaries(binaries);
  await mkdir(req.outDir, { recursive: true });

  const emit = opts.onProgress ?? (() => {});
  const { signal } = opts;

  emit({ type: "stage:start", stage: "fetch" });
  const fetched = await fetchVideo(req.url, {
    outDir: req.outDir,
    cookies: req.cookies,
    binaries,
    signal,
    onProgress: ({ receivedBytes, totalBytes }) => {
      emit({
        type: "fetch:progress",
        percent: percentOf(receivedBytes, totalBytes),
        receivedBytes,
        totalBytes,
      });
    },
  });
  emit({ type: "stage:done", stage: "fetch" });

  emit({ type: "stage:start", stage: "probe" });
  const source: Source = { ...fetched, ...(await probe(fetched.path, { binaries })) };
  emit({ type: "probed", source });
  emit({ type: "stage:done", stage: "probe" });

  emit({ type: "stage:start", stage: "split" });
  const chunks = await splitVideo(fetched.path, {
    outDir: req.outDir,
    chunkSeconds: req.chunkSeconds,
    binaries,
    signal,
    onProgress: ({ processedSeconds }) => {
      emit({
        type: "split:progress",
        percent: percentOf(processedSeconds, source.durationSeconds),
        processedSeconds,
        totalSeconds: source.durationSeconds,
      });
    },
    onChunk: (chunk) => {
      emit({ type: "chunk", chunk });
    },
  });
  emit({ type: "stage:done", stage: "split" });

  // Keep source-file lifecycle at the workflow boundary.
  if (req.keepSource !== true) await rm(source.path, { force: true });
  return { source, chunks, outDir: req.outDir };
}
