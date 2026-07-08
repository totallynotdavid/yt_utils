import type { ChunkResult, RunEvent, Source } from "@ytutils/video-chunker";

const MB = 1024 * 1024;

export function formatMB(bytes: number): string {
  return `${(bytes / MB).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

type ProgressEvent = Extract<RunEvent, { type: "fetch:progress" | "split:progress" }>;

export function progressDetail(event: ProgressEvent): string {
  if (event.type === "fetch:progress") {
    if (event.totalBytes === null) return formatMB(event.receivedBytes);
    return `${formatMB(event.receivedBytes)} / ${formatMB(event.totalBytes)}`;
  }
  return `${formatDuration(event.processedSeconds)} / ${formatDuration(event.totalSeconds)}`;
}

export function estimateChunks(durationSeconds: number, chunkSeconds: number): number {
  return Math.max(1, Math.ceil(durationSeconds / chunkSeconds));
}

export function formatSourceInfo(source: Source, chunkSeconds: number): string {
  return (
    `  title:   ${source.title}\n` +
    `  length:  ${formatDuration(source.durationSeconds)}\n` +
    `  size:    ${formatMB(source.sizeBytes)}\n` +
    `  chunks:  ~${estimateChunks(source.durationSeconds, chunkSeconds)}\n`
  );
}

export function formatSummary(result: ChunkResult): string {
  const totalBytes = result.chunks.reduce((sum, c) => sum + c.sizeBytes, 0);
  const lines = [
    `\nDone. ${result.chunks.length} chunks in ${result.outDir}/\n`,
    `  #   file                          length     size`,
    `  ─── ───────────────────────────── ────────── ──────────`,
  ];
  for (const chunk of result.chunks) {
    const file = (chunk.path.split("/").pop() ?? "").padEnd(29);
    lines.push(
      `  ${String(chunk.index).padEnd(3)} ${file} ${formatDuration(chunk.durationSeconds).padEnd(10)} ${formatMB(chunk.sizeBytes)}`,
    );
  }
  lines.push(`\n  total: ${formatMB(totalBytes)}\n`);
  return lines.join("\n");
}
