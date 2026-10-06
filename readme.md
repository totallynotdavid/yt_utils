# yt_utils

`yt_utils` is a Bun and TypeScript monorepo for applications that need to read
YouTube references and metadata, extract replay segments, or download and
process video. The published packages own these operations; the repository does
not run a hosted service or hide the external APIs and programs they call.

## Install

Install the workspace with [Bun](https://bun.sh). The repository pins Bun
`1.4.2` in [`mise.toml`](./mise.toml).

```sh
bun install
```

The media packages also need the external programs named in their package
documentation. API-backed packages need a YouTube Data API key where stated.

## Smallest example

Run the CLI help without downloading a video:

```sh
bun run --cwd apps/video-chunker-cli start --help
```

For a package-specific example and its prerequisites, use the package README
linked below.

## Features

| Package                                                                    | What it owns                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`@ytutils/core`](./packages/shared/core/readme.md)                        | Shared errors, HTTP contracts, and YouTube reference parsing. |
| [`@ytutils/metadata`](./packages/youtube/metadata/readme.md)               | YouTube video, playlist, and channel IDs and video details.   |
| [`@ytutils/duration`](./packages/youtube/duration/readme.md)               | Video duration in numeric units or clock format.              |
| [`@ytutils/most-replayed`](./packages/youtube/most-replayed/readme.md)     | Most-replayed segments from JSON markers or the SVG heatmap.  |
| [`@ytutils/video-processor`](./packages/youtube/video-processor/readme.md) | `yt-dlp` downloads and `ffmpeg` conversion for one video.     |
| [`@ytutils/video-chunker`](./packages/youtube/video-chunker/readme.md)     | Download, probe, and fixed-length chunk workflows.            |
| [`@ytutils/video-chunker-cli`](./apps/video-chunker-cli/readme.md)         | A command-line wrapper around the chunk workflow.             |

## Documentation

- [Documentation index](./docs/readme.md)
- [Architecture](./architecture.md)
- [Contributing and development commands](./contributing.md)

## License

MIT. See [`LICENSE`](./LICENSE).
