import type { ReplayMarker } from '../types'

import { isRecord } from './json_payloads'

export function markersFromJsonUnknown(input: unknown): ReplayMarker[] {
  if (!isRecord(input)) return []

  const markers = input['markers']
  if (!Array.isArray(markers)) return []

  return markers
    .map((marker): ReplayMarker | null => {
      if (!isRecord(marker)) return null
      const startMillis = Number(marker['startMillis'])
      const durationMillis = Number(marker['durationMillis'])
      const intensityScoreNormalized = Number(
        marker['intensityScoreNormalized'] ?? marker['heatMarkerIntensityScoreNormalized']
      )
      if (
        !Number.isFinite(startMillis) ||
        !Number.isFinite(durationMillis) ||
        !Number.isFinite(intensityScoreNormalized)
      ) {
        return null
      }

      return {
        startMillis,
        durationMillis,
        intensityScoreNormalized,
      }
    })
    .filter((marker): marker is ReplayMarker => marker !== null)
}
