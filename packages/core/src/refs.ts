import { assertNonEmptyString, YtUtilsError } from './errors'

export type MediaKind = 'video' | 'playlist' | 'channel'

export type VideoRef = { kind: 'video_id'; value: string } | { kind: 'video_url'; value: string }

export type QueryRef = VideoRef | { kind: 'search_query'; value: string }

export type ParsedYoutubeRef =
  | { kind: 'video'; id: string }
  | { kind: 'playlist'; id: string }
  | { kind: 'channel'; id: string }

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/u
const VIDEO_URL_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/u
const PLAYLIST_URL_RE = /[?&]list=([A-Za-z0-9_-]+)/u
const CHANNEL_URL_RE = /youtube\.com\/(?:channel\/|@)([A-Za-z0-9_-]+)/u

export function parseVideoId(input: string): string {
  const value = assertNonEmptyString(input, 'videoId')
  if (!VIDEO_ID_RE.test(value)) {
    throw new YtUtilsError('INVALID_INPUT', `Invalid YouTube video id: ${value}`)
  }

  return value
}

export function parseYoutubeRef(input: string): ParsedYoutubeRef {
  const value = assertNonEmptyString(input, 'input')

  if (VIDEO_ID_RE.test(value)) {
    return { kind: 'video', id: value }
  }

  const videoMatch = value.match(VIDEO_URL_RE)
  if (videoMatch?.[1]) {
    return { kind: 'video', id: videoMatch[1] }
  }

  const playlistMatch = value.match(PLAYLIST_URL_RE)
  if (playlistMatch?.[1]) {
    return { kind: 'playlist', id: playlistMatch[1] }
  }

  const channelMatch = value.match(CHANNEL_URL_RE)
  if (channelMatch?.[1]) {
    return { kind: 'channel', id: channelMatch[1] }
  }

  throw new YtUtilsError('INVALID_INPUT', `Input is not a supported YouTube ref: ${value}`)
}

export function parseQueryRef(input: string): QueryRef {
  const value = assertNonEmptyString(input, 'query')

  try {
    const ref = parseYoutubeRef(value)
    if (ref.kind === 'video') {
      if (VIDEO_ID_RE.test(value)) {
        return { kind: 'video_id', value: ref.id }
      }

      return { kind: 'video_url', value }
    }

    return { kind: 'video_url', value }
  } catch {
    return { kind: 'search_query', value }
  }
}
