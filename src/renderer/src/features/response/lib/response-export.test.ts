import { describe, expect, it } from 'vitest'
import { cookieParts, formatResponseBody, responseCookies } from '@/features/response/lib/response-export'
import type { ResponseData } from '@/features/response/models/response.model'

const base: ResponseData = { status: 200, statusText: 'OK', duration: 10, headers: {}, body: '' }

describe('formatResponseBody', () => {
  it('pretty-prints a JSON body', () => {
    expect(formatResponseBody('{"a":1}')).toBe('{\n  "a": 1\n}')
  })

  it('returns a body that is not JSON unchanged', () => {
    expect(formatResponseBody('plain text')).toBe('plain text')
  })
})

describe('responseCookies', () => {
  it('prefers the cookie list the main process sends', () => {
    expect(responseCookies({ ...base, cookies: ['a=1'], headers: { 'set-cookie': 'b=2' } })).toEqual(['a=1'])
  })

  it('splits a combined Set-Cookie header without cutting an Expires date', () => {
    const header = 'a=1; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/, b=2; Secure'
    expect(responseCookies({ ...base, headers: { 'set-cookie': header } })).toEqual([
      'a=1; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/',
      'b=2; Secure',
    ])
  })

  it('returns no cookies when the response sets none', () => {
    expect(responseCookies(base)).toEqual([])
  })
})

describe('cookieParts', () => {
  it('separates the name, the value, and the attributes', () => {
    expect(cookieParts('sid=abc=1; Path=/; HttpOnly')).toEqual({ name: 'sid', value: 'abc=1', attributes: ['Path=/', 'HttpOnly'] })
  })

  it('treats a pair without an equals sign as a name only', () => {
    expect(cookieParts('flag')).toEqual({ name: 'flag', value: '', attributes: [] })
  })
})
