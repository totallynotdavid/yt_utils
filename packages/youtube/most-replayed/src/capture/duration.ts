const NUMBER_RE = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g

function durationFromParts(parts: number[]): number | null {
  if (parts.some(Number.isNaN)) return null

  const [first, second, third] = parts
  if (parts.length === 2 && first !== undefined && second !== undefined) {
    return first * 60 + second
  }

  if (parts.length === 3 && first !== undefined && second !== undefined && third !== undefined) {
    return first * 3600 + second * 60 + third
  }

  return null
}

export function extractDurationFromProgressAria(ariaValueMax: string | null): number | null {
  if (!ariaValueMax) return null

  const text = ariaValueMax.trim()
  if (/^\d+(\.\d+)?$/.test(text)) {
    return Math.max(1, Math.round(Number.parseFloat(text)))
  }

  const colonDuration = durationFromParts(text.split(':').map((part) => Number.parseInt(part, 10)))
  if (colonDuration !== null) return colonDuration

  const fallback = Number.parseFloat((text.match(NUMBER_RE) ?? [])[0] ?? '')
  if (!Number.isFinite(fallback)) return null
  return Math.max(1, Math.round(fallback))
}
