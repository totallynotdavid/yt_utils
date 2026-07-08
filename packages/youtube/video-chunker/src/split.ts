// Split a media file into fixed-length chunks with ffmpeg's segment muxer.
//
// `-c copy` means no re-encoding, so splitting a multi-GB file takes seconds.
// The trade-off is that cuts land on the nearest keyframe before each target
// time, so a chunk's real length is approximately (not exactly) chunkSeconds.
// That is the right default for hour-long chunks.
//
// We learn which files were written from ffmpeg's `-segment_list` manifest, not
// by scanning the output directory, so a previous run's leftover chunks can
// never leak into this run's result.
//
// Boundary module: spawns ffmpeg, reads the files it wrote.

import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

import type { Binaries } from "./binaries.ts";
import { resolveBinaries, verifyBinaries } from "./binaries.ts";
import { VideoError } from "./errors.ts";
import type { SplitProgress } from "./events.ts";
import { eachLine } from "./lines.ts";
import type { Chunk } from "./media.ts";
import { readDurationSeconds } from "./probe.ts";

export interface SplitOptions {
  outDir: string;
  chunkSeconds: number;
  binaries?: Partial<Binaries>;
  signal?: AbortSignal;
  onProgress?: (progress: SplitProgress) => void;
  onChunk?: (chunk: Chunk) => void;
}

interface RunFfmpeg {
  ffmpeg: string;
  inputPath: string;
  outputPattern: string;
  manifestPath: string;
  chunkSeconds: number;
  signal?: AbortSignal;
  onProgress?: (progress: SplitProgress) => void;
}

// ffmpeg's `-progress` stream is `key=value` per line; we only track elapsed
// output time. out_time_us is microseconds, hence the divide.
const OUT_TIME = "out_time_us=";

async function runFfmpeg(run: RunFfmpeg): Promise<void> {
  const proc = Bun.spawn(
    [
      run.ffmpeg,
      "-hide_banner",
      "-nostats",
      "-i",
      run.inputPath,
      "-c",
      "copy",
      "-map",
      "0",
      "-f",
      "segment",
      "-segment_time",
      String(run.chunkSeconds),
      "-reset_timestamps",
      "1",
      // Source of truth for files written in this run.
      "-segment_list",
      run.manifestPath,
      "-segment_list_type",
      "csv",
      "-progress",
      "pipe:1",
      run.outputPattern,
    ],
    { stdout: "pipe", stderr: "pipe", signal: run.signal },
  );

  await eachLine(proc.stdout, (line) => {
    if (!line.startsWith(OUT_TIME)) return;
    const processedSeconds = Number(line.slice(OUT_TIME.length)) / 1_000_000;
    if (Number.isFinite(processedSeconds)) run.onProgress?.({ processedSeconds });
  });

  const stderr = await new Response(proc.stderr).text();
  if ((await proc.exited) !== 0) {
    throw new VideoError("SPLIT_FAILED", `ffmpeg failed:\n${stderr.slice(-2000)}`);
  }
}

// Each manifest line is `filename,start,end`. The filename is a basename
// relative to the output pattern's directory, so we resolve it against outDir.
// The start/end columns are the intended cut timeline, not the real file
// length, so durations come from ffprobe instead.
function manifestFilenames(csv: string): string[] {
  const names: string[] = [];
  for (const line of csv.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const comma = trimmed.indexOf(",");
    names.push(comma === -1 ? trimmed : trimmed.slice(0, comma));
  }
  return names;
}

async function collectChunks(
  filenames: string[],
  outDir: string,
  ffprobe: string,
  onChunk: ((chunk: Chunk) => void) | undefined,
): Promise<Chunk[]> {
  const chunks: Chunk[] = [];
  for (let index = 0; index < filenames.length; index++) {
    const path = join(outDir, filenames[index]!);
    const chunk: Chunk = {
      index,
      path,
      sizeBytes: Bun.file(path).size,
      durationSeconds: await readDurationSeconds(path, ffprobe),
    };
    chunks.push(chunk);
    onChunk?.(chunk);
  }
  return chunks;
}

/** Split media into fixed-length chunk files under `outDir`. */
export async function splitVideo(inputPath: string, opts: SplitOptions): Promise<Chunk[]> {
  const binaries = resolveBinaries(opts.binaries);
  verifyBinaries(binaries, ["ffmpeg", "ffprobe"]);

  const ext = extname(inputPath) || ".mp4";
  const manifestPath = join(tmpdir(), `segments-${randomUUID()}.csv`);
  try {
    await runFfmpeg({
      ffmpeg: binaries.ffmpeg,
      inputPath,
      outputPattern: join(opts.outDir, `chunk_%03d${ext}`),
      manifestPath,
      chunkSeconds: opts.chunkSeconds,
      signal: opts.signal,
      onProgress: opts.onProgress,
    });
    const filenames = manifestFilenames(await Bun.file(manifestPath).text());
    return await collectChunks(filenames, opts.outDir, binaries.ffprobe, opts.onChunk);
  } finally {
    await rm(manifestPath, { force: true });
  }
}
