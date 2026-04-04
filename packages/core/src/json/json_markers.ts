import type { ReplayMarker } from "../types";

export function markersFromJsonUnknown(input: unknown): ReplayMarker[] {
  if (!input || typeof input !== "object") return [];

  const maybe = input as { markers?: unknown[] };
  if (!Array.isArray(maybe.markers)) return [];

  return maybe.markers
    .map((marker) => {
      if (!marker || typeof marker !== "object") return null;
      const item = marker as Record<string, unknown>;
      const startMillis = Number(item["startMillis"]);
      const durationMillis = Number(item["durationMillis"]);
      const intensityScoreNormalized = Number(
        item["intensityScoreNormalized"] ?? item["heatMarkerIntensityScoreNormalized"],
      );
      if (
        !Number.isFinite(startMillis) ||
        !Number.isFinite(durationMillis) ||
        !Number.isFinite(intensityScoreNormalized)
      ) {
        return null;
      }

      return {
        startMillis,
        durationMillis,
        intensityScoreNormalized,
      };
    })
    .filter((marker): marker is ReplayMarker => marker !== null);
}
