import { describe, expect, it } from 'vitest'
import { generatedHeaders, hasCustomContentType } from '@/features/request/lib/generated-headers'
import type { RequestNode } from '@/shared/models/api-node.model'

const labels = { hostValue: '<host>', multipartBoundary: 'multipart/form-data; boundary=<b>', basicValue: 'Basic <creds>' }
const base: RequestNode = { id: 'r', kind: 'request', name: 'r', method: 'POST', url: 'https://x.test', body: '' }
const names = (request: RequestNode) => generatedHeaders(request, labels).map((header) => header.name)

describe('generatedHeaders', () => {
  it('adds Accept, Host, and User-Agent when the user has not set them', () => {
    expect(names(base)).toEqual(['Accept', 'Host', 'User-Agent'])
  })

  it('skips a header the user already enabled, ignoring case', () => {
    const request = { ...base, headers: [{ id: '1', name: 'accept', value: 'text/html', enabled: true }] }
    expect(names(request)).toEqual(['Host', 'User-Agent'])
  })

  it('still adds a header the user disabled', () => {
    const request = { ...base, headers: [{ id: '1', name: 'Accept', value: 'text/html', enabled: false }] }
    expect(names(request)).toContain('Accept')
  })

  it('infers Content-Type from the body mode', () => {
    const json = generatedHeaders({ ...base, bodyMode: 'json', body: '{}' }, labels)
    expect(json.find((header) => header.name === 'Content-Type')?.value).toBe('application/json')
  })

  it('keeps the custom Content-Type value except for form data', () => {
    const custom = { id: '1', name: 'Content-Type', value: 'application/vnd.api+json', enabled: true }
    expect(
      generatedHeaders({ ...base, bodyMode: 'json', body: '{}', headers: [custom] }, labels).map((header) => header.name),
    ).not.toContain('Content-Type')
    const form = generatedHeaders({ ...base, bodyMode: 'form-data', headers: [custom] }, labels)
    expect(form.find((header) => header.name === 'Content-Type')?.value).toBe(labels.multipartBoundary)
  })

  it('uses no boundary for form data on a request that cannot carry a body', () => {
    const form = generatedHeaders({ ...base, method: 'GET', bodyMode: 'form-data' }, labels)
    expect(form.find((header) => header.name === 'Content-Type')?.value).toBe('multipart/form-data')
  })

  it('masks bearer tokens and api key values', () => {
    const bearer = generatedHeaders({ ...base, auth: { type: 'bearer', token: 'a-very-long-secret-token' } }, labels)
    expect(bearer.find((header) => header.name === 'Authorization')?.value).toBe(`Bearer ${'•'.repeat(12)}`)
    const key = generatedHeaders({ ...base, auth: { type: 'api-key', name: 'X-Key', value: 'abc', location: 'header' } }, labels)
    expect(key.find((header) => header.name === 'X-Key')?.value).toBe('•••')
  })

  it('does not add a header for an api key sent in the query', () => {
    const request: RequestNode = { ...base, auth: { type: 'api-key', name: 'k', value: 'v', location: 'query' } }
    expect(names(request)).toEqual(['Accept', 'Host', 'User-Agent'])
  })
})

describe('hasCustomContentType', () => {
  it('is true only for an enabled Content-Type header', () => {
    const header = { id: '1', name: 'content-type', value: 'x', enabled: true }
    expect(hasCustomContentType({ ...base, headers: [header] })).toBe(true)
    expect(hasCustomContentType({ ...base, headers: [{ ...header, enabled: false }] })).toBe(false)
  })
})
