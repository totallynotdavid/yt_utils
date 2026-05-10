import { mkdir } from 'node:fs/promises'

export async function ensureDirectoryExists(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}
