import { describe, expect, it } from 'vitest'

import { YtUtilsError } from '@ytutils/core'

import { defaultVideoProcessorConfig } from '../../src/domain/config'
import { normalizeProcessVideoRequest } from '../../src/domain/normalize'

describe('normalizeProcessVideoRequest', () => {
  it('parses and validates a well-formed audio request', () => {
    const result = normalizeProcessVideoRequest({
      videoId: 'dQw4w9WgXcQ',
      format: 'opus',
      outputDir: '/tmp/out',
    })

    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      kind: 'audio',
      format: 'opus',
      quality: 'best',
      outputDir: '/tmp/out',
      startTimeSec: undefined,
      endTimeSec: undefined,
      videoSizeMb: undefined,
    })
  })

  it('derives kind from a video format', () => {
    const result = normalizeProcessVideoRequest({
      videoId: 'dQw4w9WgXcQ',
      format: 'mp4',
    })

    expect(result.kind).toBe('video')
    expect(result.format).toBe('mp4')
    expect(result.quality).toBe('best')
  })

  it('looks up videoSizeMb only for video kind', () => {
    const videoResult = normalizeProcessVideoRequest({
      videoId: 'dQw4w9WgXcQ',
      format: 'mp4',
      videoSize: 'medium',
    })
    expect(videoResult.videoSizeMb).toBe(50)

    const audioResult = normalizeProcessVideoRequest({
      videoId: 'dQw4w9WgXcQ',
      format: 'opus',
      videoSize: 'medium',
    })
    expect(audioResult.videoSizeMb).toBeUndefined()
  })

  it('falls back to configured defaults when fields are omitted', () => {
    const result = normalizeProcessVideoRequest(
      { videoId: 'dQw4w9WgXcQ' },
      {
        ...defaultVideoProcessorConfig,
        defaults: { ...defaultVideoProcessorConfig.defaults, audioFormat: 'mp3' },
      }
    )

    expect(result.format).toBe('mp3')
    expect(result.kind).toBe('audio')
    expect(result.outputDir).toBe('media')
  })

  it('treats a blank outputDir as missing and uses the default', () => {
    const result = normalizeProcessVideoRequest({ videoId: 'dQw4w9WgXcQ', outputDir: '   ' })

    expect(result.outputDir).toBe('media')
  })

  it('rejects an unknown format', () => {
    expect(() =>
      normalizeProcessVideoRequest({
        videoId: 'dQw4w9WgXcQ',
        format: 'xyz' as unknown as 'opus',
      })
    ).toThrow(YtUtilsError)
  })

  it('rejects an invalid videoId', () => {
    expect(() => normalizeProcessVideoRequest({ videoId: 'not-a-real-id' })).toThrow(YtUtilsError)
  })

  it('rejects a non-finite or negative startTimeSec', () => {
    expect(() =>
      normalizeProcessVideoRequest({ videoId: 'dQw4w9WgXcQ', startTimeSec: -1 })
    ).toThrow(/startTimeSec/u)

    expect(() =>
      normalizeProcessVideoRequest({ videoId: 'dQw4w9WgXcQ', startTimeSec: Number.NaN })
    ).toThrow(/startTimeSec/u)
  })

  it('rejects a non-positive or non-finite endTimeSec', () => {
    expect(() => normalizeProcessVideoRequest({ videoId: 'dQw4w9WgXcQ', endTimeSec: 0 })).toThrow(
      /endTimeSec/u
    )

    expect(() =>
      normalizeProcessVideoRequest({ videoId: 'dQw4w9WgXcQ', endTimeSec: Number.POSITIVE_INFINITY })
    ).toThrow(/endTimeSec/u)
  })

  it('rejects startTimeSec >= endTimeSec', () => {
    expect(() =>
      normalizeProcessVideoRequest({
        videoId: 'dQw4w9WgXcQ',
        startTimeSec: 10,
        endTimeSec: 10,
      })
    ).toThrow(/lower than endTimeSec/u)

    expect(() =>
      normalizeProcessVideoRequest({
        videoId: 'dQw4w9WgXcQ',
        startTimeSec: 20,
        endTimeSec: 10,
      })
    ).toThrow(/lower than endTimeSec/u)
  })

  it('accepts a half-open range with only one bound set', () => {
    const fromStart = normalizeProcessVideoRequest({
      videoId: 'dQw4w9WgXcQ',
      startTimeSec: 30,
    })
    expect(fromStart.startTimeSec).toBe(30)
    expect(fromStart.endTimeSec).toBeUndefined()

    const toEnd = normalizeProcessVideoRequest({
      videoId: 'dQw4w9WgXcQ',
      endTimeSec: 60,
    })
    expect(toEnd.startTimeSec).toBeUndefined()
    expect(toEnd.endTimeSec).toBe(60)
  })
})
