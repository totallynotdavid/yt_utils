import { YtUtilsError } from '@ytutils/core'

// The lookaheads reject `P`, `PT` and `P1DT`: a date part and a time part each need a component.
const ISO_DURATION = /^P(?=\d|T\d)(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/u

export function parseIsoDuration(durationIso: string): number {
  const match = durationIso.match(ISO_DURATION)
  if (!match) {
    throw new YtUtilsError('PARSING_ERROR', `Invalid ISO-8601 duration: ${durationIso}`)
  }

  const [days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0))
  return (days ?? 0) * 86_400 + (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0)
}

/** Returns `MM:SS`, or `HH:MM:SS` when the duration reaches one hour. */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) {
    throw new YtUtilsError('INVALID_INPUT', `Cannot format ${totalSeconds} as a clock`)
  }

  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (value: number): string => value.toString().padStart(2, '0')

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }

  return `${pad(m)}:${pad(s)}`
}
