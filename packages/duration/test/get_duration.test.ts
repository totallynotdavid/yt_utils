import { describe, expect, it } from 'vitest'

import type { HttpClient, HttpRequest, HttpResponse } from '@ytutils/core'

import { getDuration } from '../src'

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

describe('getDuration', () => {
  it('returns clock format by default', async () => {
    const client = new FakeHttpClient([
      jsonResponse({
        items: [
          {
            contentDetails: { duration: 'PT1H30S' },
            snippet: {},
            statistics: {},
          },
        ],
      }),
    ])

    const result = await getDuration('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      apiKey: 'test-key',
      httpClient: client,
    })

    expect(result).toBe('01:00:30')
  })

  it('returns seconds format when requested', async () => {
    const client = new FakeHttpClient([
      jsonResponse({
        items: [
          {
            contentDetails: { duration: 'PT3M33S' },
            snippet: {},
            statistics: {},
          },
        ],
      }),
    ])

    const result = await getDuration('dQw4w9WgXcQ', {
      format: 'seconds',
      apiKey: 'test-key',
      httpClient: client,
    })

    expect(result).toBe(213)
  })
})
