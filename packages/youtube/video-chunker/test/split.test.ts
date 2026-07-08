import { test, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  splitVideo,
  probe,
  fetchVideo,
  defaultBinaries,
  VideoError,
  type VideoErrorCode,
  type Chunk,
} from "@ytutils/video-chunker";

let dir: string;
let sourcePath: string;

// Run a rejecting call and assert it surfaced the expected typed VideoError.
async function expectVideoError(work: Promise<unknown>, code: VideoErrorCode): Promise<void> {
  const error = await work.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(VideoError);
  if (error instanceof VideoError) expect(error.code).toBe(code);
}

// Generate a short local clip so the tests never touch the network.
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "split-"));
  sourcePath = join(dir, "source.mp4");
  const proc = Bun.spawn([
    defaultBinaries.ffmpeg,
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc=duration=25:size=320x240:rate=30",
    "-pix_fmt",
    "yuv420p",
    "-g",
    "30",
    sourcePath,
  ]);
  if ((await proc.exited) !== 0) throw new Error("could not encode test fixture");
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("probe measures duration and size", async () => {
  const info = await probe(sourcePath);
  expect(info.durationSeconds).toBeGreaterThan(20);
  expect(info.sizeBytes).toBeGreaterThan(0);
});

test("splitVideo splits a file into chunks and fires onChunk for each", async () => {
  const seen: Chunk[] = [];
  const chunks = await splitVideo(sourcePath, {
    outDir: dir,
    chunkSeconds: 10,
    onChunk: (chunk) => {
      seen.push(chunk);
    },
  });

  // 25s split at 10s -> 3 chunks
  expect(chunks).toHaveLength(3);
  expect(chunks.every((c) => c.sizeBytes > 0)).toBe(true);
  expect(chunks.every((c) => c.durationSeconds > 0)).toBe(true);
  expect(seen).toHaveLength(3);
});

test("a re-run in the same directory ignores the previous run's leftover chunks", async () => {
  const reuse = await mkdtemp(join(tmpdir(), "split-reuse-"));
  const path = join(reuse, "source.mp4");
  await Bun.write(Bun.file(path), Bun.file(sourcePath));

  // First run produces more files (25s / 5s) than the second (25s / 10s).
  const first = await splitVideo(path, { outDir: reuse, chunkSeconds: 5 });
  expect(first.length).toBeGreaterThan(3);

  // The manifest only lists this run's files, so the stale chunk_003+ are excluded.
  const second = await splitVideo(path, { outDir: reuse, chunkSeconds: 10 });
  expect(second).toHaveLength(3);

  await rm(reuse, { recursive: true, force: true });
});

test("splitVideo throws SPLIT_FAILED when ffmpeg cannot read the input", async () => {
  const bad = join(dir, "not-a-video.mp4");
  await Bun.write(bad, "this is not media");

  await expectVideoError(splitVideo(bad, { outDir: dir, chunkSeconds: 5 }), "SPLIT_FAILED");
});

test("probe throws PROBE_FAILED on a file ffprobe cannot read", async () => {
  const bad = join(dir, "not-media.mp4");
  await Bun.write(bad, "this is not media");

  await expectVideoError(probe(bad), "PROBE_FAILED");
});

test("fetchVideo throws FETCH_FAILED when yt-dlp exits nonzero", async () => {
  // `false` exits nonzero with no output, standing in for a failing yt-dlp.
  const stub = Bun.which("false");
  if (stub === null) return;

  await expectVideoError(
    fetchVideo("https://example.com/x", { outDir: dir, binaries: { ytdlp: stub } }),
    "FETCH_FAILED",
  );
});
