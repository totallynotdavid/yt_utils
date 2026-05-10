import { describe, expect, it } from 'vitest'

import { YtUtilsError } from '../src/index'

describe('core', () => {
  it('creates typed errors', () => {
    const err = new YtUtilsError('INVALID_INPUT', 'bad input')
    expect(err.code).toBe('INVALID_INPUT')
  })
})
