// npm publish cannot resolve the workspace: protocol, so rewrite workspace:*
// dependency ranges to concrete versions before packing.
import { glob, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const packageDir = process.argv[2]
if (!packageDir) {
  console.error('usage: bun scripts/rewrite-workspace-deps.ts <package-dir>')
  process.exit(1)
}

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readManifest(path: string): Promise<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(await readFile(path, 'utf8'))
  if (!isRecord(parsed)) {
    throw new Error(`${path} is not a JSON object`)
  }
  return parsed
}

// name -> version for every workspace package, resolved from their manifests.
async function collectWorkspaceVersions(): Promise<Map<string, string>> {
  const versions = new Map<string, string>()
  for await (const manifestPath of glob('{packages/*/*,apps/*}/package.json')) {
    const manifest = await readManifest(manifestPath)
    const { name, version } = manifest
    if (typeof name === 'string' && typeof version === 'string') {
      versions.set(name, version)
    }
  }
  return versions
}

function rewriteRanges(
  deps: unknown,
  versions: Map<string, string>,
  manifestName: string
): string[] {
  if (!isRecord(deps)) return []
  return Object.keys(deps)
    .filter((name) => {
      const range = deps[name]
      return typeof range === 'string' && range.startsWith('workspace:')
    })
    .map((name) => {
      const version = versions.get(name)
      if (version === undefined) {
        throw new Error(
          `Cannot resolve workspace version for "${name}" (needed by ${manifestName})`
        )
      }
      deps[name] = version
      return `${name}@${version}`
    })
}

const versions = await collectWorkspaceVersions()
const manifestPath = join(packageDir, 'package.json')
const manifest = await readManifest(manifestPath)
const manifestName = typeof manifest['name'] === 'string' ? manifest['name'] : packageDir

let changed = false
for (const field of DEP_FIELDS) {
  const rewritten = rewriteRanges(manifest[field], versions, manifestName)
  if (rewritten.length > 0) {
    changed = true
    console.log(`${field}: ${rewritten.join(', ')}`)
  }
}

if (!changed) {
  console.log('no workspace: ranges found; manifest left untouched')
} else {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`rewrote ${manifestPath}`)
}
