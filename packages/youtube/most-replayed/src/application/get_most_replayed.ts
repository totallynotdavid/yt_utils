import type { HttpClient } from '@ytutils/core'
import { parseVideoId, YtUtilsError } from '@ytutils/core'

import { normalizeGetMostReplayedOptions } from '../boundary'
import { getJsonMarkersForVideo } from '../infra/json_strategy'
import { getSvgMarkersForVideo } from '../infra/svg_strategy'
import { topSegmentsFromMarkers } from '../ranking/segments'
import { maxDurationFromMarkers } from '../ranking/timeline'
import type { GetMostReplayedOptions, MostReplayedResult, ReplayMarker } from '../types'

export type MostReplayedDeps = {
  getJsonMarkersForVideo: (videoId: string, httpClient?: HttpClient) => Promise<ReplayMarker[]>
  getSvgMarkersForVideo: (
    videoId: string
  ) => Promise<{ markers: ReplayMarker[]; durationSec: number }>
}

function buildResultFromMarkers(
  videoId: string,
  source: 'json' | 'svg',
  markers: ReplayMarker[],
  durationSec: number,
  parts: number
): MostReplayedResult {
  return {
    videoId,
    durationSec,
    source,
    segments: topSegmentsFromMarkers(markers, parts),
  }
}

async function buildSvgResult(
  videoId: string,
  parts: number,
  getSvgMarkers: MostReplayedDeps['getSvgMarkersForVideo']
) {
  const svgResult = await getSvgMarkers(videoId)
  if (svgResult.markers.length === 0) {
    throw new YtUtilsError('NOT_FOUND', 'No replay markers could be parsed from SVG heatmap')
  }

  return buildResultFromMarkers(videoId, 'svg', svgResult.markers, svgResult.durationSec, parts)
}

export async function getMostReplayed(
  videoId: string,
  options?: GetMostReplayedOptions,
  deps: Partial<MostReplayedDeps> = {}
): Promise<MostReplayedResult> {
  parseVideoId(videoId)
  const normalized = normalizeGetMostReplayedOptions(options)
  const getJsonMarkers = deps.getJsonMarkersForVideo ?? getJsonMarkersForVideo
  const getSvgMarkers = deps.getSvgMarkersForVideo ?? getSvgMarkersForVideo

  if (normalized.strategy === 'svg') {
    return buildSvgResult(videoId, normalized.parts, getSvgMarkers)
  }

  const jsonMarkers = await getJsonMarkers(videoId, normalized.httpClient)
  if (jsonMarkers.length > 0) {
    return buildResultFromMarkers(
      videoId,
      'json',
      jsonMarkers,
      maxDurationFromMarkers(jsonMarkers),
      normalized.parts
    )
  }

  if (normalized.strategy === 'json') {
    throw new YtUtilsError('NOT_FOUND', 'No most-replayed JSON markers found for video')
  }

  if (!normalized.allowSvgFallback) {
    throw new YtUtilsError(
      'NOT_FOUND',
      'No most-replayed JSON markers found and SVG fallback is disabled'
    )
  }

  return buildSvgResult(videoId, normalized.parts, getSvgMarkers)
}
