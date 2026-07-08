import { extname } from 'node:path'

import type { CommandRunner } from './command'

export async function convertWithFfmpeg(
  inputPath: string,
  targetFormat: string,
  kind: 'audio' | 'video',
  runner: CommandRunner
): Promise<string> {
  const outputPath = inputPath.replace(
    new RegExp(`${extname(inputPath)}$`, 'u'),
    `.${targetFormat}`
  )

  const codecFlags = kind === 'audio' ? ['-c:a', 'libopus'] : ['-c:v', 'libx264', '-c:a', 'aac']

  const argv = ['ffmpeg', '-y', '-i', inputPath, ...codecFlags, outputPath]
  await runner.run(argv)
  return outputPath
}
