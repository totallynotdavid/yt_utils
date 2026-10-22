import { afterEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient, HttpRequest, HttpResponse } from '@ytutils/core'

import { formatClock, getMetadata } from '../src'

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

function videoResponse(durationIso: string): HttpResponse {
  return jsonResponse({
    items: [{ contentDetails: { duration: durationIso }, snippet: {}, statistics: {} }],
  })
}

describe('getMetadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

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
            contentDetails: { duration: 'PT3M33S' },
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
      durationIso: 'PT3M33S',
      durationSeconds: 213,
      title: 'Never Gonna Give You Up',
      channelTitle: 'Rick Astley',
      thumbnailUrl: 'https://img.test/high.jpg',
      viewCount: '42',
      likeCount: '10',
    })
  })

  it('throws INVALID_INPUT when API key is missing for search queries', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', '')

    await expect(getMetadata('some search query')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it.each([
    ['hours, minutes and seconds', 'PT1H2M3S', 3723],
    ['hours and seconds only', 'PT1H30S', 3630],
    ['minutes only', 'PT5M', 300],
    ['seconds only', 'PT45S', 45],
    ['days and hours', 'P1DT2H', 93_600],
    ['a day only', 'P1D', 86_400],
    ['a live stream placeholder', 'P0D', 0],
  ])('parses durationIso with %s', async (_name, durationIso, durationSeconds) => {
    const result = await getMetadata('dQw4w9WgXcQ', {
      apiKey: 'test-key',
      httpClient: new FakeHttpClient([videoResponse(durationIso)]),
    })

    expect(result).toMatchObject({ durationIso, durationSeconds })
  })

  it.each([
    ['a clock string', '3:33'],
    ['an empty string', ''],
    ['no component', 'P'],
    ['an empty time part', 'PT'],
    ['a dangling time designator', 'P1DT'],
    ['a number without a unit', 'PT1'],
    ['units out of order', 'PT5S1M'],
    ['fractional seconds', 'PT1.5S'],
  ])('throws PARSING_ERROR for %s', async (_name, durationIso) => {
    await expect(
      getMetadata('dQw4w9WgXcQ', {
        apiKey: 'test-key',
        httpClient: new FakeHttpClient([videoResponse(durationIso)]),
      })
    ).rejects.toMatchObject({ code: 'PARSING_ERROR' })
  })

  it('omits duration fields when the video has no duration', async () => {
    const result = await getMetadata('dQw4w9WgXcQ', {
      apiKey: 'test-key',
      httpClient: new FakeHttpClient([jsonResponse({ items: [{ snippet: { title: 'Live' } }] })]),
    })

    expect(result.durationIso).toBeUndefined()
    expect(result.durationSeconds).toBeUndefined()
  })

  it('returns no duration for a playlist', async () => {
    const result = await getMetadata('https://www.youtube.com/playlist?list=PLabcdefghijk', {
      apiKey: 'test-key',
      httpClient: new FakeHttpClient([]),
    })

    expect(result).toEqual({ mediaId: 'PLabcdefghijk', mediaType: 'playlist' })
  })
})

describe('formatClock', () => {
  it.each([
    ['seconds only', 7, '00:07'],
    ['minutes and seconds', 213, '03:33'],
    ['exactly one hour', 3600, '01:00:00'],
    ['hours, minutes and seconds', 3723, '01:02:03'],
    ['more than 99 hours', 360_000, '100:00:00'],
    ['fractional seconds are floored', 59.9, '00:59'],
    ['negative values clamp to zero', -5, '00:00'],
  ])('formats %s', (_name, seconds, clock) => {
    expect(formatClock(seconds)).toBe(clock)
  })

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('throws INVALID_INPUT for %s', (_name, seconds) => {
    expect(() => formatClock(seconds)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
  })
})
