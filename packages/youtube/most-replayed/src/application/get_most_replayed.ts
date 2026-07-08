import { YtUtilsError } from '@ytutils/core'

import { assertVideoId, normalizeGetMostReplayedOptions } from '../boundary'
import { getJsonMarkersForVideo } from '../infra/json_strategy'
import { getSvgMarkersForVideo } from '../infra/svg_strategy'
import { maxDurationFromMarkers, topSegmentsFromMarkers } from '../svg'
import type { GetMostReplayedOptions, MostReplayedResult, ReplayMarker } from '../types'

export type MostReplayedDeps = {
  getJsonMarkersForVideo: (videoId: string) => Promise<ReplayMarker[]>
  getSvgMarkersForVideo: (
    videoId: string
  ) => Promise<{ markers: ReplayMarker[]; durationSec: number }>
}

const defaultDeps: MostReplayedDeps = {
  getJsonMarkersForVideo,
  getSvgMarkersForVideo,
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

export async function getMostReplayed(
  videoId: string,
  options?: GetMostReplayedOptions,
  deps?: MostReplayedDeps
): Promise<MostReplayedResult> {
  assertVideoId(videoId)
  const normalized = normalizeGetMostReplayedOptions(options)
  const resolvedDeps = deps ?? defaultDeps

  if (normalized.strategy === 'svg') {
    const svgResult = await resolvedDeps.getSvgMarkersForVideo(videoId)
    if (svgResult.markers.length === 0) {
      throw new YtUtilsError('NOT_FOUND', 'No replay markers could be parsed from SVG heatmap')
    }

    return buildResultFromMarkers(
      videoId,
      'svg',
      svgResult.markers,
      svgResult.durationSec,
      normalized.parts
    )
  }

  const jsonMarkers =
    deps === undefined
      ? await getJsonMarkersForVideo(videoId, normalized.httpClient)
      : await deps.getJsonMarkersForVideo(videoId)
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

  const svgResult = await resolvedDeps.getSvgMarkersForVideo(videoId)
  if (svgResult.markers.length === 0) {
    throw new YtUtilsError('NOT_FOUND', 'No replay markers could be parsed from SVG heatmap')
  }

  return buildResultFromMarkers(
    videoId,
    'svg',
    svgResult.markers,
    svgResult.durationSec,
    normalized.parts
  )
}
