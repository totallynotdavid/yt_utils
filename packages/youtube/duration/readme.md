# @ytutils/duration

Fetch the length of a YouTube video, in the unit you need: seconds, minutes,
hours, or a `MM:SS` / `HH:MM:SS` clock string.

## Installation

```bash
npm install @ytutils/duration
```

## Authentication

`getDuration` resolves the video through the YouTube Data API, which requires
an API key. Pass it via `options.apiKey` or set the `YOUTUBE_API_KEY`
environment variable (a `.env` file is picked up automatically under Bun). Get
a key from the [Google Cloud console](https://console.cloud.google.com/apis/library/youtube.googleapis.com).

## Usage

```ts
import { getDuration } from '@ytutils/duration'

// Default format is 'clock'
await getDuration('dQw4w9WgXcQ') // '03:33'
await getDuration('https://www.youtube.com/watch?v=dQw4w9WgXcQ') // '03:33'

// Or pick the unit
await getDuration('dQw4w9WgXcQ', { format: 'seconds' }) // 213
await getDuration('dQw4w9WgXcQ', { format: 'minutes' }) // 3.55
await getDuration('dQw4w9WgXcQ', { format: 'hours' }) // 0.059166...
```

## API reference

### `getDuration(input, options?)`

- `input` (string): an 11-character video id, a `youtube.com/watch?v=` URL, or
  a `youtu.be/` URL.
- `options.format` (`'seconds' | 'minutes' | 'hours' | 'clock'`, default
  `'clock'`): which unit to return. `'clock'` returns `MM:SS`, or `HH:MM:SS`
  for videos of an hour or longer.
- `options.apiKey` (string, optional): YouTube Data API key; falls back to the
  `YOUTUBE_API_KEY` environment variable.
- `options.httpClient` (optional): injectable HTTP client implementing the
  `HttpClient` interface from `@ytutils/core`, for testing or proxying.

Returns the duration in the requested format: a `number` for
`seconds`/`minutes`/`hours`, a `string` for `clock`.

## Errors

Errors are `YtUtilsError` from `@ytutils/core` with a `code`:

| code             | when                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| `INVALID_INPUT`  | not a video id/URL, the input is not a video, or the API key is missing |
| `NOT_FOUND`      | the video has no duration metadata                                      |
| `UPSTREAM_ERROR` | the YouTube Data API returned a non-2xx response                        |
| `PARSING_ERROR`  | the API returned an unparseable ISO-8601 duration                       |
