# video-chunker

Downloads a YouTube video and splits it into fixed-length chunks (default: 1
hour) without re-encoding. Prints progress and a final chunk summary.

## Get started

You need [Bun](https://bun.sh), plus [`yt-dlp`](https://github.com/yt-dlp/yt-dlp)
and `ffmpeg` / `ffprobe` on your `PATH`. Then:

```sh
bun install
bun run start "https://www.youtube.com/watch?v=..."
```

That downloads the video into `./output` and splits it into 1-hour chunks.
Here is what a run looks like:

```txt
Downloading
   10%  4.2 MB / 41.0 MB
   50%  20.6 MB / 41.0 MB
  100%  41.0 MB / 41.0 MB

Reading video info
  title:   How the BBC Micro Started a Computing Revolution
  length:  02:15:30
  size:    410.0 MB
  chunks:  ~3

Splitting
   33%  00:45:10 / 02:15:30
   66%  01:30:20 / 02:15:30
  100%  02:15:30 / 02:15:30

Done. 3 chunks in ./output/
  #   file                          length     size
  ─── ───────────────────────────── ────────── ──────────
  0   chunk_000.mp4                 01:00:00   182.4 MB
  1   chunk_001.mp4                 01:00:00   181.9 MB
  2   chunk_002.mp4                 00:15:30   45.7 MB

  total: 410.0 MB
```

## Options

```sh
bun run start <youtube-url> [options]
```

| flag            | meaning                                                   | default    |
| --------------- | --------------------------------------------------------- | ---------- |
| `--chunk <dur>` | chunk length: `1h`, `30m`, `90s`, or plain seconds `3600` | `1h`       |
| `--out <dir>`   | output directory                                          | `./output` |
| `--cookies <f>` | Netscape-format cookies file for yt-dlp                   | none       |
| `--keep-source` | keep the full download after splitting                    | off        |
| `-h`, `--help`  | show help                                                 |            |

```sh
bun run start "https://www.youtube.com/watch?v=..." --chunk 45m --out ./clips
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

YouTube now requires solving a JS challenge to reach real video formats. The
pipe handles this for you: it auto-detects a JS runtime on `PATH`
(`deno` / `node` / `bun` / `quickjs`) and lets yt-dlp fetch the EJS solver
scripts. Make sure at least one of those runtimes is installed.

For login-only, age-restricted, or members-only videos, or to dodge rate
limiting, export your cookies in **Netscape format** and pass them with
`--cookies cookies.txt`. The cookies file is sensitive (it's your session); it's
git-ignored by default.

## Packages

This is a Bun workspace with two packages:

- `@ytutils/video-chunker`: library workflow and types.
- `@ytutils/video-chunker-cli`: command wrapper over core: argument parsing, progress lines, and the summary table.

```
packages/youtube/video-chunker/src/  run.ts fetch.ts probe.ts split.ts events.ts binaries.ts ...
apps/video-chunker-cli/src/          main.ts reporter.ts format.ts duration.ts ...
```

## Development

```sh
bun test          # run unit + integration tests
bun run typecheck # tsc --noEmit across both packages
bun run lint      # oxlint        (oxlint.config.ts)
bun run fmt       # oxfmt         (oxfmt.config.ts), fmt:check to verify only
```

Lint and format are [oxlint] / [oxfmt], configured in TypeScript
(`oxlint.config.ts`, `oxfmt.config.ts`).
