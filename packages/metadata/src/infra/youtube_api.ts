import type { HttpClient } from '@ytutils/core'
import { YtUtilsError } from '@ytutils/core'

import type { MetadataResult, SearchItem, VideoDetailItem } from '../domain/types'

function pickThumbnail(snippet?: VideoDetailItem['snippet']): string | undefined {
  if (!snippet?.thumbnails) return undefined

  const priority = ['maxres', 'standard', 'high', 'medium', 'default']
  for (const key of priority) {
    const candidate = snippet.thumbnails[key]?.url
    if (candidate) return candidate
  }

  return undefined
}

export async function searchYoutubeMedia(
  httpClient: HttpClient,
  apiKey: string,
  query: string
): Promise<Pick<MetadataResult, 'mediaId' | 'mediaType'>> {
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=` +
    `${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`

  const response = await httpClient.request({ url, timeoutMs: 15_000 })

  if (!response.ok) {
    throw new YtUtilsError('UPSTREAM_ERROR', `YouTube search failed: HTTP ${response.status}`)
  }

  const payload = response.json as { items?: SearchItem[] }
  const first = payload.items?.[0]?.id
  if (!first) {
    throw new YtUtilsError('NOT_FOUND', 'No YouTube media found for query')
  }

  if (first.videoId) return { mediaId: first.videoId, mediaType: 'video' }
  if (first.playlistId) return { mediaId: first.playlistId, mediaType: 'playlist' }
  if (first.channelId) return { mediaId: first.channelId, mediaType: 'channel' }

  throw new YtUtilsError('PARSING_ERROR', 'Could not parse YouTube search result id')
}

export async function getVideoDetails(
  httpClient: HttpClient,
  apiKey: string,
  videoId: string
): Promise<Partial<MetadataResult>> {
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}` +
    `&key=${encodeURIComponent(apiKey)}`

  const response = await httpClient.request({ url, timeoutMs: 15_000 })

  if (!response.ok) {
    throw new YtUtilsError('UPSTREAM_ERROR', `YouTube videos API failed: HTTP ${response.status}`)
  }

  const payload = response.json as { items?: VideoDetailItem[] }
  const item = payload.items?.[0]
  if (!item) {
    throw new YtUtilsError('NOT_FOUND', `Video details not found for ${videoId}`)
  }

  return {
    title: item.snippet?.title,
    channelTitle: item.snippet?.channelTitle,
    thumbnailUrl: pickThumbnail(item.snippet),
    viewCount: item.statistics?.viewCount,
    likeCount: item.statistics?.likeCount,
  }
}
