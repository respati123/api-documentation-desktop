import { describe, expect, it } from 'vitest'
import { rebaseOntoCloudHead, sharedCommitOf } from '@/features/sync/lib/push-commits'
import type { ApiNode } from '@/shared/models/api-node.model'

const commit = (id: string, parentIds: string[]): LocalCommit => ({
  id,
  parentIds,
  message: id,
  tree: [],
  createdAt: '2026-01-01',
  pushed: false,
})

describe('rebaseOntoCloudHead', () => {
  it('keeps a parent that is itself pending, and points a root commit at the cloud head', () => {
    const rebased = rebaseOntoCloudHead([commit('a', ['old']), commit('b', ['a'])], 'cloud-1')
    expect(rebased.map((item) => item.parentIds)).toEqual([['cloud-1'], ['a']])
  })
})

describe('sharedCommitOf', () => {
  it('strips local paths and shares only the allowed variables', () => {
    const local = {
      ...commit('a', []),
      tree: [{ id: 't' }] as unknown as LocalCommit['tree'],
      variables: { globals: [], environments: [] },
    }
    const shared = sharedCommitOf(
      local,
      () => ({ globals: [], environments: [] }),
      (tree) => tree.map((node) => ({ ...node, shared: true }) as unknown as ApiNode),
    )
    expect(shared.tree).toEqual([{ id: 't', shared: true }])
    expect(shared.id).toBe('a')
  })
})
