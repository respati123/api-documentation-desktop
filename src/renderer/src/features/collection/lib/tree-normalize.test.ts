import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeTree } from '@/features/collection/lib/tree-normalize'

beforeEach(() => {
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000')
})

describe('normalizeTree', () => {
  it('reads a request saved in an older version and fills the fields the model needs', () => {
    const [request] = normalizeTree([{ id: 'r1', kind: 'request', name: 'List', method: 'GET', url: 'https://x.test' }])
    expect(request).toMatchObject({ id: 'r1', kind: 'request', name: 'List', method: 'GET', url: 'https://x.test', body: '' })
    expect(request).toMatchObject({ auth: { type: 'none' }, bodyMode: 'none', bodyFields: [], params: [] })
  })

  it('splits query parameters out of the URL of a saved request', () => {
    const [request] = normalizeTree([{ id: 'r1', kind: 'request', name: 'Search', method: 'GET', url: 'https://x.test?q=1' }])
    expect(request).toMatchObject({ url: 'https://x.test?q=1', params: [{ name: 'q', value: '1', enabled: true }] })
  })

  it('migrates the collections-and-requests shape from the previous version into folders', () => {
    const [folder] = normalizeTree([
      { id: 'c1', name: 'Old', requests: [{ id: 'r1', name: 'Ping', method: 'POST', url: 'https://x.test', body: '{}' }] },
    ])
    expect(folder).toMatchObject({ id: 'c1', kind: 'folder', name: 'Old', children: [{ id: 'r1', kind: 'request', method: 'POST' }] })
  })

  it('drops a node that cannot be identified, and keeps the valid siblings', () => {
    const nodes = normalizeTree([
      { kind: 'request', name: 'No id', method: 'GET', url: 'x' },
      { id: 'good', kind: 'folder', name: 'Good', children: [] },
      'not a node',
    ])
    expect(nodes.map((node) => node.id)).toEqual(['good'])
  })

  it('returns an empty tree for anything that is not a list', () => {
    expect(normalizeTree({ id: 'x' })).toEqual([])
    expect(normalizeTree(null)).toEqual([])
  })
})
