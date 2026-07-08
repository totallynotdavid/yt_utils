const NUMBER_RE = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g

export function extractDurationFromProgressAria(ariaValueMax: string | null): number | null {
  if (!ariaValueMax) return null
  const text = ariaValueMax.trim()

  if (/^\d+(\.\d+)?$/.test(text)) {
    return Math.max(1, Math.round(Number.parseFloat(text)))
  }

  const parts = text.split(':').map((part) => Number.parseInt(part, 10))
  if (parts.some(Number.isNaN)) return null

  if (parts.length === 2) {
    const [hours, minutes] = parts
    if (hours !== undefined && minutes !== undefined) return hours * 60 + minutes
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    if (hours !== undefined && minutes !== undefined && seconds !== undefined) {
      return hours * 3600 + minutes * 60 + seconds
    }
  }

  const fallback = Number.parseFloat((text.match(NUMBER_RE) ?? [])[0] ?? '')
  if (!Number.isFinite(fallback)) return null
  return Math.max(1, Math.round(fallback))
}
