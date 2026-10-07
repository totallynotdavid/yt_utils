# @ytutils/most-replayed

`@ytutils/most-replayed` extracts the most replayed segments of a YouTube video
from the heatmap that the progress bar shows. The JSON strategy reads the watch
page over HTTP; the SVG strategy uses optional headless Chrome.

Two extraction strategies, usable independently:

- **json**: reads heatmap markers from the watch page's player response. Plain
  HTTP, no browser.
- **svg**: renders the watch page in headless Chrome (via the optional peer
  dependency `puppeteer`), hovers the progress bar, and parses the heatmap SVG.

## Use from the workspace

`@ytutils/most-replayed` is not published to npm; use it from the workspace. Use
`@ytutils/most-replayed` from a sibling workspace package. Declare the
dependency as `"@ytutils/most-replayed": "workspace:*"`, then from the
repository root install dependencies and build before running the importing
package. The package exports point at `dist`, so the build is required:

```sh
bun install
bun run build:all
```

`puppeteer` is an optional peer dependency, only needed for the SVG strategy.
The workspace already declares it as a development dependency, so `bun install`
includes it.

## Smallest example

<!-- prettier-ignore -->
```ts
import { getMostReplayed } from '@ytutils/most-replayed'

const result = await getMostReplayed('dQw4w9WgXcQ', { parts: 2 })
console.log(result.source) // 'json'
console.log(result.segments)
// [
//   { position: 1, start: 0, end: 3, score: 0.1446 },
//   { position: 2, start: 44, end: 47, score: 0.0593 },
// ]
```

## Features

- Read markers from watch-page JSON without a browser.
- Read the rendered SVG heatmap through optional Puppeteer.
- Rank the requested number of segments and report their source.
- Inject marker strategies or an HTTP client for tests and proxying.

## API reference

### `getMostReplayed(videoId, options?, deps?)`

- `videoId` (string): an 11-character YouTube video id.
- `options.parts` (positive integer, default `3`): how many top segments to
  return.
- `options.strategy` (`'auto' | 'json' | 'svg'`, default `'auto'`): `'auto'`
  uses json and never falls back unless `allowSvgFallback` is set; `'json'` and
  `'svg'` force one strategy.
- `options.allowSvgFallback` (boolean, default `false`): with `'auto'`, try the
  SVG strategy when the video has no json markers.
- `options.httpClient` (optional): injectable HTTP client implementing the
  `HttpClient` interface from `@ytutils/core`, for testing or proxying.

Returns a `MostReplayedResult`:

| field         | meaning                                                            |
| ------------- | ------------------------------------------------------------------ |
| `videoId`     | the requested video                                                |
| `durationSec` | video length in seconds, derived from the heatmap markers          |
| `source`      | which strategy produced the result: `'json'` or `'svg'`            |
| `segments`    | top segments, ranked: `{ position, start, end, score }` in seconds |

`deps` overrides the marker strategies themselves (`getJsonMarkersForVideo` /
`getSvgMarkersForVideo`), which is how the tests inject fixtures.

## Errors

Errors are `YtUtilsError` from `@ytutils/core` with a `code`:

| code                 | when                                                          |
| -------------------- | ------------------------------------------------------------- |
| `INVALID_INPUT`      | not a video id, bad `parts`, or unknown `strategy`            |
| `NOT_FOUND`          | no heatmap markers were found through the selected strategies |
| `TIMEOUT`            | SVG strategy: the watch page or heatmap didn't load in time   |
| `DEPENDENCY_MISSING` | SVG strategy: Chrome could not be launched                    |
| `UPSTREAM_ERROR`     | SVG strategy: the page could not be captured                  |

The SVG strategy fails with `MissingPuppeteerError` (not a `YtUtilsError`) when
`puppeteer` is not installed. On systems where Chrome's sandbox cannot start
(e.g. Ubuntu 23.10+ with restricted user namespaces), the launch is retried
without the sandbox automatically.

## Links

- [Architecture](../../../architecture.md)
- [Documentation index](../../../docs/readme.md)
- [Source](./src/index.ts)
