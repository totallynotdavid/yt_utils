// The tag version must match the manifest version and release notes.
// Without --tag, the check validates the manifest and notes for a dry run.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    dir: { type: 'string' },
    name: { type: 'string' },
    prefix: { type: 'string' },
    tag: { type: 'string' },
  },
})

const { dir, name, prefix, tag } = values
if (!dir || !name || !prefix) {
  console.error(
    'usage: bun scripts/check-release.ts --dir <package-dir> --name <package> --prefix <tag-prefix> [--tag <tag>]'
  )
  process.exit(2)
}

const NOTES_FILE = 'release-notes.md'

function fail(message: string): never {
  console.error(`error: ${message}`)
  process.exit(1)
}

const manifest: unknown = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
const fields = typeof manifest === 'object' && manifest !== null ? manifest : {}
const manifestName = 'name' in fields ? fields.name : undefined
const version = 'version' in fields ? fields.version : undefined
if (typeof version !== 'string' || version === '') {
  fail(`${dir}/package.json has no version`)
}
if (manifestName !== name) {
  fail(`${dir}/package.json is named ${String(manifestName)}, the workflow publishes ${name}`)
}

if (tag !== undefined) {
  if (!tag.startsWith(prefix)) {
    fail(`tag ${tag} does not start with ${prefix}`)
  }
  const tagVersion = tag.slice(prefix.length)
  if (tagVersion !== version) {
    fail(`${name}: tag says ${tagVersion}, ${dir}/package.json says ${version}`)
  }
}

const notesPath = join(dir, NOTES_FILE)
let notes: string
try {
  notes = await readFile(notesPath, 'utf8')
} catch {
  fail(`${notesPath} is missing`)
}
const expected = `${name} ${version} is out.`
const firstLine = notes.split('\n')[0]?.trimEnd()
if (firstLine !== expected) {
  fail(`${notesPath} must start with "${expected}", found "${firstLine}"`)
}

console.log(`ok: ${name} ${version}${tag === undefined ? ' (dry run, no tag)' : ` matches ${tag}`}`)
