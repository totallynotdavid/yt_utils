import { describe, expect, it } from 'vitest'

import { YtUtilsError } from '@ytutils/core'

import { defaultVideoProcessorConfig } from '../../src/domain/config'
import { normalizeProcessVideoRequest } from '../../src/domain/normalize'

const videoId = 'dQw4w9WgXcQ'

describe('normalizeProcessVideoRequest', () => {
  it('parses and validates a well-formed audio request', () => {
    const result = normalizeProcessVideoRequest({
      videoId,
      format: 'opus',
      outputDir: '/tmp/out',
    })

    expect(result).toEqual({
      videoId,
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
    const result = normalizeProcessVideoRequest({ videoId, format: 'mp4' })

    expect(result.kind).toBe('video')
    expect(result.format).toBe('mp4')
    expect(result.quality).toBe('best')
  })

  it('looks up videoSizeMb only for video kind', () => {
    const videoResult = normalizeProcessVideoRequest({
      videoId,
      format: 'mp4',
      videoSize: 'medium',
    })
    expect(videoResult.videoSizeMb).toBe(50)

    const audioResult = normalizeProcessVideoRequest({
      videoId,
      format: 'opus',
      videoSize: 'medium',
    })
    expect(audioResult.videoSizeMb).toBeUndefined()
  })

  it('falls back to configured defaults when fields are omitted', () => {
    const result = normalizeProcessVideoRequest(
      { videoId },
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
    const result = normalizeProcessVideoRequest({ videoId, outputDir: '   ' })

    expect(result.outputDir).toBe('media')
  })

  it('rejects an unknown format', () => {
    expect(() =>
      normalizeProcessVideoRequest({
        videoId,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        format: 'xyz' as unknown as 'opus',
      })
    ).toThrow(YtUtilsError)
  })

  it.each([
    ['an invalid videoId', { videoId: 'not-a-real-id' }, /Invalid YouTube video id/u],
    ['a negative startTimeSec', { videoId, startTimeSec: -1 }, /startTimeSec/u],
    ['a NaN startTimeSec', { videoId, startTimeSec: Number.NaN }, /startTimeSec/u],
    ['a zero endTimeSec', { videoId, endTimeSec: 0 }, /endTimeSec/u],
    ['an infinite endTimeSec', { videoId, endTimeSec: Number.POSITIVE_INFINITY }, /endTimeSec/u],
    [
      'startTimeSec equal to endTimeSec',
      { videoId, startTimeSec: 10, endTimeSec: 10 },
      /lower than endTimeSec/u,
    ],
    [
      'startTimeSec after endTimeSec',
      { videoId, startTimeSec: 20, endTimeSec: 10 },
      /lower than endTimeSec/u,
    ],
  ])('rejects %s', (_name, request, message) => {
    expect(() => normalizeProcessVideoRequest(request)).toThrow(message)
  })

  it('accepts a half-open range with only one bound set', () => {
    const fromStart = normalizeProcessVideoRequest({ videoId, startTimeSec: 30 })
    expect(fromStart.startTimeSec).toBe(30)
    expect(fromStart.endTimeSec).toBeUndefined()

    const toEnd = normalizeProcessVideoRequest({ videoId, endTimeSec: 60 })
    expect(toEnd.startTimeSec).toBeUndefined()
    expect(toEnd.endTimeSec).toBe(60)
  })
})
