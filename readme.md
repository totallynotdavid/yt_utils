# yt_utils

`yt_utils` is a Bun and TypeScript workspace for developers building tools that
read YouTube references and metadata, find replayed segments, or download and
process video. It provides libraries and a command-line application.

## Get started

Clone the repository, install its dependencies, and print the chunker help:

```sh
bun install
bun run --cwd apps/video-chunker-cli start --help
```

The CLI needs `yt-dlp`, `ffmpeg`, and `ffprobe` on `PATH` when it downloads a
video. API-backed packages need a YouTube Data API key. The package manuals
describe those requirements and the smallest working calls.

After installing those media tools, run the workflow with a public video:

```sh
bun run --cwd apps/video-chunker-cli start "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --chunk 1h --out ./output
```

## Use a package

The six libraries and the CLI are not published to npm; use them from the
workspace.

The six libraries and the CLI are workspace members. A sibling workspace package
declares a dependency with a `workspace:*` range. For example:

```json
{
  "dependencies": {
    "@ytutils/core": "workspace:*"
  }
}
```

From the repository root, install dependencies and build the workspace before
running a sibling package that imports a library:

```sh
bun install
bun run build:all
```

## Packages

| Package                                                                    | Use it for                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`@ytutils/core`](./packages/shared/core/readme.md)                        | Shared errors, HTTP contracts, and YouTube reference parsing. |
| [`@ytutils/metadata`](./packages/youtube/metadata/readme.md)               | YouTube IDs, references, searches, and video details.         |
| [`@ytutils/duration`](./packages/youtube/duration/readme.md)               | Video duration as numbers or a clock string.                  |
| [`@ytutils/most-replayed`](./packages/youtube/most-replayed/readme.md)     | Most-replayed segments from JSON or the rendered heatmap.     |
| [`@ytutils/video-processor`](./packages/youtube/video-processor/readme.md) | Download, trim, and convert one video.                        |
| [`@ytutils/video-chunker`](./packages/youtube/video-chunker/readme.md)     | Download, probe, and split a video into fixed-length chunks.  |
| [`@ytutils/video-chunker-cli`](./apps/video-chunker-cli/readme.md)         | Run the chunk workflow from a terminal.                       |

## Where to go next

- [Manual](./docs/readme.md)
- [Architecture](./architecture.md)
- [Development](./docs/development.md)

## License

MIT. See [`LICENSE`](./LICENSE).
