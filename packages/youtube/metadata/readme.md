# @ytutils/metadata

`@ytutils/metadata` resolves YouTube video, playlist, and channel references by
URL or search query, then optionally retrieves full video details. It uses the
YouTube Data API for search and details; direct `idOnly` URL parsing stays
local.

## Use from the workspace

Use `@ytutils/metadata` from a sibling workspace package. Declare the dependency
as `"@ytutils/metadata": "workspace:*"`, then from the repository root install
dependencies and build before running the importing package. The package exports
point at `dist`, so the build is required:

```sh
bun run setup
bun run build
```

## Authentication

Search queries and full video details go through the YouTube Data API, which
requires an API key. Pass it via `options.apiKey` or set the `YOUTUBE_API_KEY`
environment variable (a `.env` file is picked up automatically under Bun). Get a
key from the
[Google Cloud console](https://console.cloud.google.com/apis/library/youtube.googleapis.com).

Parsing a direct URL with `fetchType: 'idOnly'` is local and needs no key.

## Smallest example

<!-- prettier-ignore -->
```ts
import { getMetadata } from '@ytutils/metadata'

// Full metadata for a video (requires an API key)
await getMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// {
//   mediaId: 'dQw4w9WgXcQ',
//   mediaType: 'video',
//   durationIso: 'PT3M33S',
//   durationSeconds: 213,
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

## Print a video's duration

```ts
import { formatClock, getMetadata } from '@ytutils/metadata'

const video = await getMetadata('dQw4w9WgXcQ')

if (video.durationSeconds === undefined) {
  console.log('no duration') // the API returned none for this video
} else {
  console.log(formatClock(video.durationSeconds)) // 03:33
}
```

`formatClock(seconds)` returns `MM:SS`, or `HH:MM:SS` from one hour up.
`durationSeconds` is the number of seconds in `durationIso`.

## Features

- Resolve video IDs, supported URLs, playlists, channels, and search queries.
- Return IDs and media types without an API call for direct `idOnly` URLs.
- Fetch video duration (ISO-8601 and seconds), title, channel, thumbnail, view
  count, and like count.
- Fall back through the available thumbnail sizes.

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

| field             | present on | meaning                                 |
| ----------------- | ---------- | --------------------------------------- |
| `mediaId`         | always     | video id, playlist id, or channel id    |
| `mediaType`       | always     | `'video'`, `'playlist'`, or `'channel'` |
| `durationIso`     | videos     | ISO-8601 duration, e.g. `PT3M33S`       |
| `durationSeconds` | videos     | `durationIso` in seconds, e.g. `213`    |
| `title`           | videos     | video title                             |
| `channelTitle`    | videos     | channel that published the video        |
| `thumbnailUrl`    | videos     | best available thumbnail                |
| `viewCount`       | videos     | view count as a string                  |
| `likeCount`       | videos     | like count as a string                  |

The duration fields are absent when the API returns no duration for the video.

### `formatClock(seconds)`

Returns `seconds` as `MM:SS`, or `HH:MM:SS` from one hour up. Fractions are
floored and negative values count as zero. `NaN` and infinite values throw
`INVALID_INPUT`.

Thumbnails are resolved in this order, falling back when a size is missing:
`maxres` → `standard` → `high` → `medium` → `default`.

## Errors

Errors are `YtUtilsError` from `@ytutils/core` with a `code`:

| code             | when                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `INVALID_INPUT`  | unparsable input, missing API key, or non-finite `formatClock` input |
| `NOT_FOUND`      | no result for the query, or the video has no details                 |
| `UPSTREAM_ERROR` | the YouTube Data API returned a non-2xx response                     |
| `PARSING_ERROR`  | the API response or its ISO-8601 duration is invalid                 |

## Links

- [Architecture](../../../architecture.md)
- [Documentation index](../../../docs/readme.md)
- [Source](./src/index.ts)
