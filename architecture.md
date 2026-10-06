# Architecture

`yt_utils` is a workspace of small YouTube-facing packages. Each package owns
one boundary: parsing, API lookup, replay extraction, media processing, or
chunking. The public entry point for a package is its `src/index.ts`; the
package README owns its caller-facing contract.

Owner: `@totallynotdavid`

## Workspace map

| Area                               | Responsibility                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/shared/core`             | Shared `YtUtilsError`, HTTP client contracts, and YouTube reference parsing.                                |
| `packages/youtube/metadata`        | Resolves direct references or search queries, then reads video details from the YouTube Data API.           |
| `packages/youtube/duration`        | Uses metadata video details and converts ISO-8601 duration into seconds, minutes, hours, or a clock string. |
| `packages/youtube/most-replayed`   | Gets replay markers from the watch-page JSON or from a headless Chrome SVG capture, then ranks segments.    |
| `packages/youtube/video-processor` | Normalizes one processing request, invokes `yt-dlp`, and converts the result with `ffmpeg` when needed.     |
| `packages/youtube/video-chunker`   | Downloads one URL, probes its media, and splits it with `ffmpeg`'s segment muxer.                           |
| `apps/video-chunker-cli`           | Parses CLI arguments and formats the chunk workflow's progress and summary.                                 |
| `tools/most-replayed-maintainer`   | Private snapshot, comparison, diagnostics, and reliability helpers for replay extraction.                   |

## Dependency direction

```text
@ytutils/core
├── @ytutils/metadata
│   └── @ytutils/duration
├── @ytutils/most-replayed
└── @ytutils/video-processor

@ytutils/video-chunker
└── @ytutils/video-chunker-cli
```

The arrows show imports between workspace packages. `most-replayed` and
`video-processor` use `core` for shared contracts and errors. The CLI uses the
chunker package; it does not duplicate its download, probe, or split workflow.

## Package boundaries

### Core

`packages/shared/core/src/refs.ts` accepts an 11-character video ID and
supported YouTube video, playlist, and channel URLs through `parseYoutubeRef`.
`parseQueryRef` is the API that also accepts a free-text search query; the
metadata package decides when that query needs the YouTube Data API. `http.ts`
defines `HttpClient`, `HttpRequest`, and `HttpResponse`; `FetchHttpClient`
performs fetches with a default 15-second timeout.

`errors.ts` owns `YtUtilsError` and the shared error-code union.
Package-specific error classes remain in the package that owns the workflow.

### Metadata and duration

`metadata/src/application/get_metadata.ts` resolves a query, calls the search
endpoint when necessary, and fetches video details only for videos in `fullData`
mode. `metadata/src/infra/youtube_api.ts` owns response parsing and thumbnail
priority (`maxres`, `standard`, `high`, `medium`, `default`).

`duration/src/application/get_duration.ts` delegates reference resolution and
API access to metadata. It parses the returned ISO-8601 duration and owns the
numeric and clock representations.

### Most replayed

`most-replayed/src/application/get_most_replayed.ts` validates the video ID and
options, chooses JSON or SVG extraction, and returns ranked segments. The JSON
path fetches the watch HTML over `HttpClient`. The SVG path loads optional
Puppeteer, opens the watch page, hovers the progress bar, and parses the
heatmap. `src/ranking` turns markers into duration and top segments.

The default `auto` strategy uses JSON only. SVG is used only when requested or
when `allowSvgFallback` is enabled and JSON has no markers. The package does not
make Chrome a required dependency for the JSON path.

### Video processor

`video-processor/src/domain/normalize.ts` validates the video ID, trim range,
format, quality, and size. `infra/ytdlp.ts` chooses audio or video download
arguments and returns the path printed by `yt-dlp`. `infra/ffmpeg.ts` converts
when the downloaded extension differs from the requested format. The default
configuration is in `domain/config.ts`: `opus` audio, `mp4` video, best quality,
`media` output, and 14/50/200 MB video limits for small/medium/large.

### Video chunker and CLI

`video-chunker/src/run.ts` is the default workflow boundary. It validates the
request, verifies `yt-dlp`, `ffmpeg`, and `ffprobe` before downloading, creates
the output directory, and runs fetch → probe → split. `fetch.ts` handles
`yt-dlp` progress and optional Netscape cookies. `probe.ts` reads duration and
file size. `split.ts` invokes `ffmpeg` with `-c copy`, records its segment
manifest, and probes each written chunk.

The chunker reports typed events in `events.ts`. Core values remain seconds and
bytes. `apps/video-chunker-cli/src/format.ts` converts them to MB and
`HH:MM:SS`; `reporter.ts` throttles progress output and prints the summary.

## Maintainer tooling

`tools/most-replayed-maintainer` is private and excluded from the Fallow entry
point. It captures HTML and SVG snapshots, compares JSON and SVG markers, writes
diagnostic artifacts, and evaluates saved-artifact reliability. It is not a
published package and has no CLI entry point.

For setup, checks, formatting, builds, and publishing notes, see
[`contributing.md`](./contributing.md). For caller-facing contracts, use the
[documentation index](./docs/readme.md).
