import { describe, expect, it } from 'vitest'
import { bodyModeOf, isSensitiveName, schemaForDisplay } from '@/features/docs/lib/api-reference'

describe('isSensitiveName', () => {
  it('flags credential-like names regardless of case or separator', () => {
    expect(isSensitiveName('Authorization')).toBe(true)
    expect(isSensitiveName('X-API_KEY')).toBe(true)
    expect(isSensitiveName('session-cookie')).toBe(true)
  })

  it('leaves ordinary names alone', () => {
    expect(isSensitiveName('limit')).toBe(false)
  })
})

describe('bodyModeOf', () => {
  it('reads a body with no saved mode as JSON, and an empty one as none', () => {
    expect(bodyModeOf({ body: '{}' })).toBe('json')
    expect(bodyModeOf({ body: '  ' })).toBe('none')
    expect(bodyModeOf({ bodyMode: 'xml', body: '' })).toBe('xml')
  })
})

describe('schemaForDisplay', () => {
  const components = { User: { type: 'object', properties: { id: { type: 'integer' } } } }

  it('expands a component reference', () => {
    const source = JSON.stringify({ $ref: '#/components/schemas/User' })
    expect(JSON.parse(schemaForDisplay(source, components))).toEqual(components.User)
  })

  it('keeps a reference it cannot resolve', () => {
    const source = JSON.stringify({ $ref: '#/components/schemas/Missing' })
    expect(JSON.parse(schemaForDisplay(source, components))).toEqual({ $ref: '#/components/schemas/Missing' })
  })

  it('returns source that is not JSON unchanged', () => {
    expect(schemaForDisplay('type: object', components)).toBe('type: object')
  })

  it('stops on a circular reference instead of looping', () => {
    const loop = { Node: { type: 'object', properties: { next: { $ref: '#/components/schemas/Node' } } } }
    const source = JSON.stringify({ $ref: '#/components/schemas/Node' })
    expect(() => schemaForDisplay(source, loop)).not.toThrow()
  })
})
