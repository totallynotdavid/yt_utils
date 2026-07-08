# yt_utils

Monorepo for YouTube utility packages.

## Layout

- `packages/shared/*`: shared libraries used across package families.
- `packages/youtube/*`: published YouTube-focused libraries.
- `apps/*`: runnable packages such as CLIs.
- `tools/*`: private internal automation.

## Tooling

- Bun workspaces
- TypeScript
- Vitest
- OXLint (with [type-aware backend](https://github.com/oxc-project/tsgolint))
- OXFmt
- Fallow (static analysis)

## Scripts

- `bun run check` runs typecheck, lint, format check, tests, and fallow. The `lint` step uses the type-aware backend (see below).
- `bun run typecheck` runs typechecks in all packages.
- `bun run lint` runs oxlint once from root. With type-aware linting enabled (`.oxlintrc.json` -> `options.typeAware`), this also runs the `tsgolint`-backed `typescript/*` rules. Use `bun run lint:type-aware` as an explicit alias.
- `bun run fmt` / `bun run fmt:check` runs oxfmt once from root.
- `bun run test` runs tests in all packages.
- `bun run fallow` / `bun run fallow:check` runs the [fallow](https://github.com/fallow-rs/fallow) static analyzer (configured by `.fallowrc.json`).
