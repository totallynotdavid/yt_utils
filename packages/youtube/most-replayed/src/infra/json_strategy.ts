import type { HttpClient } from '@ytutils/core'
import type { ReplayMarker } from '../types'
import { extractJsonMarkersCurrentFromHtml } from '../json'
import { fetchWatchHtml } from '../capture/watch_html'

export async function getJsonMarkersForVideo(
  videoId: string,
  httpClient?: HttpClient
): Promise<ReplayMarker[]> {
  const html = await fetchWatchHtml(videoId, { httpClient })
  return extractJsonMarkersCurrentFromHtml(html)
}
