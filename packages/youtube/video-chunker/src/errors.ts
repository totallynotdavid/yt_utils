export type VideoErrorCode =
  | 'INVALID_REQUEST'
  | 'MISSING_BINARY'
  | 'FETCH_FAILED'
  | 'PROBE_FAILED'
  | 'SPLIT_FAILED'

export class VideoError extends Error {
  constructor(
    readonly code: VideoErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'VideoError'
  }
}

export function isErrnoException(value: unknown): value is NodeJS.ErrnoException {
  return value instanceof Error
}
