import type { HttpClient } from '@ytutils/core'
import { YtUtilsError } from '@ytutils/core'

import type { MetadataResult, SearchItem, VideoDetailItem } from '../domain/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

// Pull the first item out of an `items: unknown[]`-shaped payload, or
// `undefined` if the payload is missing/empty.
function pickFirstItem(json: unknown): Record<string, unknown> | undefined {
  if (!isRecord(json)) return undefined
  const items = json['items']
  if (!Array.isArray(items) || items.length === 0) return undefined
  const first: unknown = items[0]
  return isRecord(first) ? first : undefined
}

function pickFirstSearchId(json: unknown): SearchItem['id'] | undefined {
  const first = pickFirstItem(json)
  if (first === undefined) return undefined
  const id = first['id']
  if (!isRecord(id)) return undefined
  return {
    videoId: typeof id['videoId'] === 'string' ? id['videoId'] : undefined,
    playlistId: typeof id['playlistId'] === 'string' ? id['playlistId'] : undefined,
    channelId: typeof id['channelId'] === 'string' ? id['channelId'] : undefined,
  }
}

type VideoThumbnails = NonNullable<NonNullable<VideoDetailItem['snippet']>['thumbnails']>

function parseThumbnails(value: unknown): VideoThumbnails | undefined {
  if (!isRecord(value)) return undefined
  const out: VideoThumbnails = {}
  let populated = false
  for (const [key, raw] of Object.entries(value)) {
    if (isRecord(raw) && typeof raw['url'] === 'string') {
      out[key] = { url: raw['url'] }
      populated = true
    }
  }
  return populated ? out : undefined
}

function parseSnippet(value: unknown): VideoDetailItem['snippet'] | undefined {
  if (!isRecord(value)) return undefined
  return {
    title: typeof value['title'] === 'string' ? value['title'] : undefined,
    channelTitle: typeof value['channelTitle'] === 'string' ? value['channelTitle'] : undefined,
    ...(parseThumbnails(value['thumbnails']) !== undefined
      ? { thumbnails: parseThumbnails(value['thumbnails']) }
      : {}),
  }
}

function parseContentDetails(value: unknown): VideoDetailItem['contentDetails'] | undefined {
  if (!isRecord(value)) return undefined
  return {
    duration: typeof value['duration'] === 'string' ? value['duration'] : undefined,
  }
}

function parseStatistics(value: unknown): VideoDetailItem['statistics'] | undefined {
  if (!isRecord(value)) return undefined
  return {
    viewCount: typeof value['viewCount'] === 'string' ? value['viewCount'] : undefined,
    likeCount: typeof value['likeCount'] === 'string' ? value['likeCount'] : undefined,
  }
}

function pickFirstVideoDetail(json: unknown): VideoDetailItem | undefined {
  const first = pickFirstItem(json)
  if (first === undefined) return undefined

  const item: VideoDetailItem = {}
  const snippet = parseSnippet(first['snippet'])
  const contentDetails = parseContentDetails(first['contentDetails'])
  const statistics = parseStatistics(first['statistics'])
  if (snippet !== undefined) item.snippet = snippet
  if (contentDetails !== undefined) item.contentDetails = contentDetails
  if (statistics !== undefined) item.statistics = statistics
  return item
}

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

  const first = pickFirstSearchId(response.json)
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
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(videoId)}` +
    `&key=${encodeURIComponent(apiKey)}`

  const response = await httpClient.request({ url, timeoutMs: 15_000 })

  if (!response.ok) {
    throw new YtUtilsError('UPSTREAM_ERROR', `YouTube videos API failed: HTTP ${response.status}`)
  }

  const item = pickFirstVideoDetail(response.json)
  if (!item) {
    throw new YtUtilsError('NOT_FOUND', `Video details not found for ${videoId}`)
  }

  return {
    durationIso: item.contentDetails?.duration,
    title: item.snippet?.title,
    channelTitle: item.snippet?.channelTitle,
    thumbnailUrl: pickThumbnail(item.snippet),
    viewCount: item.statistics?.viewCount,
    likeCount: item.statistics?.likeCount,
  }
}
