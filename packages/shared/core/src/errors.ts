export type YtUtilsErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'PARSING_ERROR'
  | 'DEPENDENCY_MISSING'
  | 'PROCESS_EXEC_ERROR'
  | 'TIMEOUT'

export class YtUtilsError extends Error {
  constructor(
    readonly code: YtUtilsErrorCode,
    message: string,
    readonly cause?: unknown
  ) {
    super(message)
    this.name = 'YtUtilsError'
  }
}

export function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new YtUtilsError('INVALID_INPUT', `${label} must be a non-empty string`)
  }

  return value.trim()
}
