import type { ReplayMarker } from '../types'

export function maxDurationFromMarkers(markers: ReplayMarker[]): number {
  if (markers.length === 0) return 0
  const maxMs = Math.max(...markers.map((m) => m.startMillis + m.durationMillis))
  return Math.max(1, Math.ceil(maxMs / 1000))
}

export function smoothTimeline(values: number[], radius = 2): number[] {
  if (values.length === 0) return []

  return values.map((_, index) => {
    const left = Math.max(0, index - radius)
    const right = Math.min(values.length - 1, index + radius)
    const window = values.slice(left, right + 1)
    const total = window.reduce((sum, value) => sum + value, 0)
    return window.length > 0 ? total / window.length : 0
  })
}

export function markersToTimeline(markers: ReplayMarker[]): number[] {
  const durationSec = maxDurationFromMarkers(markers)
  const timeline = Array.from({ length: durationSec }, () => 0)

  for (const marker of markers) {
    const start = Math.max(0, Math.floor(marker.startMillis / 1000))
    const endExclusive = Math.min(
      durationSec,
      Math.max(start + 1, Math.ceil((marker.startMillis + marker.durationMillis) / 1000))
    )

    for (let second = start; second < endExclusive; second += 1) {
      timeline[second] = Math.max(timeline[second] ?? 0, marker.intensityScoreNormalized)
    }
  }

  return timeline
}

export function timelineToReplayMarkers(timeline: number[]): ReplayMarker[] {
  const smoothed = smoothTimeline(timeline, 2)
  const maxReplay = Math.max(...smoothed)
  if (!Number.isFinite(maxReplay) || maxReplay <= 0) return []

  return smoothed.map((value, second) => ({
    startMillis: second * 1000,
    durationMillis: 1000,
    intensityScoreNormalized: Math.max(0, Math.min(1, value / maxReplay)),
  }))
}
