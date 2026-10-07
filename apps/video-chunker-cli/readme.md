# @ytutils/video-chunker-cli

`@ytutils/video-chunker-cli` downloads a YouTube video and splits it into
fixed-length chunks (default: 1 hour) without re-encoding. It prints progress
and a final chunk summary, and delegates the workflow to
`@ytutils/video-chunker`.

## Use from the workspace

`@ytutils/video-chunker-cli` is not published to npm; use it from the workspace.
From the repository root, install dependencies:

```sh
bun install
```

The CLI needs [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) and `ffmpeg` /
`ffprobe` on your `PATH`.

The package declares `video-chunker` as its bin name. In this workspace, invoke
it through the `bun run --cwd` commands below.

## Smallest example

Run the default one-hour chunk workflow for a public video:

```sh
bun run --cwd apps/video-chunker-cli start "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## Get started

Use a real URL when choosing the chunk length and output directory:

```sh
bun run --cwd apps/video-chunker-cli start "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --chunk 1h --out ./output
```

For a real URL, pass it as the first positional argument. The command downloads
the video into `./output` and splits it into 1-hour chunks. A completed run
looks like this:

```txt
Downloading
   10%  23.3 MB / 232.5 MB
   50%  116.2 MB / 232.5 MB
  100%  232.5 MB / 232.5 MB

Reading video info
  title:   Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)
  length:  00:03:33
  size:    232.5 MB
  chunks:  ~1

Splitting
   50%  00:01:46 / 00:03:33
  100%  00:03:33 / 00:03:33

Done. 1 chunk in ./output/
  #   file                          length     size
  ─── ───────────────────────────── ────────── ──────────
  0   chunk_000.mp4                 00:03:33   232.5 MB

  total: 232.5 MB
```

## Options

The command accepts a YouTube URL followed by options.

| flag            | meaning                                                   | default    |
| --------------- | --------------------------------------------------------- | ---------- |
| `--chunk <dur>` | chunk length: `1h`, `30m`, `90s`, or plain seconds `3600` | `1h`       |
| `--out <dir>`   | output directory                                          | `./output` |
| `--cookies <f>` | Netscape-format cookies file for yt-dlp                   | none       |
| `--keep-source` | keep the full download after splitting                    | off        |
| `-h`, `--help`  | show help                                                 |            |

For example, pass `--chunk 45m --out ./clips` after the URL to write 45-minute
chunks to `./clips`:

```sh
bun run --cwd apps/video-chunker-cli start "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --chunk 45m --out ./clips
```

## Features

- Uses yt-dlp for download, ffprobe for media info, and ffmpeg segment muxing
  with `-c copy`.
- Chunk length is approximate and depends on keyframe boundaries.
- Reports download and split progress, then prints chunk durations and sizes.
- Supports `--cookies` for login-only or restricted videos.
- Exposes the workflow as `@ytutils/video-chunker`, while the CLI stays in
  `@ytutils/video-chunker-cli`.

## YouTube access

YouTube now requires solving a JS challenge to reach real video formats. The CLI
passes the request to yt-dlp, which can auto-detect a JS runtime on `PATH`
(`deno` / `node` / `bun` / `quickjs`) and fetch the EJS solver scripts. Make
sure at least one of those runtimes is installed.

For login-only, age-restricted, or members-only videos, or to dodge rate
limiting, export your cookies in **Netscape format** and pass them with
`--cookies cookies.txt`. The cookies file is sensitive (it's your session); it's
git-ignored by default.

## Development

Run repository checks from the [development guide](../../docs/development.md).

## Links

- [Library workflow](../../packages/youtube/video-chunker/readme.md)
- [Architecture](../../architecture.md)
- [Documentation index](../../docs/readme.md)
- [Source](./src/bin.ts)
