import { describe, expect, it } from 'vitest'

import { getMostReplayed } from '../src'

describe('getMostReplayed', () => {
  it('uses json markers when available', async () => {
    const result = await getMostReplayed(
      'dQw4w9WgXcQ',
      { parts: 1 },
      {
        getJsonMarkersForVideo: async () => [
          { startMillis: 1000, durationMillis: 1000, intensityScoreNormalized: 1 },
          { startMillis: 2000, durationMillis: 1000, intensityScoreNormalized: 0.5 },
        ],
        getSvgMarkersForVideo: async () => ({ markers: [], durationSec: 0 }),
      }
    )

    expect(result.source).toBe('json')
    expect(result.durationSec).toBe(3)
    expect(result.segments.length).toBe(1)
  })

  it('falls back to svg when allowed and json is empty', async () => {
    const result = await getMostReplayed(
      'dQw4w9WgXcQ',
      { allowSvgFallback: true },
      {
        getJsonMarkersForVideo: async () => [],
        getSvgMarkersForVideo: async () => ({
          durationSec: 10,
          markers: [{ startMillis: 0, durationMillis: 1000, intensityScoreNormalized: 1 }],
        }),
      }
    )

    expect(result.source).toBe('svg')
    expect(result.durationSec).toBe(10)
  })
})
