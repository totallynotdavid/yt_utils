import { extname } from 'node:path'

import type { CommandRunner } from './command'

function quote(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`
}

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

  const codecFlags = kind === 'audio' ? '-c:a libopus' : '-c:v libx264 -c:a aac'

  const command = `ffmpeg -y -i ${quote(inputPath)} ${codecFlags} ${quote(outputPath)}`
  await runner.run(command)
  return outputPath
}
