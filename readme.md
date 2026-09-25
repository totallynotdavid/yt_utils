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

- `bun run check` runs typecheck, lint, format check, tests, the license sync check, and fallow. Lint uses the type-aware backend (`.oxlintrc.json` -> `options.typeAware`).
- `bun run typecheck` runs tsc for the repo-root project and typechecks in all packages.
- `bun run lint` runs oxlint once from root.
- `bun run fmt` / `bun run fmt:check` runs oxfmt once from root.
- `bun run test` runs vitest across the workspace. Per-package `test` scripts point at the same root suite (`--root`), so a package's `prepublishOnly` gate always runs the real tests.
- `bun run build:all` builds every publishable package with bunup.
- `bun run license:sync` / `bun run license:check` copies the root `LICENSE` into every publishable package and verifies no drift. Package managers drop symlinks at pack time, so each package carries a plain committed copy.
- `bun run fallow` / `bun run fallow:check` runs the [fallow](https://github.com/fallow-rs/fallow) static analyzer (configured by `.fallowrc.json`).
- `scripts/rewrite-workspace-deps.ts` rewrites `workspace:*` ranges into real versions for `npm publish`, which cannot resolve the workspace protocol. The release workflows run it right before publishing.
