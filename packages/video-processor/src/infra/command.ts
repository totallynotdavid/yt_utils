import { exec } from 'node:child_process'

import { YtUtilsError } from '@ytutils/core'

export interface CommandRunner {
  run(command: string): Promise<{ stdout: string; stderr: string }>
}

export class ShellCommandRunner implements CommandRunner {
  run(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(
            new YtUtilsError('PROCESS_EXEC_ERROR', `Command failed: ${command}`, {
              error,
              stdout,
              stderr,
            })
          )
          return
        }

        resolve({ stdout, stderr })
      })
    })
  }
}
