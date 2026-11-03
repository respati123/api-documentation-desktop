import { describe, expect, it } from 'vitest'
import { checkJsonBody } from '@/features/request/lib/json-body'

describe('checkJsonBody', () => {
  it('formats valid JSON with two-space indentation', () => {
    const result = checkJsonBody('{"a":1,"b":[1,2]}')
    expect(result).toEqual({ status: 'valid', formatted: '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}' })
  })

  it('treats an empty or blank body as empty, not invalid', () => {
    expect(checkJsonBody('')).toEqual({ status: 'empty' })
    expect(checkJsonBody('   \n  ')).toEqual({ status: 'empty' })
  })

  it('reports the line and column of a syntax error', () => {
    const result = checkJsonBody('{\n  "a": 1,\n}')
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.line).toBe(3)
    expect(result.column).toBe(1)
    expect(result.message.length).toBeGreaterThan(0)
  })

  it('reports an invalid body that ends too early', () => {
    const result = checkJsonBody('{"a": ')
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.line).toBe(1)
    expect(result.column).toBeGreaterThan(0)
  })
})
