# @ytutils/video-processor

`@ytutils/video-processor` downloads one YouTube video, optionally trims it, and
converts it with `yt-dlp` and `ffmpeg`. It returns absolute paths for the files
it produces. Fixed-length chunking is provided by `@ytutils/video-chunker`.

## Use from the workspace

`@ytutils/video-processor` is not published to npm; use it from the workspace.
Use `@ytutils/video-processor` from a sibling workspace package. Declare the
dependency as `"@ytutils/video-processor": "workspace:*"`, then from the
repository root install dependencies and build before running the importing
package. The package exports point at `dist`, so the build is required:

```sh
bun install
bun run build:all
```

Requires `yt-dlp` and `ffmpeg` on your `PATH`.

## Smallest example

<!-- prettier-ignore -->
```ts
import { processVideo } from '@ytutils/video-processor'

// Trim 0-10s and convert to opus audio
const { artifacts } = await processVideo({
  videoId: 'jNQXAC9IVRw',
  startTimeSec: 0,
  endTimeSec: 10,
  format: 'opus',
})

console.log(artifacts[0].path) // '/abs/path/media/jNQXAC9IVRw.opus'
```

## Features

- Trim a download with `startTimeSec` and `endTimeSec`.
- Select audio or video formats and best or worst source quality.
- Cap video download size and choose the output directory.
- Inject command and filesystem dependencies for tests.

## API reference

### `processVideo(request, config?, deps?)`

`request`:

| field          | type                                               | default    | meaning                                                       |
| -------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `videoId`      | string                                             | required   | 11-character YouTube video id                                 |
| `startTimeSec` | number                                             | from start | trim start in seconds (non-negative)                          |
| `endTimeSec`   | number                                             | to the end | trim end in seconds (must be greater than `startTimeSec`)     |
| `format`       | `opus` `mp3` `m4a` `wav` `flac` `mp4` `webm` `mkv` | `opus`     | audio formats extract audio; video formats keep video         |
| `quality`      | `'best' \| 'worst'`                                | `'best'`   | source stream quality passed to yt-dlp                        |
| `videoSize`    | `'small' \| 'medium' \| 'large'`                   | uncapped   | caps the download size (14 / 50 / 200 MB); video formats only |
| `outputDir`    | string                                             | `'media'`  | directory for outputs, resolved against the cwd               |

Returns a `ProcessVideoResult` whose `artifacts` array contains an
`OutputArtifact` (`{ kind, format, path }`) per produced file. Output files are
named `<outputDir>/<videoId>.<format>`. When the downloaded file is not already
in the requested format, `artifacts` holds both the download and the converted
file; otherwise it holds just the download.

The default `config` (audio format, qualities, output dir, size caps) can be
overridden by passing a second argument, and every external process is
injectable through `deps` for testing.

## Errors

Errors are `YtUtilsError` from `@ytutils/core` with a `code`:

| code                 | when                                  |
| -------------------- | ------------------------------------- |
| `INVALID_INPUT`      | bad video id, format, or trim range   |
| `NOT_FOUND`          | the video is unavailable              |
| `PROCESS_EXEC_ERROR` | yt-dlp or ffmpeg exited non-zero      |
| `PARSING_ERROR`      | the yt-dlp output could not be parsed |

## Links

- [Architecture](../../../architecture.md)
- [Documentation index](../../../docs/readme.md)
- [Source](./src/index.ts)
