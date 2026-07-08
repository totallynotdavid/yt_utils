import type { SvgPathToken } from './path_tokens'

const COMMAND_ARGC: Record<string, number> = {
  A: 7,
  C: 6,
  H: 1,
  L: 2,
  M: 2,
  Q: 4,
  S: 4,
  T: 2,
  V: 1,
  Z: 0,
}

export type SvgPathCommand = {
  command: string
  relative: boolean
  values: number[]
}

function isCommandToken(
  token: SvgPathToken | undefined
): token is Extract<SvgPathToken, { type: 'command' }> {
  return token?.type === 'command'
}

function nextDrawCommand(command: string): string {
  if (command === 'M') return 'L'
  if (command === 'm') return 'l'
  return command
}

function readCommandValues(
  tokens: SvgPathToken[],
  index: number,
  count: number
): { values: number[]; nextIndex: number } | null {
  const values: number[] = []

  for (let offset = 0; offset < count; offset += 1) {
    const token = tokens[index + offset]
    if (token?.type !== 'number' || Number.isNaN(token.value)) return null
    values.push(token.value)
  }

  return { values, nextIndex: index + count }
}

export function parseSvgPathCommands(tokens: SvgPathToken[]): SvgPathCommand[] {
  const commands: SvgPathCommand[] = []
  let index = 0
  let activeCommand = ''

  while (index < tokens.length) {
    const token = tokens[index]
    if (isCommandToken(token)) {
      activeCommand = token.value
      index += 1
    }

    if (!activeCommand) break

    const upper = activeCommand.toUpperCase()
    const argc = COMMAND_ARGC[upper]
    if (argc === undefined) {
      activeCommand = ''
      continue
    }

    if (argc === 0) {
      commands.push({ command: upper, relative: false, values: [] })
      activeCommand = ''
      continue
    }

    const parsed = readCommandValues(tokens, index, argc)
    if (!parsed) {
      activeCommand = ''
      continue
    }

    commands.push({
      command: upper,
      relative: activeCommand !== upper,
      values: parsed.values,
    })
    index = parsed.nextIndex
    activeCommand = nextDrawCommand(activeCommand)
  }

  return commands
}
