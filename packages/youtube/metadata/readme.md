# @ytutils/metadata

Retrieve metadata for YouTube content — videos, playlists, and channels — by
URL or by search query.

## Installation

```bash
npm install @ytutils/metadata
```

## Authentication

Search queries and full video details go through the YouTube Data API, which
requires an API key. Pass it via `options.apiKey` or set the
`YOUTUBE_API_KEY` environment variable (a `.env` file is picked up
automatically under Bun). Get a key from the
[Google Cloud console](https://console.cloud.google.com/apis/library/youtube.googleapis.com).

Parsing a direct URL with `fetchType: 'idOnly'` is local and needs no key.

## Usage

```ts
import { getMetadata } from '@ytutils/metadata'

// Full metadata for a video (requires an API key)
await getMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// {
//   mediaId: 'dQw4w9WgXcQ',
//   mediaType: 'video',
//   durationIso: 'PT3M33S',
//   title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
//   channelTitle: 'Rick Astley',
//   thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
//   viewCount: '1478540522',
//   likeCount: '17094295',
// }

// Only the id and its media type (no API call)
await getMetadata('https://youtu.be/dQw4w9WgXcQ', { fetchType: 'idOnly' })
// { mediaId: 'dQw4w9WgXcQ', mediaType: 'video' }

// Resolve a search query to the top result (requires an API key)
await getMetadata('never gonna give you up', { fetchType: 'idOnly' })
// { mediaId: 'dQw4w9WgXcQ', mediaType: 'video' }
```

`fullData` details are only fetched for videos; playlists and channels return
their id and type.

## API reference

### `getMetadata(input, options?)`

- `input` (string): a YouTube URL (`youtube.com/watch?v=`, `youtu.be/`,
  `playlist?list=`, `channel/` or `@handle`) or a free-text search query.
- `options.fetchType` (`'idOnly' | 'fullData'`, default `'fullData'`):
  `'idOnly'` returns `mediaId` and `mediaType`; `'fullData'` additionally
  fetches the details below for videos.
- `options.apiKey` (string, optional): YouTube Data API key; falls back to the
  `YOUTUBE_API_KEY` environment variable.
- `options.httpClient` (optional): injectable HTTP client implementing the
  `HttpClient` interface from `@ytutils/core`, for testing or proxying.

Returns a `MetadataResult`:

| field          | present on | meaning                                 |
| -------------- | ---------- | --------------------------------------- |
| `mediaId`      | always     | video id, playlist id, or channel id    |
| `mediaType`    | always     | `'video'`, `'playlist'`, or `'channel'` |
| `durationIso`  | videos     | ISO-8601 duration, e.g. `PT3M33S`       |
| `title`        | videos     | video title                             |
| `channelTitle` | videos     | channel that published the video        |
| `thumbnailUrl` | videos     | best available thumbnail                |
| `viewCount`    | videos     | view count as a string                  |
| `likeCount`    | videos     | like count as a string                  |

Thumbnails are resolved in this order, falling back when a size is missing:
`maxres` → `standard` → `high` → `medium` → `default`.

## Errors

Errors are `YtUtilsError` from `@ytutils/core` with a `code`:

| code             | when                                                 |
| ---------------- | ---------------------------------------------------- |
| `INVALID_INPUT`  | unparsable input or missing API key                  |
| `NOT_FOUND`      | no result for the query, or the video has no details |
| `UPSTREAM_ERROR` | the YouTube Data API returned a non-2xx response     |
| `PARSING_ERROR`  | the API response could not be parsed                 |
