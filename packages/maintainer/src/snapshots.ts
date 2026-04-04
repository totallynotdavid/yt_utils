import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  compareMarkerSets,
  extractJsonMarkersCurrentFromHtml,
  extractJsonMarkersFastFromHtml,
} from "../../core/src/json";
import { assertVideoId } from "../../core/src/boundary";
import { extractSvgAndDuration, readPageHtml, withYoutubePage } from "../../core/src/youtube_page";
import { maxDurationFromMarkers } from "../../core/src/svg";
import type { JsonExtractorComparisonResult, SnapshotCaptureResult } from "./types";

export async function compareJsonExtractorsFromSingleResponse(
  videoId: string,
): Promise<JsonExtractorComparisonResult> {
  assertVideoId(videoId);

  return withYoutubePage(videoId, async (page) => {
    const html = await readPageHtml(page);
    const currentMarkers = extractJsonMarkersCurrentFromHtml(html);
    const fastMarkers = extractJsonMarkersFastFromHtml(html);
    const compared = compareMarkerSets(currentMarkers, fastMarkers);

    return {
      videoId,
      currentCount: currentMarkers.length,
      fastCount: fastMarkers.length,
      ...compared,
    };
  });
}

export async function captureRefinementSnapshot(
  videoId: string,
  outDir: string,
): Promise<SnapshotCaptureResult> {
  assertVideoId(videoId);
  if (!outDir || typeof outDir !== "string") {
    throw new Error("outDir must be a non-empty string");
  }

  return withYoutubePage(videoId, async (page) => {
    const html = await readPageHtml(page);
    const { svg, durationSec } = await extractSvgAndDuration(page);
    const jsonMarkers = extractJsonMarkersCurrentFromHtml(html);
    const resolvedDuration = durationSec ?? maxDurationFromMarkers(jsonMarkers);

    const snapshotDir = join(outDir, videoId);
    await mkdir(snapshotDir, { recursive: true });

    const htmlPath = join(snapshotDir, "page.html");
    const svgPath = join(snapshotDir, "heatmap.svg");
    const metaPath = join(snapshotDir, "meta.json");

    await writeFile(htmlPath, html, "utf8");
    await writeFile(svgPath, svg, "utf8");
    await writeFile(
      metaPath,
      JSON.stringify(
        {
          videoId,
          capturedAt: new Date().toISOString(),
          durationSec: resolvedDuration,
          jsonMarkersCount: jsonMarkers.length,
        },
        null,
        2,
      ),
      "utf8",
    );

    return {
      videoId,
      snapshotDir,
      htmlPath,
      svgPath,
      metaPath,
    };
  });
}

export async function ensureRefinementSnapshot(
  videoId: string,
  outDir: string,
): Promise<SnapshotCaptureResult> {
  const snapshotDir = join(outDir, videoId);
  const htmlPath = join(snapshotDir, "page.html");
  const svgPath = join(snapshotDir, "heatmap.svg");
  const metaPath = join(snapshotDir, "meta.json");

  try {
    await readFile(htmlPath, "utf8");
    await readFile(svgPath, "utf8");
    await readFile(metaPath, "utf8");
    return {
      videoId,
      snapshotDir,
      htmlPath,
      svgPath,
      metaPath,
    };
  } catch {
    return captureRefinementSnapshot(videoId, outDir);
  }
}

export async function compareJsonExtractorsFromSnapshot(
  snapshotDir: string,
): Promise<JsonExtractorComparisonResult> {
  if (!snapshotDir || typeof snapshotDir !== "string") {
    throw new Error("snapshotDir must be a non-empty string");
  }

  const html = await readFile(join(snapshotDir, "page.html"), "utf8");
  const meta = JSON.parse(await readFile(join(snapshotDir, "meta.json"), "utf8")) as {
    videoId?: string;
  };

  const currentMarkers = extractJsonMarkersCurrentFromHtml(html);
  const fastMarkers = extractJsonMarkersFastFromHtml(html);
  const compared = compareMarkerSets(currentMarkers, fastMarkers);

  return {
    videoId: meta.videoId ?? "unknown",
    currentCount: currentMarkers.length,
    fastCount: fastMarkers.length,
    ...compared,
  };
}
