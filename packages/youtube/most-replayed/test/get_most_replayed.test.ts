import { describe, expect, it } from 'vitest'
import type { HttpClient } from '@ytutils/core'

import { getMostReplayed } from '../src'

function watchPageClient(html: string, requestedUrls: string[] = []): HttpClient {
  return {
    async request(req) {
      requestedUrls.push(req.url)
      return { status: 200, ok: true, text: html, json: null }
    },
  }
}

function watchPageWithMarkers(markers: Array<{ startMillis: string; durationMillis: string }>) {
  const payload = {
    frameworkUpdates: {
      entityBatchUpdate: {
        mutations: [
          {
            payload: {
              macroMarkersListEntity: {
                markersList: {
                  markerType: 'MARKER_TYPE_HEATMAP',
                  markers: markers.map((marker, index) => ({
                    ...marker,
                    heatMarkerIntensityScoreNormalized: 1 - index / 2,
                  })),
                },
              },
            },
          },
        ],
      },
    },
  }
  return `<script>var ytInitialPlayerResponse = ${JSON.stringify(payload)};</script>`
}

const noMarkersPage = '<html><script>var ytInitialPlayerResponse = {};</script></html>'

const svgMarkers = {
  durationSec: 10,
  markers: [{ startMillis: 0, durationMillis: 1000, intensityScoreNormalized: 1 }],
}

describe('getMostReplayed', () => {
  it('extracts json markers from the watch page fetched through the http client', async () => {
    const requestedUrls: string[] = []
    const httpClient = watchPageClient(
      watchPageWithMarkers([
        { startMillis: '1000', durationMillis: '1000' },
        { startMillis: '2000', durationMillis: '1000' },
      ]),
      requestedUrls
    )

    const result = await getMostReplayed('dQw4w9WgXcQ', { parts: 1, httpClient })

    expect(requestedUrls).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'])
    expect(result.source).toBe('json')
    expect(result.durationSec).toBe(3)
    expect(result.segments).toHaveLength(1)
  })

  it('falls back to svg when allowed and the page has no json markers', async () => {
    const result = await getMostReplayed(
      'dQw4w9WgXcQ',
      { allowSvgFallback: true, httpClient: watchPageClient(noMarkersPage) },
      { getSvgMarkersForVideo: async () => svgMarkers }
    )

    expect(result.source).toBe('svg')
    expect(result.durationSec).toBe(10)
  })

  it('uses svg without reading the watch page when strategy is svg', async () => {
    const requestedUrls: string[] = []
    const result = await getMostReplayed(
      'dQw4w9WgXcQ',
      { strategy: 'svg', httpClient: watchPageClient(noMarkersPage, requestedUrls) },
      { getSvgMarkersForVideo: async () => svgMarkers }
    )

    expect(result.source).toBe('svg')
    expect(requestedUrls).toEqual([])
  })

  it.each([
    ['strategy is json', { strategy: 'json' }],
    ['auto is used and svg fallback is disabled', {}],
  ] as const)('throws NOT_FOUND when %s and the page has no markers', async (_name, options) => {
    await expect(
      getMostReplayed('dQw4w9WgXcQ', { ...options, httpClient: watchPageClient(noMarkersPage) })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
