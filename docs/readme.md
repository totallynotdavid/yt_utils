# Documentation

This is the ordered index for repository documentation. Package READMEs own the
contracts their package publishes; the root documents own repository-wide
structure and workflow.

| Document                                                                    | Owns                                                                              | Owner              |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------ |
| [`readme.md`](../readme.md)                                                 | Repository purpose, boundary, install, package choices, and links.                | `@totallynotdavid` |
| [`architecture.md`](../architecture.md)                                     | Package map, dependency direction, and deliberate module boundaries.              | `@totallynotdavid` |
| [`contributing.md`](../contributing.md)                                     | Setup, checks, builds, package checks, CLI development, and documentation format. | `@totallynotdavid` |
| [`@ytutils/core`](../packages/shared/core/readme.md)                        | Shared errors, HTTP contracts, and YouTube reference parsing.                     | `@totallynotdavid` |
| [`@ytutils/metadata`](../packages/youtube/metadata/readme.md)               | YouTube reference resolution and video metadata.                                  | `@totallynotdavid` |
| [`@ytutils/duration`](../packages/youtube/duration/readme.md)               | Video duration lookup and formatting.                                             | `@totallynotdavid` |
| [`@ytutils/most-replayed`](../packages/youtube/most-replayed/readme.md)     | JSON and SVG replay-marker extraction.                                            | `@totallynotdavid` |
| [`@ytutils/video-processor`](../packages/youtube/video-processor/readme.md) | One-video download, trimming, and conversion.                                     | `@totallynotdavid` |
| [`@ytutils/video-chunker`](../packages/youtube/video-chunker/readme.md)     | Download, probe, split, progress, and chunk contracts.                            | `@totallynotdavid` |
| [`@ytutils/video-chunker-cli`](../apps/video-chunker-cli/readme.md)         | CLI installation, options, output, and YouTube access.                            | `@totallynotdavid` |

The architecture map is the source of truth for internal ownership. This index
is the source of truth for where a reader should go next.
