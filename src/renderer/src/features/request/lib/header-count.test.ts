import { describe, expect, it } from 'vitest'
import { requestHeaderCount } from '@/features/request/lib/header-count'
import type { RequestNode } from '@/shared/models/api-node.model'

const base: RequestNode = { id: 'r', kind: 'request', name: 'r', method: 'GET', url: '', body: '' }

describe('requestHeaderCount', () => {
  it('counts the three headers the app always adds', () => {
    expect(requestHeaderCount(base)).toBe(3)
  })

  it('counts an enabled custom header once, ignoring case', () => {
    const headers = [
      { id: '1', name: 'X-Trace', value: '1', enabled: true },
      { id: '2', name: 'x-trace', value: '2', enabled: true },
      { id: '3', name: 'X-Off', value: '', enabled: false },
    ]
    expect(requestHeaderCount({ ...base, headers })).toBe(4)
  })

  it('does not double count a custom header the app would add anyway', () => {
    expect(requestHeaderCount({ ...base, headers: [{ id: '1', name: 'Accept', value: 'x', enabled: true }] })).toBe(3)
  })

  it('adds Content-Type for a body and Authorization for credentials', () => {
    expect(requestHeaderCount({ ...base, body: '{}', auth: { type: 'bearer', token: 't' } })).toBe(5)
  })
})
