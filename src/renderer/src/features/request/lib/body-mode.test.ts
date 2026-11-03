import { describe, expect, it } from 'vitest'
import { effectiveBodyMode } from '@/features/request/lib/body-mode'

describe('effectiveBodyMode', () => {
  it('uses the saved mode when there is one', () => {
    expect(effectiveBodyMode({ bodyMode: 'xml', body: '' })).toBe('xml')
  })

  it('treats a body without a mode as JSON', () => {
    expect(effectiveBodyMode({ body: '{"a":1}' })).toBe('json')
  })

  it('treats a blank body without a mode as no body', () => {
    expect(effectiveBodyMode({ body: '   ' })).toBe('none')
  })
})
