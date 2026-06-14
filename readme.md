# yt_utils

Monorepo for YouTube utility packages.

## Tooling

- Bun workspaces
- TypeScript
- Vitest
- OXLint
- OXFmt
- Fallow (static analysis)

## Scripts

- `bun run check` runs typecheck, lint, format check, tests, and fallow.
- `bun run typecheck` runs typechecks in all packages.
- `bun run lint` runs oxlint once from root.
- `bun run fmt` / `bun run fmt:check` runs oxfmt once from root.
- `bun run test` runs tests in all packages.
- `bun run fallow` / `bun run fallow:check` runs the [fallow](https://github.com/fallow-rs/fallow) static analyzer (configured by `.fallowrc.json`).
