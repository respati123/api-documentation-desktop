import { beforeEach, describe, expect, it } from 'vitest'
import { readWorkspaceTabs } from '@/features/workspace/lib/workspace-tabs'
import type { ApiNode } from '@/shared/models/api-node.model'

const tree: ApiNode[] = [{ id: 'r1', kind: 'request', name: 'List', method: 'GET', url: '', body: '' }]
const variables = { globals: [], environments: [{ id: 'env1', name: 'Dev', variables: [] }] }

beforeEach(() => localStorage.clear())

describe('readWorkspaceTabs', () => {
  it('restores saved tabs that still exist, and drops the rest', () => {
    localStorage.setItem(
      'api-docs-open-tabs-w1',
      JSON.stringify({
        tabs: [
          { kind: 'request', id: 'r1' },
          { kind: 'request', id: 'gone' },
          { kind: 'environment', id: 'env1' },
          { kind: 'mystery', id: 'x' },
        ],
        activeKey: 'environment:env1',
      }),
    )
    const result = readWorkspaceTabs('w1', tree, variables)
    expect(result.tabs).toEqual([
      { kind: 'request', id: 'r1' },
      { kind: 'environment', id: 'env1' },
    ])
    expect(result.activeKey).toBe('environment:env1')
  })

  it('opens the first request when nothing valid was saved', () => {
    localStorage.setItem('api-docs-open-tabs-w1', 'not json')
    expect(readWorkspaceTabs('w1', tree, variables)).toEqual({ tabs: [{ kind: 'request', id: 'r1' }], activeKey: 'request:r1' })
  })
})
