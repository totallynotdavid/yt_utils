import { FetchHttpClient, type HttpClient } from '@ytutils/core'

export type FetchHtmlOptions = {
  httpClient?: HttpClient
}

export async function fetchWatchHtml(
  videoId: string,
  options: FetchHtmlOptions = {}
): Promise<string> {
  const http = options.httpClient ?? new FetchHttpClient()
  const response = await http.request({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    headers: {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
    timeoutMs: 30_000,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube watch page: HTTP ${response.status}`)
  }

  return response.text
}
