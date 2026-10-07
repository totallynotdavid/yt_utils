# Architecture

The workspace separates YouTube reference parsing, API access, replay
extraction, media processing, and video chunking. Library packages expose their
public surface from `src/index.ts`. The CLI starts at `src/bin.ts`, and the
maintainer tool has its own internal modules. Each package README owns the
caller-facing contract.

## Workspace map

| Path                                                                     | Responsibility                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [`packages/shared/core`](./packages/shared/core)                         | Shared errors, HTTP contracts, and YouTube reference parsing.                                           |
| [`packages/youtube/metadata`](./packages/youtube/metadata)               | Resolves direct references and search queries, then reads video details from the YouTube Data API.      |
| [`packages/youtube/duration`](./packages/youtube/duration)               | Gets video details through metadata and converts ISO-8601 duration into numbers or a clock string.      |
| [`packages/youtube/most-replayed`](./packages/youtube/most-replayed)     | Reads replay markers from watch-page JSON or a rendered SVG heatmap, then ranks segments.               |
| [`packages/youtube/video-processor`](./packages/youtube/video-processor) | Normalizes one processing request, invokes `yt-dlp`, and converts the result with `ffmpeg` when needed. |
| [`packages/youtube/video-chunker`](./packages/youtube/video-chunker)     | Downloads one URL, probes its media, and splits it with `ffmpeg`'s segment muxer.                       |
| [`apps/video-chunker-cli`](./apps/video-chunker-cli)                     | Parses CLI arguments and formats chunk workflow progress and summaries.                                 |
| [`tools/most-replayed-maintainer`](./tools/most-replayed-maintainer)     | Captures, compares, diagnoses, and evaluates saved replay-extraction artifacts.                         |

## Dependency direction

```text
@ytutils/core
├── @ytutils/metadata
├── @ytutils/duration
├── @ytutils/most-replayed
├── @ytutils/video-processor
└── @ytutils/most-replayed-maintainer

@ytutils/metadata
└── @ytutils/duration

@ytutils/video-chunker
└── @ytutils/video-chunker-cli
```

The arrows show workspace package dependency declarations. The CLI delegates
download, probe, and split to the chunker package. The maintainer tool depends
on core and imports most-replayed source modules directly for its saved-artifact
workflows.

## Boundaries

### Core

[`refs.ts`](./packages/shared/core/src/refs.ts) validates video IDs and parses
supported video, playlist, and channel references. `parseQueryRef` also
classifies free-text search queries. The metadata package decides when a query
needs the YouTube Data API.

[`http.ts`](./packages/shared/core/src/http.ts) defines `HttpClient`,
`HttpRequest`, and `HttpResponse`. `FetchHttpClient` performs fetches with a
15-second default timeout. [`errors.ts`](./packages/shared/core/src/errors.ts)
owns `YtUtilsError` and the shared error-code union.

### Metadata and duration

[`get_metadata.ts`](./packages/youtube/metadata/src/application/get_metadata.ts)
resolves a query, calls search when necessary, and fetches video details only
for videos in `fullData` mode.
[`youtube_api.ts`](./packages/youtube/metadata/src/infra/youtube_api.ts) parses
API responses and chooses thumbnails in this order: `maxres`, `standard`,
`high`, `medium`, then `default`.

[`get_duration.ts`](./packages/youtube/duration/src/application/get_duration.ts)
delegates reference resolution and API access to metadata. It parses the
returned ISO-8601 duration and owns the seconds, minutes, hours, and clock
representations.

### Most replayed

[`get_most_replayed.ts`](./packages/youtube/most-replayed/src/application/get_most_replayed.ts)
validates the video ID and options, selects JSON or SVG extraction, and returns
ranked segments. The JSON path fetches watch HTML over `HttpClient`. The SVG
path uses optional Puppeteer to open the watch page, hover the progress bar, and
parse the heatmap.

The default `auto` strategy uses JSON. SVG is selected explicitly or when
`allowSvgFallback` is enabled and JSON has no markers. Chrome is not required
for the JSON path.

### Video processor

[`process_video.ts`](./packages/youtube/video-processor/src/application/process_video.ts)
normalizes a request, downloads with `yt-dlp`, and converts with `ffmpeg` when
the downloaded extension differs from the requested format. The default
configuration is defined in
[`config.ts`](./packages/youtube/video-processor/src/domain/config.ts): Opus
audio, MP4 video, best quality, the `media` output directory, and 14, 50, and
200 MB video-size limits for small, medium, and large requests.

### Video chunker and CLI

[`run.ts`](./packages/youtube/video-chunker/src/run.ts) validates a request,
verifies `yt-dlp`, `ffmpeg`, and `ffprobe`, creates the output directory, then
runs fetch, probe, and split.
[`fetch.ts`](./packages/youtube/video-chunker/src/fetch.ts) handles `yt-dlp`
progress and optional Netscape cookies.
[`probe.ts`](./packages/youtube/video-chunker/src/probe.ts) reads duration and
file size. [`split.ts`](./packages/youtube/video-chunker/src/split.ts) invokes
`ffmpeg` with `-c copy`, reads its segment manifest, and probes each written
chunk.

The chunker reports typed events from
[`events.ts`](./packages/youtube/video-chunker/src/events.ts). Core values stay
in seconds and bytes. [`format.ts`](./apps/video-chunker-cli/src/format.ts)
converts them to MB and `HH:MM:SS`. The
[`reporter.ts`](./apps/video-chunker-cli/src/reporter.ts) throttles progress
output and prints the summary.

For local setup and checks, see [Development](./docs/development.md). For
caller-facing contracts, use the [manual index](./docs/readme.md).
