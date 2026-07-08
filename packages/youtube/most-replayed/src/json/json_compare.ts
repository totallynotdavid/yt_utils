import type { ReplayMarker } from '../types'

function markerSignature(marker: ReplayMarker): string {
  return [
    marker.startMillis,
    marker.durationMillis,
    Number(marker.intensityScoreNormalized.toFixed(6)),
  ].join(':')
}

export function compareMarkerSets(
  current: ReplayMarker[],
  fast: ReplayMarker[]
): { exactMatch: boolean; onlyCurrentCount: number; onlyFastCount: number } {
  const currentSet = new Set(current.map(markerSignature))
  const fastSet = new Set(fast.map(markerSignature))

  let onlyCurrentCount = 0
  for (const item of currentSet) {
    if (!fastSet.has(item)) onlyCurrentCount += 1
  }

  let onlyFastCount = 0
  for (const item of fastSet) {
    if (!currentSet.has(item)) onlyFastCount += 1
  }

  return {
    exactMatch: onlyCurrentCount === 0 && onlyFastCount === 0,
    onlyCurrentCount,
    onlyFastCount,
  }
}
