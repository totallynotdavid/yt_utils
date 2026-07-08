import type { ReplayMarker } from '../types'
import { markersFromJsonUnknown } from './json_markers'
import {
  extractCurrentJsonMarkerPayloadsFromHtml,
  extractFastJsonMarkerPayloadsFromHtml,
} from './json_payloads'

export function extractJsonMarkersCurrentFromHtml(html: string): ReplayMarker[] {
  for (const payload of extractCurrentJsonMarkerPayloadsFromHtml(html)) {
    const markers = markersFromJsonUnknown(payload)
    if (markers.length > 0) return markers
  }

  return []
}

export function extractJsonMarkersFastFromHtml(html: string): ReplayMarker[] {
  for (const payload of extractFastJsonMarkerPayloadsFromHtml(html)) {
    const markers = markersFromJsonUnknown(payload)
    if (markers.length > 0) return markers
  }

  return []
}
