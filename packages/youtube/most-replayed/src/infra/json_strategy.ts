import type { HttpClient } from '@ytutils/core'
import type { ReplayMarker } from '../types'
import { extractJsonMarkersCurrentFromHtml } from '../json'
import { fetchWatchHtml } from '../youtube_page'

export async function getJsonMarkersForVideo(
  videoId: string,
  httpClient?: HttpClient
): Promise<ReplayMarker[]> {
  const html = await fetchWatchHtml(videoId, { httpClient })
  return extractJsonMarkersCurrentFromHtml(html)
}
