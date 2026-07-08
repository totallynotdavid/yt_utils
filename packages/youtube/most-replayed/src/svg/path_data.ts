export function extractPathDAttributes(svg: string): string[] {
  const out: string[] = []
  const re = /<path\b[^>]*\bd=(['"])(.*?)\1/gi
  let match: RegExpExecArray | null = null

  while ((match = re.exec(svg)) !== null) {
    const pathData = match[2]?.trim()
    if (pathData) out.push(pathData)
  }

  return out
}
