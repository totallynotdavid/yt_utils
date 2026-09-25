# @ytutils/video-processor

Download a YouTube video (or a trimmed slice of one) with `yt-dlp` and convert
it with `ffmpeg`. Returns the absolute paths of everything it produced.

## Installation

```bash
npm install @ytutils/video-processor
```

Requires `yt-dlp` and `ffmpeg` on your `PATH`.

## Usage

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
