import { YtUtilsError } from './errors'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpRequest = {
  url: string
  method?: HttpMethod
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export type HttpResponse = {
  status: number
  ok: boolean
  text: string
  json: unknown
}

export interface HttpClient {
  request(req: HttpRequest): Promise<HttpResponse>
}

export class FetchHttpClient implements HttpClient {
  async request(req: HttpRequest): Promise<HttpResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? 15_000)

    try {
      const response = await fetch(req.url, {
        method: req.method ?? 'GET',
        headers: req.headers,
        body: req.body,
        signal: controller.signal,
      })

      const text = await response.text()
      let json: unknown = null

      if (text.length > 0) {
        try {
          json = JSON.parse(text)
        } catch {
          json = null
        }
      }

      return {
        status: response.status,
        ok: response.ok,
        text,
        json,
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new YtUtilsError('TIMEOUT', `HTTP request timed out for ${req.url}`)
      }

      throw new YtUtilsError('UPSTREAM_ERROR', `HTTP request failed for ${req.url}`, error)
    } finally {
      clearTimeout(timeout)
    }
  }
}
