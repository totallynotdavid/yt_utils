import { expect, test } from 'vitest'

import { parseDuration } from '../src/duration'
import { formatMB, formatDuration, estimateChunks } from '../src/format'

test.each([
  ['3600', 3600],
  ['1h', 3600],
  ['30m', 1800],
  ['45s', 45],
  ['1h30m', 5400],
])('parseDuration reads %s', (input, seconds) => {
  expect(parseDuration(input)).toBe(seconds)
})

test.each(['banana', '1h banana', '1h2x', '', '0s', '0'])('parseDuration rejects "%s"', (input) => {
  expect(() => parseDuration(input)).toThrow()
})

test('formatMB / formatDuration', () => {
  expect(formatMB(482 * 1024 * 1024)).toBe('482.0 MB')
  expect(formatDuration(0)).toBe('00:00:00')
  expect(formatDuration(3661)).toBe('01:01:01')
})

test('estimateChunks rounds up and never returns zero', () => {
  expect(estimateChunks(6830, 3600)).toBe(2)
  expect(estimateChunks(10, 3600)).toBe(1)
})
