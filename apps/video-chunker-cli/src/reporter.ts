// CLI reporter for progress events.
// Prints stage headings, throttled progress lines, and a final summary.
// Output stays plain text so terminal, pipes, and CI logs match.
import type { ChunkResult, OnProgress } from "@ytutils/video-chunker";

import { formatSourceInfo, formatSummary, progressDetail } from "./format.ts";

export interface Reporter {
  onProgress: OnProgress;
  finish(result: ChunkResult): void;
  fail(message: string): void;
}

// Stage headings to print.
const HEADINGS: Record<string, string> = {
  fetch: "Downloading",
  probe: "Reading video info",
  split: "Splitting",
};

// Print at most one line per step. Always print 100%.
const STEP_PERCENT = 10;

export function createReporter(chunkSeconds: number): Reporter {
  let lastShown = -STEP_PERCENT;

  const showProgress = (percent: number, detail: string) => {
    const p = Math.round(percent);
    if (p === lastShown) return;
    if (p < 100 && p < lastShown + STEP_PERCENT) return;
    lastShown = p;
    process.stdout.write(`  ${String(p).padStart(3)}%  ${detail}\n`);
  };

  return {
    onProgress(event) {
      switch (event.type) {
        case "stage:start": {
          const heading = HEADINGS[event.stage];
          if (heading !== undefined) {
            lastShown = -STEP_PERCENT;
            process.stdout.write(`\n${heading}\n`);
          }
          break;
        }
        case "fetch:progress":
        case "split:progress":
          showProgress(event.percent, progressDetail(event));
          break;
        case "probed":
          process.stdout.write(formatSourceInfo(event.source, chunkSeconds));
          break;
        default:
          break;
      }
    },
    finish(result) {
      process.stdout.write(formatSummary(result));
    },
    fail(message) {
      process.stderr.write(`\n${message}\n`);
    },
  };
}
