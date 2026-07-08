import type { ReplayMarker, ReplaySegment } from '../types'
import { findPeakCandidates, type PeakCandidate } from './peaks'
import { markersToTimeline, smoothTimeline } from './timeline'

function markTaken(taken: boolean[], start: number, end: number): void {
  for (let index = start; index <= end; index += 1) {
    taken[index] = true
  }
}

function segmentFromCandidate(
  candidate: PeakCandidate,
  position: number,
  valuesLength: number
): ReplaySegment {
  return {
    position,
    start: candidate.index,
    end: Math.min(valuesLength - 1, candidate.index + 3),
    score: Number(candidate.prominence.toFixed(4)),
  }
}

export function selectNonOverlappingSegments(
  candidates: PeakCandidate[],
  valuesLength: number,
  parts: number
): ReplaySegment[] {
  const minPeakDistance = Math.max(3, Math.floor(valuesLength / 120))
  const taken = Array.from({ length: valuesLength }, () => false)
  const segments: ReplaySegment[] = []

  for (const candidate of candidates) {
    if (segments.length >= parts) break
    if (taken[candidate.index]) continue

    const segment = segmentFromCandidate(candidate, segments.length + 1, valuesLength)
    markTaken(
      taken,
      Math.max(0, candidate.index - minPeakDistance),
      Math.min(valuesLength - 1, candidate.index + minPeakDistance)
    )
    markTaken(taken, segment.start, segment.end)
    segments.push(segment)
  }

  return segments
}

function rankSegments(segments: ReplaySegment[], parts: number): ReplaySegment[] {
  return segments
    .sort((a, b) => b.score - a.score)
    .slice(0, parts)
    .map((segment, index) => ({ ...segment, position: index + 1 }))
}

export function topSegmentsFromMarkers(markers: ReplayMarker[], parts: number): ReplaySegment[] {
  if (parts <= 0 || markers.length === 0) return []

  const values = markersToTimeline(markers)
  if (values.length === 0) return []

  const candidates = findPeakCandidates(smoothTimeline(values, 2)).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.prominence - a.prominence
  })

  return rankSegments(selectNonOverlappingSegments(candidates, values.length, parts), parts)
}
