import type { ReplayMarker } from '../types'
import { extractJsonMarkersCurrentFromHtml } from '../json'
import { fetchWatchHtml } from '../youtube_page'

export async function getJsonMarkersForVideo(videoId: string): Promise<ReplayMarker[]> {
  const html = await fetchWatchHtml(videoId)
  return extractJsonMarkersCurrentFromHtml(html)
}
