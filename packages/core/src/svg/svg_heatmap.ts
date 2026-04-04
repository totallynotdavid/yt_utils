import type { ReplayMarker, ReplaySegment } from "../types";
import { parsePathToPoints, stitchPaths } from "./svg_path_parser";
import { localProminence, movingAverage, smooth } from "./svg_smoothing";

export function markersFromSvg(svg: string, durationSec: number): ReplayMarker[] {
  if (!Number.isFinite(durationSec) || durationSec <= 1) return [];

  const pathData = svg.match(/<path\b[^>]*\bd=(['"])(.*?)\1/gi) ?? [];
  if (pathData.length === 0) return [];

  const pointGroups = pathData
    .map((pathTag) => {
      const match = pathTag.match(/\bd=(['"])(.*?)\1/i);
      return match?.[2];
    })
    .filter(
      (pathSegment): pathSegment is string =>
        typeof pathSegment === "string" && pathSegment.length > 0,
    )
    .map(parsePathToPoints);
  const points = stitchPaths(pointGroups).filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  if (points.length < 2) return [];

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));
  const xRange = maxX - minX;
  if (xRange <= 0) return [];

  const seconds = Math.max(2, Math.floor(durationSec));
  const perSecond = Array.from({ length: seconds }, () => 0);

  for (const p of points) {
    const replayHeight = maxY - p.y;
    const ratio = Math.max(0, Math.min(1, (p.x - minX) / xRange));
    const sec = Math.min(seconds - 1, Math.floor(ratio * (seconds - 1)));
    const current = perSecond[sec] ?? 0;
    perSecond[sec] = Math.max(current, replayHeight);
  }

  const smoothed = smooth(perSecond, 2);
  const maxReplay = Math.max(...smoothed);
  if (!Number.isFinite(maxReplay) || maxReplay <= 0) return [];

  return smoothed.map((value, sec) => ({
    startMillis: sec * 1000,
    durationMillis: 1000,
    intensityScoreNormalized: Math.max(0, Math.min(1, value / maxReplay)),
  }));
}

export function topSegmentsFromMarkers(markers: ReplayMarker[], parts: number): ReplaySegment[] {
  if (parts <= 0 || markers.length === 0) return [];

  const durationSec = maxDurationFromMarkers(markers);
  if (durationSec <= 0) return [];

  const values = Array.from({ length: durationSec }, () => 0);
  for (const marker of markers) {
    const start = Math.max(0, Math.floor(marker.startMillis / 1000));
    const endExclusive = Math.min(
      durationSec,
      Math.max(start + 1, Math.ceil((marker.startMillis + marker.durationMillis) / 1000)),
    );
    for (let sec = start; sec < endExclusive; sec += 1) {
      const current = values[sec] ?? 0;
      values[sec] = Math.max(current, marker.intensityScoreNormalized);
    }
  }

  const smoothed = smooth(values, 2);
  const globalMax = Math.max(...smoothed, 0);
  const localBaseline = movingAverage(smoothed, Math.max(8, Math.floor(smoothed.length / 50)));
  const prominenceThreshold = Math.max(0.006, globalMax * 0.015);
  const minPeakDistance = Math.max(3, Math.floor(durationSec / 120));
  const segmentSeconds = 3;
  const candidates: { idx: number; prominence: number; score: number }[] = [];

  const firstPoint = smoothed[0];
  const secondPoint = smoothed[1];
  if (firstPoint !== undefined && secondPoint !== undefined && firstPoint >= secondPoint) {
    candidates.push({
      idx: 0,
      prominence: firstPoint - secondPoint,
      score: firstPoint,
    });
  }

  for (let i = 1; i < smoothed.length - 1; i += 1) {
    const center = smoothed[i] ?? 0;
    const left = smoothed[i - 1] ?? center;
    const right = smoothed[i + 1] ?? center;
    const isPeak = center >= left && center >= right;
    if (!isPeak) continue;
    const prominence = localProminence(smoothed, i);
    if (prominence < prominenceThreshold) continue;
    const baseline = localBaseline[i] ?? center;
    const relativeLift = Math.max(0, center - baseline);
    candidates.push({ idx: i, prominence, score: center + relativeLift * 0.5 });
  }

  const lastValue = smoothed.at(-1);
  const previousValue = smoothed.at(-2);
  if (lastValue !== undefined && previousValue !== undefined && lastValue >= previousValue) {
    const lastIndex = smoothed.length - 1;
    candidates.push({
      idx: lastIndex,
      prominence: lastValue - previousValue,
      score: lastValue,
    });
  }

  if (candidates.length === 0) {
    const idx = smoothed.indexOf(globalMax);
    if (idx >= 0) {
      candidates.push({ idx, prominence: globalMax, score: globalMax });
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.prominence - a.prominence;
  });

  const taken = Array.from({ length: values.length }, () => false);
  const segments: ReplaySegment[] = [];

  for (const candidate of candidates) {
    if (segments.length >= parts) break;
    if (taken[candidate.idx]) continue;

    const start = candidate.idx;
    const end = Math.min(values.length - 1, start + segmentSeconds);

    const minIdx = Math.max(0, candidate.idx - minPeakDistance);
    const maxIdx = Math.min(values.length - 1, candidate.idx + minPeakDistance);
    for (let i = minIdx; i <= maxIdx; i += 1) {
      taken[i] = true;
    }

    for (let i = start; i <= end; i += 1) {
      taken[i] = true;
    }

    segments.push({
      position: segments.length + 1,
      start,
      end,
      score: Number(candidate.prominence.toFixed(4)),
    });
  }

  return segments
    .sort((a, b) => b.score - a.score)
    .slice(0, parts)
    .map((s, idx) => ({ ...s, position: idx + 1 }));
}

export function maxDurationFromMarkers(markers: ReplayMarker[]): number {
  if (markers.length === 0) return 0;
  const maxMs = Math.max(...markers.map((m) => m.startMillis + m.durationMillis));
  return Math.max(1, Math.ceil(maxMs / 1000));
}
