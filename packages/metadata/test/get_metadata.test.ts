import { describe, expect, it } from 'vitest'

import type { HttpClient, HttpRequest, HttpResponse } from '@ytutils/core'

import { getMetadata } from '../src'

class FakeHttpClient implements HttpClient {
  constructor(private readonly queue: HttpResponse[]) {}

  async request(_req: HttpRequest): Promise<HttpResponse> {
    const next = this.queue.shift()
    if (!next) {
      throw new Error('No fake response left')
    }

    return next
  }
}

function jsonResponse(payload: unknown): HttpResponse {
  return {
    status: 200,
    ok: true,
    text: JSON.stringify(payload),
    json: payload,
  }
}

describe('getMetadata', () => {
  it('returns idOnly for direct video url', async () => {
    const result = await getMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      fetchType: 'idOnly',
    })

    expect(result).toEqual({ mediaId: 'dQw4w9WgXcQ', mediaType: 'video' })
  })

  it('resolves search query then fetches video details', async () => {
    const client = new FakeHttpClient([
      jsonResponse({ items: [{ id: { videoId: 'dQw4w9WgXcQ' } }] }),
      jsonResponse({
        items: [
          {
            snippet: {
              title: 'Never Gonna Give You Up',
              channelTitle: 'Rick Astley',
              thumbnails: { high: { url: 'https://img.test/high.jpg' } },
            },
            statistics: { viewCount: '42', likeCount: '10' },
          },
        ],
      }),
    ])

    const result = await getMetadata('never gonna give you up', {
      apiKey: 'test-key',
      httpClient: client,
    })

    expect(result).toEqual({
      mediaId: 'dQw4w9WgXcQ',
      mediaType: 'video',
      title: 'Never Gonna Give You Up',
      channelTitle: 'Rick Astley',
      thumbnailUrl: 'https://img.test/high.jpg',
      viewCount: '42',
      likeCount: '10',
    })
  })

  it('throws INVALID_INPUT when API key is missing for search queries', async () => {
    await expect(getMetadata('some search query')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })
})
