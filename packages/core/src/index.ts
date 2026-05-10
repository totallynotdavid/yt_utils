export type YtUtilsErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'EXTERNAL_ERROR'

export class YtUtilsError extends Error {
  constructor(
    readonly code: YtUtilsErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'YtUtilsError'
  }
}
