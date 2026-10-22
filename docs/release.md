# Release

Each package has its own workflow, `release-<name>.yml`, which calls
[`publish-package.yml`](../.github/workflows/publish-package.yml). A tag named
`<prefix>v<version>` starts a release. The same workflow runs as a dry run on
every pull request and on manual dispatch.

| Package                      | Tag prefix            | Workflow                        |
| ---------------------------- | --------------------- | ------------------------------- |
| `@ytutils/core`              | `core-v`              | `release-core.yml`              |
| `@ytutils/metadata`          | `metadata-v`          | `release-metadata.yml`          |
| `@ytutils/duration`          | `duration-v`          | `release-duration.yml`          |
| `@ytutils/most-replayed`     | `most-replayed-v`     | `release-most-replayed.yml`     |
| `@ytutils/video-processor`   | `video-processor-v`   | `release-video-processor.yml`   |
| `@ytutils/video-chunker`     | `video-chunker-v`     | `release-video-chunker.yml`     |
| `@ytutils/video-chunker-cli` | `video-chunker-cli-v` | `release-video-chunker-cli.yml` |

## What the workflow does

1. `preflight` checks that the `npm-publish` environment exists and that the
   package exists on npm. It runs on every event.
2. `package` checks the tag, version and notes, runs `bun run check`, rewrites
   `workspace:*` ranges, packs the tarball, and runs `npm publish --dry-run` on
   it. It runs on every event.
3. `publish` publishes the tarball to npm by trusted publishing. It runs only on
   a tag, inside the `npm-publish` environment.
4. `github-release` creates the GitHub release from the package's release notes.
   It runs only on a tag, after `publish`.

## Release a version

1. Set `version` in the package's `package.json`.
2. Write the package's `release-notes.md`. Its first line must be
   `<package> <version> is out.`, for example `@ytutils/core 0.2.0 is out.`. The
   rest of the file is the GitHub release body.
3. Merge to `master`. The dry run on the pull request must pass.
4. Tag the merge commit with `<prefix>v<version>` and push the tag.

The workflow refuses a tag whose version differs from the package manifest, and
notes whose first line differs from the line above.

## One-time setup on GitHub

Create the environment the publish job names:

1. Open the repository, then Settings, then Environments, then New environment.
2. Name it `npm-publish`.
3. Add required reviewers and limit deployment branches and tags to the tag
   patterns in the table above.

## One-time setup on npm

npm sets up trusted publishing on a package that already exists, so each package
needs a first publish by hand.

1. Create the `ytutils` scope on npmjs.com, as an organization or a user named
   `ytutils`. Turn on two-factor authentication for the account.
2. For each package in the table, publish a placeholder from an empty directory.
   Use version `0.0.0` so the first tag can publish the real version:

   ```sh
   mkdir placeholder && cd placeholder
   npm init -y --scope @ytutils --name @ytutils/core --version 0.0.0
   npm publish --access public
   ```

3. For each package, add the trusted publisher. In the package's Settings page
   on npmjs.com, under Trusted Publisher, choose GitHub Actions and enter:

   | Field       | Value                                             |
   | ----------- | ------------------------------------------------- |
   | Owner       | `totallynotdavid`                                 |
   | Repository  | `yt_utils`                                        |
   | Workflow    | the file in the table, such as `release-core.yml` |
   | Environment | `npm-publish`                                     |

   The same setting from a terminal, logged in to npm:

   ```sh
   npm trust github @ytutils/core --repo totallynotdavid/yt_utils \
     --file release-core.yml --env npm-publish
   ```

npm checks the workflow that was started, which is the `release-<name>.yml`
file, not `publish-package.yml`. Each package therefore names its own release
file. npm does not check the setting when you save it. A mismatch shows up on
the first publish, which uploads nothing. Fix the setting and rerun the failed
`publish` job.
