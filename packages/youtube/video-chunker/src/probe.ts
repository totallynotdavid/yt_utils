// Runs ffprobe to read media duration and file size.

import type { Binaries } from "./binaries.ts";
import { resolveBinaries, verifyBinaries } from "./binaries.ts";
import { VideoError } from "./errors.ts";
import type { MediaInfo } from "./media.ts";

export interface ProbeOptions {
  binaries?: Partial<Binaries>;
}

// Internal helper for repeated probes after one binary verification.
export async function readDurationSeconds(path: string, ffprobe: string): Promise<number> {
  const proc = Bun.spawn(
    [
      ffprobe,
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const out = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) {
    throw new VideoError("PROBE_FAILED", `ffprobe could not read ${path}`);
  }
  const seconds = Number(out.trim());
  if (!Number.isFinite(seconds)) {
    throw new VideoError("PROBE_FAILED", `ffprobe returned no duration for ${path}`);
  }
  return seconds;
}

/** Return duration and size for a media file. */
export async function probe(path: string, opts: ProbeOptions = {}): Promise<MediaInfo> {
  const binaries = resolveBinaries(opts.binaries);
  verifyBinaries(binaries, ["ffprobe"]);
  const durationSeconds = await readDurationSeconds(path, binaries.ffprobe);
  return { durationSeconds, sizeBytes: Bun.file(path).size };
}
