# Contributing

Contributions change the TypeScript packages, the CLI, or their documentation.
The source is organized by package; the architecture document explains the
boundaries that a change must preserve.

Owner: `@totallynotdavid`

## Set up

The repository uses Bun `1.4.2`, pinned in [`mise.toml`](./mise.toml).

```sh
bun install
```

Some runtime workflows also require `yt-dlp`, `ffmpeg`, `ffprobe`, a JavaScript
runtime for the YouTube EJS challenge solver, or Chrome for the optional SVG
strategy. The package READMEs describe those prerequisites. API-backed examples
need `YOUTUBE_API_KEY`; copy [`.env.example`](./.env.example) to `.env` when
using Bun's automatic dotenv loading.

Development uses Bun workspaces, TypeScript, Vitest, OXLint with its
[type-aware backend](https://github.com/oxc-project/tsgolint), OXFmt, and
[Fallow](https://github.com/fallow-rs/fallow). OXLint's type-aware backend is
enabled by `.oxlintrc.json` under `options.typeAware`.

## Checks

Run the complete repository gate from the root:

```sh
bun run check
```

It runs typecheck, lint, format check, tests, the license sync check, and
Fallow. The individual commands are:

```sh
bun run typecheck
bun run lint
bun run fmt
bun run fmt:check
bun run test
bun run check:code
bun run fallow
bun run fallow:check
```

Typecheck runs `tsc` for the root project and then the workspace packages. Lint
runs OXLint once from the root with its type-aware backend. Tests run Vitest
across the workspace. `fmt` and `fmt:check` run OXFmt once from the root.
`check:code` combines typecheck, lint, format check, and tests.

## Build and package checks

Build every publishable package with:

```sh
bun run build:all
```

Copy the root `LICENSE` into every publishable package, or verify that the plain
committed copies have not drifted, with:

```sh
bun run license:sync
bun run license:check
```

Package managers drop symlinks at pack time, so each published package carries
its own committed `LICENSE`. Each package's `prepublishOnly` script runs its
typecheck, the root test suite, and its Bunup build.

The release workflows run
[`scripts/rewrite-workspace-deps.ts`](./scripts/rewrite-workspace-deps.ts)
before publishing. It rewrites `workspace:*` ranges into real versions because
`npm publish` cannot resolve the workspace protocol.

## CLI development

The CLI can be run from its app directory or through Bun's `--cwd` option:

```sh
bun run --cwd apps/video-chunker-cli start --help
bun run --cwd apps/video-chunker-cli start "https://www.youtube.com/watch?v=..."
```

Run the workspace development commands from the repository root:

```sh
bun run test
bun run typecheck
bun run lint
bun run fmt
```

The CLI uses `yt-dlp`, `ffprobe`, and `ffmpeg`; its README documents the runtime
options and YouTube access requirements.

## Documentation

Keep one rule or contract in one document. Update the package README when a
public package contract changes, [`architecture.md`](./architecture.md) when a
boundary changes, and [`docs/readme.md`](./docs/readme.md) when the document set
changes. Format Markdown with:

```sh
bunx prettier --print-width 80 --prose-wrap always --write '**/*.md'
```
