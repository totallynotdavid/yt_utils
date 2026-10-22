# Development

The repository uses Bun and Node, pinned in [`mise.toml`](../mise.toml),
TypeScript, Vitest, OXLint, OXFmt, and Fallow. Run these commands from the
repository root. [Install mise](https://mise.jdx.dev/getting-started.html), then
run `mise trust` once.

Contributions change the TypeScript packages, the CLI, or their documentation.
The [architecture document](../architecture.md) maps the boundaries a change
must preserve.

## Set up

Install the pinned tools, then the workspace dependencies from `bun.lock`:

```sh
mise install
bun run setup
```

The video workflows also need `yt-dlp`, `ffmpeg`, and `ffprobe` on `PATH`. The
video-chunker media tests skip when `ffmpeg` or `ffprobe` is missing. The
YouTube EJS challenge solver needs a JavaScript runtime on `PATH`. yt-dlp can
use Deno, Node, Bun, or QuickJS. The optional SVG strategy in
`@ytutils/most-replayed` needs Puppeteer and a Chrome-compatible browser.
API-backed examples need `YOUTUBE_API_KEY`. Copy
[`.env.example`](../.env.example) to `.env` and fill in the key.

Development uses OXLint's type-aware backend from
[`oxlint-tsgolint`](https://github.com/oxc-project/tsgolint), enabled by
`options.typeAware` in [`.oxlintrc.json`](../.oxlintrc.json).

## Checks

Run the repository gate:

```sh
bun run check
```

`check` runs `lint`, `typecheck`, `test`, and `build`, and writes no tracked
file. Run an individual task when you are working on one area:

```sh
bun run lint
bun run fix
bun run typecheck
bun run test
```

`lint` runs `lint:ts` (OXLint), `lint:format` (OXFmt on source, Markdown, YAML,
and JSON), and `lint:dead`. `fix` applies the OXLint fixes and formats with
OXFmt.

`lint:dead` runs `fallow audit`, which reports findings in the files changed
against the merge base with the remote default branch.

## Build

Build every package and the CLI:

```sh
bun run build
```

`build` builds the five library packages and the CLI.

## CLI

Print help without contacting YouTube:

```sh
bun run --cwd apps/video-chunker-cli start --help
```

After installing `yt-dlp`, `ffmpeg`, and `ffprobe`, pass a YouTube URL as the
first argument. The CLI writes chunks to `./output` by default. Use `--chunk`,
`--out`, `--cookies`, or `--keep-source` to change that request. The
[CLI README](../apps/video-chunker-cli/readme.md) lists the accepted values and
output contract.

## Documentation

Keep a package contract in its package README, a code boundary in
[`architecture.md`](../architecture.md), and repository workflow here. Format
Markdown with OXFmt through `bun run fix`.
