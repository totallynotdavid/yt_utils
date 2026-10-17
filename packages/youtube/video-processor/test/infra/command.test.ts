import { describe, expect, it } from 'vitest'

import { spawnCommandRunner } from '../../src/infra/command'

const echoArgument = ['-e', 'process.stdout.write(process.argv[1])']

describe('spawnCommandRunner', () => {
  it('passes shell metacharacters through as literal arguments', async () => {
    const { stdout } = await spawnCommandRunner.run([
      process.execPath,
      ...echoArgument,
      '$(touch pwned); echo `id`',
    ])

    expect(stdout).toBe('$(touch pwned); echo `id`')
  })

  it('rejects with PROCESS_EXEC_ERROR when the command exits nonzero', async () => {
    await expect(
      spawnCommandRunner.run([process.execPath, '-e', 'process.exit(3)'])
    ).rejects.toMatchObject({ code: 'PROCESS_EXEC_ERROR' })
  })
})
