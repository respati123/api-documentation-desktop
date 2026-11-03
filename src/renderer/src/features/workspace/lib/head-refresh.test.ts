import { describe, expect, it } from 'vitest'
import { refreshedToHead } from '@/features/workspace/lib/head-refresh'
import type { ApiNode } from '@/shared/models/api-node.model'

const oldTree: ApiNode[] = [{ id: 'f', kind: 'folder', name: 'Old', children: [] }]
const newTree: ApiNode[] = [{ id: 'f', kind: 'folder', name: 'New', children: [] }]
const emptyVariables = { globals: [], environments: [] }

function copy(patch: Partial<LocalWorkspace> = {}): LocalWorkspace {
  return {
    id: 'copy-1',
    cloudId: 'cloud-1',
    name: 'Testing',
    tree: oldTree,
    baseTree: oldTree,
    variables: emptyVariables,
    baseVariables: emptyVariables,
    activeEnvironmentId: null,
    baseCommitId: 'head-1',
    localHeadId: 'head-1',
    role: 'editor',
    accountId: 'account-a',
    ...patch,
  }
}

describe('refreshedToHead', () => {
  it('moves the copy to the new head and keeps its id, owner, and role', () => {
    const next = refreshedToHead(copy(), { headCommitId: 'head-2', tree: newTree, variables: emptyVariables })
    expect(next.id).toBe('copy-1')
    expect(next.accountId).toBe('account-a')
    expect(next.role).toBe('editor')
    expect(next.baseCommitId).toBe('head-2')
    expect(next.localHeadId).toBe('head-2')
    expect(next.tree).toEqual(newTree)
    expect(next.baseTree).toEqual(newTree)
  })

  it('keeps the active environment when it still exists, and falls back to the first one when it does not', () => {
    const withEnv = { ...emptyVariables, environments: [{ id: 'env-1', name: 'Dev', variables: [] }] }
    const kept = refreshedToHead(copy({ activeEnvironmentId: 'env-1' }), { headCommitId: 'head-2', tree: newTree, variables: withEnv })
    expect(kept.activeEnvironmentId).toBe('env-1')

    const cleared = refreshedToHead(copy({ activeEnvironmentId: 'gone' }), {
      headCommitId: 'head-2',
      tree: newTree,
      variables: withEnv,
    })
    expect(cleared.activeEnvironmentId).toBe('env-1')
  })
})
