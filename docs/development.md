# Development

The repository uses Bun `1.4.2`, pinned in [`mise.toml`](../mise.toml),
TypeScript, Vitest, OXLint, OXFmt, and Fallow. Run these commands from the
repository root.

Contributions change the TypeScript packages, the CLI, or their documentation.
The [architecture document](../architecture.md) maps the boundaries a change
must preserve.

## Set up

Install the workspace dependencies:

```sh
bun install
```

The video workflows also need `yt-dlp`, `ffmpeg`, and `ffprobe` on `PATH`. The
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

Run an individual check when you are working on one area:

```sh
bun run typecheck
bun run lint
bun run fmt
bun run fmt:check
bun run test
bun run check:code
bun run license:check
bun run fallow:check
```

`check` runs `check:code`, `license:check`, and `fallow:check`. `check:code`
combines typecheck, lint, format verification, and tests. `bun run fmt` formats
source files with OXFmt when a change needs formatting.

`bun run fallow:check` passes for the changed-file audit. `bun run fallow`
currently fails on three functions: `apps/video-chunker-cli/src/main.ts:24`
(`main`) is the first, followed by
`packages/youtube/video-processor/src/domain/normalize.ts:27`
(`assertTimeRange`) and `apps/video-chunker-cli/src/reporter.ts:36`
(`onProgress`). A separate code task repairs those functions; remove this note
when that fix lands.

## Build

Build every package and the CLI:

```sh
bun run build:all
```

`build:all` builds the six library packages and the CLI. The private
`tools/most-replayed-maintainer` workspace has a typecheck script but no build
script, so the root build intentionally excludes it.

## Package checks and release

Each package carries a committed copy of the root `LICENSE` because package
managers do not preserve a repository-level symlink when packing a package. If a
license check fails after the root license changes, copy the new file and check
the copies again:

```sh
bun run license:sync
bun run license:check
```

The release workflow rewrites a package's `workspace:*` dependency ranges to
real versions. Run the same step for a package directory with:

```sh
bun scripts/rewrite-workspace-deps.ts packages/youtube/metadata
```

The release workflow then runs the package checks on the rewritten package. The
package registry cannot resolve the workspace protocol itself. The rewrite
command mutates the tracked package manifest, so run it in a clean release
checkout or restore the manifest before continuing with other work. Each
package's `prepublishOnly` script runs its typecheck, the root test suite, and
its Bunup build.

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
Markdown with:

```sh
bunx prettier --print-width 80 --prose-wrap always --write '**/*.md'
```
