import { FetchHttpClient, parseQueryRef, parseYoutubeRef, YtUtilsError } from '@ytutils/core'

import type { MetadataOptions, MetadataResult } from '../domain/types'
import { getVideoDetails, searchYoutubeMedia } from '../infra/youtube_api'

function resolveApiKey(apiKey?: string): string {
  const resolved = apiKey ?? process.env.YOUTUBE_API_KEY
  if (!resolved || resolved.trim().length === 0) {
    throw new YtUtilsError(
      'INVALID_INPUT',
      'Missing YouTube API key: pass { apiKey } or set the YOUTUBE_API_KEY environment variable (a .env file is picked up automatically under Bun)'
    )
  }

  return resolved.trim()
}

export async function getMetadata(
  input: string,
  options?: MetadataOptions
): Promise<MetadataResult> {
  const fetchType = options?.fetchType ?? 'fullData'
  const httpClient = options?.httpClient ?? new FetchHttpClient()
  const queryRef = parseQueryRef(input)

  const base =
    queryRef.kind === 'search_query'
      ? await searchYoutubeMedia(httpClient, resolveApiKey(options?.apiKey), queryRef.value)
      : (() => {
          const parsed = parseYoutubeRef(queryRef.value)
          return { mediaId: parsed.id, mediaType: parsed.kind }
        })()

  if (fetchType === 'idOnly') {
    return base
  }

  if (base.mediaType !== 'video') {
    return base
  }

  const details = await getVideoDetails(httpClient, resolveApiKey(options?.apiKey), base.mediaId)
  return { ...base, ...details }
}
