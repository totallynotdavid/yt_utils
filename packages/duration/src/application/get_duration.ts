import { YtUtilsError } from '@ytutils/core'
import { getMetadata, type MetadataOptions } from '@ytutils/metadata'

import type { DurationFormat, DurationResult } from '../domain/types'

function parseIsoDurationToSeconds(durationIso: string): number {
  const match = durationIso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/u)
  if (!match) {
    throw new YtUtilsError('PARSING_ERROR', `Invalid ISO-8601 duration: ${durationIso}`)
  }

  const hours = Number.parseInt(match[1] ?? '0', 10)
  const minutes = Number.parseInt(match[2] ?? '0', 10)
  const seconds = Number.parseInt(match[3] ?? '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

function toClock(totalSeconds: number): string {
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

export async function getDuration(
  input: string,
  options?: MetadataOptions & { format?: DurationFormat }
): Promise<DurationResult | number | string> {
  const format = options?.format ?? 'clock'
  const metadata = await getMetadata(input, {
    fetchType: 'fullData',
    apiKey: options?.apiKey,
    httpClient: options?.httpClient,
  })

  if (metadata.mediaType !== 'video') {
    throw new YtUtilsError('INVALID_INPUT', 'Duration is only available for video refs')
  }

  if (!metadata.durationIso) {
    throw new YtUtilsError('NOT_FOUND', `Duration not available for video ${metadata.mediaId}`)
  }

  const seconds = parseIsoDurationToSeconds(metadata.durationIso)
  const result: DurationResult = {
    seconds,
    minutes: seconds / 60,
    hours: seconds / 3600,
    clock: toClock(seconds),
  }

  if (format === 'seconds') return result.seconds
  if (format === 'minutes') return result.minutes
  if (format === 'hours') return result.hours
  if (format === 'clock') return result.clock

  return result
}
