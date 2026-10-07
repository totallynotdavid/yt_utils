# @ytutils/core

`@ytutils/core` provides shared errors, HTTP contracts, and YouTube reference
parsers for the other `yt_utils` packages. Metadata and media packages own API
requests and external media programs.

## Use from the workspace

`@ytutils/core` is not published to npm; use it from the workspace. Use
`@ytutils/core` from a sibling workspace package. Declare the dependency as
`"@ytutils/core": "workspace:*"`, then from the repository root install
dependencies and build before running the importing package. The package exports
point at `dist`, so the build is required:

```sh
bun install
bun run build:all
```

## Smallest example

Parse a video ID without a network request:

<!-- prettier-ignore -->
```ts
import { parseVideoId } from '@ytutils/core'

parseVideoId('dQw4w9WgXcQ') // 'dQw4w9WgXcQ'
```

## Features

- `parseVideoId` validates 11-character YouTube video IDs.
- `parseYoutubeRef` recognizes video IDs, `youtube.com/watch?v=`, `youtu.be/`,
  `playlist?list=`, `channel/`, and `@handle` references.
- `parseQueryRef` distinguishes direct video references from free-text search
  queries.
- `YtUtilsError` carries the shared error code union.
- `HttpClient`, `HttpRequest`, and `HttpResponse` define injectable HTTP
  contracts. `FetchHttpClient` uses `fetch` and a 15-second default timeout.

## Links

- [Architecture](../../../architecture.md)
- [Documentation index](../../../docs/readme.md)
- [Source](./src/index.ts)
