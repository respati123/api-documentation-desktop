import { describe, expect, it } from 'vitest'
import {
  isResponseReference,
  referencedRequestIds,
  resolveResponseReference,
  type SavedResponseSnapshot,
  type SavedResponses,
  savedResponseSuggestions,
} from '@/lib/response-references'
import { resolveRequestVariables } from '@/lib/workspace-variables'
import type { RequestNode } from '@/shared/models/api-node.model'

const login: SavedResponseSnapshot = {
  savedAt: '2026-11-10T10:00:00.000Z',
  status: 200,
  statusText: 'OK',
  headers: { location: '/users/1', 'content-type': 'application/json' },
  body: JSON.stringify({
    data: { accessToken: 'abc.def', id: 7, roles: ['admin', 'dev'], active: true, nothing: null, profile: { city: 'Jakarta' } },
  }),
  truncated: false,
}

const saved: SavedResponses = new Map([
  ['login', login],
  ['big', { ...login, body: '{"data":"cut"}', truncated: true }],
  ['list', { ...login, body: JSON.stringify([{ id: 'first' }, { id: 'second' }]) }],
  ['text', { ...login, body: 'plain text, not json' }],
])

function request(overrides: Partial<RequestNode>): RequestNode {
  return {
    id: 'r1',
    kind: 'request',
    name: 'Me',
    method: 'GET',
    url: 'https://api.example.test/me',
    body: '',
    headers: [],
    ...overrides,
  } as RequestNode
}

describe('isResponseReference', () => {
  it('recognizes names that start with response. and nothing else', () => {
    expect(isResponseReference('response.login.body.$.data')).toBe(true)
    expect(isResponseReference('baseUrl')).toBe(false)
    expect(isResponseReference('responses')).toBe(false)
  })
})

describe('resolveResponseReference', () => {
  it('reads a value from the JSON body with a JSONPath', () => {
    expect(resolveResponseReference('response.login.body.$.data.accessToken', saved)).toBe('abc.def')
  })

  it('reads array items by index', () => {
    expect(resolveResponseReference('response.list.body.$[1].id', saved)).toBe('second')
  })

  it('turns numbers and booleans into text, and objects and arrays into JSON', () => {
    expect(resolveResponseReference('response.login.body.$.data.id', saved)).toBe('7')
    expect(resolveResponseReference('response.login.body.$.data.active', saved)).toBe('true')
    expect(resolveResponseReference('response.login.body.$.data.roles', saved)).toBe('["admin","dev"]')
    expect(resolveResponseReference('response.login.body.$.data.profile', saved)).toBe('{"city":"Jakarta"}')
  })

  it('reads null as the text null', () => {
    expect(resolveResponseReference('response.login.body.$.data.nothing', saved)).toBe('null')
  })

  it('reads the whole body as text with raw', () => {
    expect(resolveResponseReference('response.text.raw', saved)).toBe('plain text, not json')
  })

  it('reads one header by name, ignoring case', () => {
    expect(resolveResponseReference('response.login.header.Location', saved)).toBe('/users/1')
  })

  it('stops with a clear error when the request has no saved response', () => {
    expect(() => resolveResponseReference('response.never.body.$.id', saved)).toThrow('"never" has no saved response yet')
  })

  it('stops when the saved body was truncated', () => {
    expect(() => resolveResponseReference('response.big.body.$.data', saved)).toThrow('larger than 1 MB')
    expect(() => resolveResponseReference('response.big.raw', saved)).toThrow('larger than 1 MB')
  })

  it('names the path that is not in the saved body', () => {
    expect(() => resolveResponseReference('response.login.body.$.data.missing', saved)).toThrow(
      'Path $.data.missing was not found in the saved response of "login".',
    )
    expect(() => resolveResponseReference('response.list.body.$[5].id', saved)).toThrow('was not found')
  })

  it('stops when the saved body is not JSON and a body path is used', () => {
    expect(() => resolveResponseReference('response.text.body.$.data', saved)).toThrow('is not JSON')
  })

  it('stops when the header is not in the saved response', () => {
    expect(() => resolveResponseReference('response.login.header.X-Missing', saved)).toThrow(
      'Header "X-Missing" is not in the saved response of "login".',
    )
  })

  it('refuses a body reference with no path, and a raw reference with a path', () => {
    expect(() => resolveResponseReference('response.login.body', saved)).toThrow('needs a path')
    expect(() => resolveResponseReference('response.text.raw.$.x', saved)).toThrow('does not take a path')
  })

  it('refuses an unknown attribute, a missing attribute, and an unsupported path', () => {
    expect(() => resolveResponseReference('response.login.url', saved)).toThrow('Unknown response attribute "url"')
    expect(() => resolveResponseReference('response.login', saved)).toThrow('needs an attribute')
    expect(() => resolveResponseReference('response.login.body.data.id', saved)).toThrow('must start with $')
    expect(() => resolveResponseReference("response.login.body.$['data']", saved)).toThrow('is not supported')
  })

  it('refuses a request id that is not a plain id', () => {
    expect(() => resolveResponseReference('response...body.$.x', saved)).toThrow('is not a valid request id')
  })
})

describe('resolveRequestVariables with response references', () => {
  it('fills a bearer token from a saved response', () => {
    const resolved = resolveRequestVariables(
      request({ auth: { type: 'bearer', token: '{{response.login.body.$.data.accessToken}}' } }),
      {},
      saved,
    )
    expect(resolved.auth).toEqual({ type: 'bearer', token: 'abc.def' })
  })

  it('fills the URL, a param name, and a JSON body', () => {
    const resolved = resolveRequestVariables(
      request({
        method: 'POST',
        url: 'https://api.example.test/users/{{response.list.body.$[0].id}}',
        params: [{ id: 'p1', name: 'user', value: '{{response.login.body.$.data.id}}', enabled: true }],
        body: '{"ref":"{{response.login.header.location}}"}',
        bodyMode: 'json',
      }),
      {},
      saved,
    )
    expect(resolved.url).toBe('https://api.example.test/users/first')
    expect(resolved.params?.[0].value).toBe('7')
    expect(resolved.body).toBe('{"ref":"/users/1"}')
  })

  it('still resolves normal variables next to response references', () => {
    const resolved = resolveRequestVariables(
      request({ url: '{{baseUrl}}/users/{{response.login.body.$.data.id}}' }),
      { baseUrl: 'https://api.example.test' },
      saved,
    )
    expect(resolved.url).toBe('https://api.example.test/users/7')
  })

  it('throws before anything is sent when a reference cannot be resolved', () => {
    expect(() => resolveRequestVariables(request({ url: '{{response.never.body.$.id}}' }), {}, saved)).toThrow('has no saved response yet')
  })

  it('throws a clear error when no saved responses are given', () => {
    expect(() => resolveRequestVariables(request({ url: '{{response.login.body.$.data.id}}' }), {})).toThrow('has no saved response yet')
  })
})

describe('referencedRequestIds', () => {
  it('lists each request id a text refers to once, in order', () => {
    expect(referencedRequestIds('Bearer {{response.login.body.$.token}} {{ response.list.raw }} {{response.login.header.x}}')).toEqual([
      'login',
      'list',
    ])
  })

  it('returns nothing when the text has no response reference', () => {
    expect(referencedRequestIds('{{baseUrl}}/users')).toEqual([])
  })
})

describe('savedResponseSuggestions', () => {
  it('offers the complete raw and whole-body reference for each saved response', () => {
    const suggestions = savedResponseSuggestions(
      [{ requestId: 'login', savedAt: '2026-11-10T10:00:00.000Z', status: 200, statusText: 'OK', truncated: false }],
      (summary) => `${summary.status} ${summary.statusText}`,
    )

    expect(suggestions).toEqual([
      { name: 'response.login.raw', scope: '200 OK', secret: true },
      { name: 'response.login.body.$', scope: '200 OK', secret: true },
    ])
  })

  it('hides the value in every saved response suggestion, because bodies can hold tokens', () => {
    const suggestions = savedResponseSuggestions(
      [{ requestId: 'x', savedAt: '', status: 200, statusText: 'OK', truncated: true }],
      () => 'scope',
    )

    expect(suggestions.every((item) => item.secret === true && !('value' in item))).toBe(true)
  })
})
