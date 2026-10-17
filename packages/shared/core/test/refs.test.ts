import { describe, expect, it } from 'vitest'

import { parseQueryRef, parseVideoId, parseYoutubeRef, YtUtilsError } from '../src/index'

describe('parseYoutubeRef', () => {
  it.each([
    ['dQw4w9WgXcQ', { kind: 'video', id: 'dQw4w9WgXcQ' }],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', { kind: 'video', id: 'dQw4w9WgXcQ' }],
    ['https://youtu.be/dQw4w9WgXcQ', { kind: 'video', id: 'dQw4w9WgXcQ' }],
    ['https://www.youtube.com/playlist?list=PLabc_123', { kind: 'playlist', id: 'PLabc_123' }],
    ['https://www.youtube.com/channel/UCabc123', { kind: 'channel', id: 'UCabc123' }],
    ['https://www.youtube.com/@someone', { kind: 'channel', id: 'someone' }],
  ])('parses %s', (input, expected) => {
    expect(parseYoutubeRef(input)).toEqual(expected)
  })

  it('rejects input that is not a YouTube reference', () => {
    expect(() => parseYoutubeRef('never gonna give you up')).toThrow(YtUtilsError)
  })
})

describe('parseQueryRef', () => {
  it.each([
    ['dQw4w9WgXcQ', { kind: 'video_id', value: 'dQw4w9WgXcQ' }],
    ['https://youtu.be/dQw4w9WgXcQ', { kind: 'video_url', value: 'https://youtu.be/dQw4w9WgXcQ' }],
    ['never gonna give you up', { kind: 'search_query', value: 'never gonna give you up' }],
  ])('classifies %s', (input, expected) => {
    expect(parseQueryRef(input)).toEqual(expected)
  })
})

describe('parseVideoId', () => {
  it('rejects an id that is not 11 URL-safe characters', () => {
    expect(() => parseVideoId('too-short')).toThrow(YtUtilsError)
  })
})
