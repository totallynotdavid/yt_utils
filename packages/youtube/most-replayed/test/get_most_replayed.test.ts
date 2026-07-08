import { describe, expect, it } from 'vitest'
import type { HttpClient } from '@ytutils/core'

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

  it('uses the provided http client for default json extraction', async () => {
    const html = `<script>var ytInitialPlayerResponse = ${JSON.stringify({
      frameworkUpdates: {
        entityBatchUpdate: {
          mutations: [
            {
              payload: {
                macroMarkersListEntity: {
                  markersList: {
                    markerType: 'MARKER_TYPE_HEATMAP',
                    markers: [
                      {
                        startMillis: '1000',
                        durationMillis: '1000',
                        heatMarkerIntensityScoreNormalized: 1,
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    })};</script>`
    const requestedUrls: string[] = []
    const httpClient: HttpClient = {
      async request(req) {
        requestedUrls.push(req.url)
        return {
          status: 200,
          ok: true,
          text: html,
          json: null,
        }
      },
    }

    const result = await getMostReplayed('dQw4w9WgXcQ', { parts: 1, httpClient })

    expect(requestedUrls).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'])
    expect(result.source).toBe('json')
    expect(result.durationSec).toBe(2)
  })

  it('throws NOT_FOUND when strategy=json and no markers', async () => {
    await expect(
      getMostReplayed(
        'dQw4w9WgXcQ',
        { strategy: 'json' },
        {
          getJsonMarkersForVideo: async () => [],
          getSvgMarkersForVideo: async () => ({ markers: [], durationSec: 0 }),
        }
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('throws NOT_FOUND when auto and svg fallback is disabled', async () => {
    await expect(
      getMostReplayed(
        'dQw4w9WgXcQ',
        {},
        {
          getJsonMarkersForVideo: async () => [],
          getSvgMarkersForVideo: async () => ({ markers: [], durationSec: 0 }),
        }
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
