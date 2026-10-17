import type { ReplayMarker } from '../types'
import { markersFromJsonUnknown } from './json_markers'
import { extractMarkerPayloadsFromHtml } from './json_payloads'

export function extractJsonMarkersFromHtml(html: string): ReplayMarker[] {
  for (const payload of extractMarkerPayloadsFromHtml(html)) {
    const markers = markersFromJsonUnknown(payload)
    if (markers.length > 0) return markers
  }

  return []
}
