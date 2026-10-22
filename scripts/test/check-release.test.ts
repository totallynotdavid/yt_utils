import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const run = promisify(execFile)
const script = resolve(__dirname, '../check-release.ts')

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'check-release-'))
  await mkdir(join(root, 'pkg'))
  await writeFile(
    join(root, 'pkg/package.json'),
    JSON.stringify({ name: '@ytutils/demo', version: '1.2.3' })
  )
  await writeFile(join(root, 'pkg/release-notes.md'), '@ytutils/demo 1.2.3 is out.\n\nBody.\n')
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

async function check(...extra: string[]): Promise<{ code: number; output: string }> {
  try {
    const { stdout } = await run(process.execPath, [
      script,
      '--dir',
      join(root, 'pkg'),
      '--name',
      '@ytutils/demo',
      '--prefix',
      'demo-v',
      ...extra,
    ])
    return { code: 0, output: stdout }
  } catch (error) {
    if (error instanceof Error && 'code' in error && 'stderr' in error) {
      return { code: Number(error.code), output: String(error.stderr) }
    }
    throw error
  }
}

describe('check-release', () => {
  it('accepts a tag that matches the manifest and notes', async () => {
    const result = await check('--tag', 'demo-v1.2.3')
    expect(result.code).toBe(0)
  })

  it('accepts a dry run without a tag', async () => {
    const result = await check()
    expect(result.code).toBe(0)
  })

  it('refuses a tag whose version is not the manifest version', async () => {
    const result = await check('--tag', 'demo-v1.2.4')
    expect(result.code).toBe(1)
    expect(result.output).toContain('tag says 1.2.4')
  })

  it('refuses a tag with the wrong prefix', async () => {
    const result = await check('--tag', 'other-v1.2.3')
    expect(result.code).toBe(1)
    expect(result.output).toContain('does not start with demo-v')
  })

  it('refuses notes that name another version, with or without a tag', async () => {
    await writeFile(join(root, 'pkg/release-notes.md'), '@ytutils/demo 1.2.2 is out.\n')
    for (const extra of [[], ['--tag', 'demo-v1.2.3']]) {
      const result = await check(...extra)
      expect(result.code).toBe(1)
      expect(result.output).toContain('must start with "@ytutils/demo 1.2.3 is out."')
    }
  })

  it('refuses missing notes', async () => {
    await rm(join(root, 'pkg/release-notes.md'))
    const result = await check()
    expect(result.code).toBe(1)
    expect(result.output).toContain('release-notes.md is missing')
  })

  it('refuses a manifest named differently from the package the workflow publishes', async () => {
    await writeFile(
      join(root, 'pkg/package.json'),
      JSON.stringify({ name: '@ytutils/other', version: '1.2.3' })
    )
    const result = await check()
    expect(result.code).toBe(1)
    expect(result.output).toContain('is named @ytutils/other')
  })
})
