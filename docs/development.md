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
and JSON), `lint:license`, and `lint:dead`. `fix` applies the OXLint fixes,
formats with OXFmt, and copies the root license into each package.

`lint:dead` runs `fallow audit`, which reports findings in the files changed
against the merge base with the remote default branch.

## Build

Build every package and the CLI:

```sh
bun run build
```

`build` builds the six library packages and the CLI.

## Package checks and release

Each package carries a committed copy of the root `LICENSE` because package
managers do not preserve a repository-level symlink when packing a package. If a
license check fails after the root license changes, run `bun run fix` to copy
the new file into every package.

The release workflow rewrites a package's `workspace:*` dependency ranges to
real versions. Run the same step for a package directory with:

```sh
bun run release:rewrite packages/youtube/metadata
```

The package registry cannot resolve the workspace protocol itself. The rewrite
command mutates the tracked package manifest, so run it in a clean release
checkout or restore the manifest before continuing with other work.

Check a package's tag, version and release notes the way the release workflow
does. Omit `--tag` to check the manifest and notes alone:

```sh
bun scripts/check-release.ts --dir packages/youtube/metadata \
  --name @ytutils/metadata --prefix metadata-v --tag metadata-v0.1.0
```

[Release](./release.md) describes the release workflow, its dry run on pull
requests, and the npm and GitHub setup a maintainer does once.

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
