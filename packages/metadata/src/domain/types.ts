import type { HttpClient } from '@ytutils/core'

export type FetchType = 'idOnly' | 'fullData'

export type MetadataInput = string

export type MetadataResult = {
  mediaId: string
  mediaType: 'video' | 'playlist' | 'channel'
  durationIso?: string
  title?: string
  channelTitle?: string
  thumbnailUrl?: string
  viewCount?: string
  likeCount?: string
}

export type MetadataOptions = {
  fetchType?: FetchType
  apiKey?: string
  httpClient?: HttpClient
}

export type SearchItem = {
  id?: {
    videoId?: string
    playlistId?: string
    channelId?: string
  }
}

export type VideoDetailItem = {
  snippet?: {
    title?: string
    channelTitle?: string
    thumbnails?: Record<string, { url?: string }>
  }
  contentDetails?: {
    duration?: string
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
  }
}
