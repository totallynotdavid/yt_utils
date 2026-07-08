export type SvgPathToken = { type: 'command'; value: string } | { type: 'number'; value: number }

const TOKEN_RE = /([AaCcHhLlMmQqSsTtVvZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g

export function tokenizeSvgPath(pathData: string): SvgPathToken[] {
  const tokens: SvgPathToken[] = []
  let match: RegExpExecArray | null = null

  while ((match = TOKEN_RE.exec(pathData)) !== null) {
    const command = match[1]
    const rawNumber = match[2]
    if (command !== undefined) {
      tokens.push({ type: 'command', value: command })
    } else if (rawNumber !== undefined) {
      tokens.push({ type: 'number', value: Number.parseFloat(rawNumber) })
    }
  }

  return tokens
}
