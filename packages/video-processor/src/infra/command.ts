import { spawn } from 'node:child_process'

import { YtUtilsError } from '@ytutils/core'

export interface CommandRunner {
  run(argv: string[]): Promise<{ stdout: string; stderr: string }>
}

export const ShellCommandRunner: CommandRunner = {
  run(argv: string[]): Promise<{ stdout: string; stderr: string }> {
    const [command, ...args] = argv
    if (command === undefined) {
      return Promise.reject(
        new YtUtilsError('INVALID_INPUT', 'CommandRunner.run requires a non-empty argv')
      )
    }

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { shell: false })
      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8')
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8')
      })

      child.on('error', (error) => {
        reject(
          new YtUtilsError('PROCESS_EXEC_ERROR', `Command failed: ${argv.join(' ')}`, {
            error,
            stdout,
            stderr,
          })
        )
      })

      child.on('close', (code) => {
        if (code !== 0) {
          reject(
            new YtUtilsError('PROCESS_EXEC_ERROR', `Command failed: ${argv.join(' ')}`, {
              exitCode: code,
              stdout,
              stderr,
            })
          )
          return
        }

        resolve({ stdout, stderr })
      })
    })
  },
}
