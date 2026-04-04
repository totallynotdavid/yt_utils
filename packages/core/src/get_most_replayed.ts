import { markersFromSvg, maxDurationFromMarkers, topSegmentsFromMarkers } from "./svg";
import type { GetMostReplayedOptions, MostReplayedResult, ReplayMarker } from "./types";
import { assertVideoId, normalizeGetMostReplayedOptions } from "./boundary";
import { extractJsonMarkersCurrentFromHtml } from "./json";
import { extractSvgAndDuration, fetchWatchHtml, withYoutubePage } from "./youtube_page";

async function getJsonMarkersForVideo(videoId: string): Promise<ReplayMarker[]> {
  const html = await fetchWatchHtml(videoId);
  return extractJsonMarkersCurrentFromHtml(html);
}

async function getSvgMarkersForVideo(
  videoId: string,
): Promise<{ markers: ReplayMarker[]; durationSec: number }> {
  return withYoutubePage(videoId, async (page) => {
    const { svg, durationSec } = await extractSvgAndDuration(page);
    const safeDuration = Math.max(0, durationSec ?? 0);
    return {
      markers: markersFromSvg(svg, safeDuration),
      durationSec: safeDuration,
    };
  });
}

export async function get_most_replayed(
  videoId: string,
  options?: GetMostReplayedOptions,
): Promise<MostReplayedResult> {
  assertVideoId(videoId);
  const normalized = normalizeGetMostReplayedOptions(options);

  if (normalized.strategy === "svg") {
    const svgResult = await getSvgMarkersForVideo(videoId);
    if (svgResult.markers.length === 0) {
      throw new Error("No replay markers could be parsed from SVG heatmap");
    }
    return {
      videoId,
      durationSec: svgResult.durationSec,
      source: "svg",
      segments: topSegmentsFromMarkers(svgResult.markers, normalized.parts),
    };
  }

  const jsonMarkers = await getJsonMarkersForVideo(videoId);
  if (jsonMarkers.length > 0) {
    const durationSec = maxDurationFromMarkers(jsonMarkers);
    return {
      videoId,
      durationSec,
      source: "json",
      segments: topSegmentsFromMarkers(jsonMarkers, normalized.parts),
    };
  }

  if (normalized.strategy === "json") {
    throw new Error("No most-replayed JSON markers found for video");
  }

  if (!normalized.allow_svg_fallback) {
    throw new Error(
      "No most-replayed JSON markers found. SVG fallback is disabled by default; set allow_svg_fallback=true to enable it.",
    );
  }

  const svgResult = await getSvgMarkersForVideo(videoId);
  if (svgResult.markers.length === 0) {
    throw new Error("No replay markers could be parsed from SVG heatmap");
  }

  return {
    videoId,
    durationSec: svgResult.durationSec,
    source: "svg",
    segments: topSegmentsFromMarkers(svgResult.markers, normalized.parts),
  };
}
