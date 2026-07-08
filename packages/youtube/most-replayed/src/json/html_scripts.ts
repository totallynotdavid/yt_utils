export function extractScriptTextsFromHtml(html: string): string[] {
  const out: string[] = []
  const re = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi
  let match: RegExpExecArray | null = null

  while ((match = re.exec(html)) !== null) {
    const text = match[1] ?? ''
    if (text.length > 0) out.push(text)
  }

  return out
}
