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

function videoResponse(durationIso: string): HttpResponse {
  const payload = {
    items: [{ contentDetails: { duration: durationIso }, snippet: {}, statistics: {} }],
  }
  return { status: 200, ok: true, text: JSON.stringify(payload), json: payload }
}

describe('getDuration', () => {
  it.each([
    [
      'clock by default',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      undefined,
      'PT1H30S',
      '01:00:30',
    ],
    ['seconds when requested', 'dQw4w9WgXcQ', 'seconds', 'PT3M33S', 213],
  ] as const)('returns %s', async (_name, input, format, durationIso, expected) => {
    const result = await getDuration(input, {
      format,
      apiKey: 'test-key',
      httpClient: new FakeHttpClient([videoResponse(durationIso)]),
    })

    expect(result).toBe(expected)
  })
})
