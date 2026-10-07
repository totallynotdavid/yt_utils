import { afterEach, expect, test, vi } from 'vitest'

import { createReporter } from '../src/reporter'

const source = {
  path: '/tmp/video.mp4',
  title: 'Example video',
  durationSeconds: 60,
  sizeBytes: 1024 * 1024,
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('reports progress events and ignores unrelated events', () => {
  let output = ''
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    output += String(chunk)
    return true
  })

  const reporter = createReporter(30)
  reporter.onProgress({ type: 'stage:start', stage: 'fetch' })
  reporter.onProgress({
    type: 'fetch:progress',
    percent: 100,
    receivedBytes: source.sizeBytes,
    totalBytes: source.sizeBytes,
  })
  reporter.onProgress({
    type: 'split:progress',
    percent: 100,
    processedSeconds: source.durationSeconds,
    totalSeconds: source.durationSeconds,
  })
  reporter.onProgress({ type: 'probed', source })
  reporter.onProgress({ type: 'stage:done', stage: 'fetch' })
  reporter.onProgress({ type: 'chunk', chunk: { index: 1, ...source } })

  expect(output).toContain('\nDownloading\n')
  expect(output).toContain('100%')
  expect(output).toContain('title:   Example video')
})
