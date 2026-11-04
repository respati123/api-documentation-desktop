import { describe, expect, it, vi } from 'vitest'
import type { CollectionHead } from '@/features/sync/lib/branch-sync'
import type { CollectionBranch } from '@/features/sync/models/collection-branch.model'
import { baseAfterPush, headsFromBranches, pullCollections, pushCollections } from '@/features/sync/workflows/collection-workflow'
import { ApiError } from '@/lib/api'
import type { ApiNode } from '@/shared/models/api-node.model'

const folder = (id: string, name: string): ApiNode => ({ id, kind: 'folder', name, children: [] })
const branch = (id: string, key: string, head: string | null, name = 'main'): CollectionBranch => ({
  id,
  collectionKey: key,
  name,
  headCommitId: head,
  createdBy: 'u',
  createdAt: '2026-11-04T00:00:00Z',
})

const base: ApiNode[] = [folder('users', 'Users'), folder('orders', 'Orders')]
const heads: Record<string, CollectionHead> = {
  users: { branchId: 'b-users', headCommitId: 'h-users' },
  orders: { branchId: 'b-orders', headCommitId: 'h-orders' },
}
const branches = [branch('b-users', 'users', 'h-users'), branch('b-orders', 'orders', 'h-orders')]

describe('headsFromBranches', () => {
  it('uses the main branch of a collection that has no stored head', () => {
    expect(headsFromBranches(branches, {})).toEqual(heads)
  })

  it('keeps a stored head over the main branch', () => {
    expect(headsFromBranches(branches, { users: { branchId: 'other', headCommitId: 'x' } }).users.branchId).toBe('other')
  })
})

describe('pullCollections', () => {
  it('brings a clean collection to the cloud head and keeps the others', async () => {
    const pullBranch = vi.fn(async (branchId: string) =>
      branchId === 'b-orders'
        ? { headCommitId: 'h-orders-2', tree: [folder('orders', 'Orders v2')] }
        : { headCommitId: 'h-users', tree: [folder('users', 'Users')] },
    )
    const outcome = await pullCollections({
      tree: base,
      baseTree: base,
      heads,
      listBranches: async () => [branch('b-users', 'users', 'h-users'), branch('b-orders', 'orders', 'h-orders-2')],
      pullBranch,
    })
    expect(outcome.tree).toEqual([folder('users', 'Users'), folder('orders', 'Orders v2')])
    expect(outcome.pulled).toEqual(['orders'])
    expect(outcome.heads.orders.headCommitId).toBe('h-orders-2')
    expect(outcome.blocked).toEqual([])
  })

  it('keeps a collection with local edits and reports it as blocked', async () => {
    const pullBranch = vi.fn(async () => ({ headCommitId: 'h-users-2', tree: [folder('users', 'Remote')] }))
    const local = [folder('users', 'Local edit'), folder('orders', 'Orders')]
    const outcome = await pullCollections({
      tree: local,
      baseTree: base,
      heads,
      listBranches: async () => [branch('b-users', 'users', 'h-users-2'), branch('b-orders', 'orders', 'h-orders')],
      pullBranch,
    })
    expect(outcome.tree[0]).toEqual(folder('users', 'Local edit'))
    expect(outcome.blocked).toEqual(['users'])
    expect(pullBranch).not.toHaveBeenCalledWith('b-users')
  })

  it('reports up to date when every head matches the cloud', async () => {
    const outcome = await pullCollections({
      tree: base,
      baseTree: base,
      heads,
      listBranches: async () => branches,
      pullBranch: async (branchId: string) => ({ headCommitId: branchId === 'b-users' ? 'h-users' : 'h-orders', tree: [] }),
    })
    expect(outcome.upToDate).toBe(true)
    expect(outcome.pulled).toEqual([])
  })
})

describe('pushCollections', () => {
  const pending = [{ id: 'local-1', message: 'Rename users', tree: [folder('users', 'Users v2'), folder('orders', 'Orders')] }]

  it('pushes each collection to its own branch and moves the heads', async () => {
    let next = 0
    const pushBranch = vi.fn(async (_branchId: string, commits: Array<{ id: string }>) => commits[commits.length - 1].id)
    const outcome = await pushCollections({ pending, baseTree: base, heads, newId: () => `n${++next}`, pushBranch })
    expect(outcome.kind).toBe('pushed')
    if (outcome.kind !== 'pushed') return
    expect(outcome.pushedKeys).toEqual(['users'])
    expect(outcome.heads.users.headCommitId).toBe('n1')
    expect(pushBranch).toHaveBeenCalledWith('b-users', [expect.objectContaining({ id: 'n1', parentIds: ['h-users'] })])
  })

  it('refuses the whole push when a changed collection has no branch', async () => {
    const outcome = await pushCollections({
      pending: [{ id: 'local-1', message: 'New', tree: [...base, folder('invoices', 'Invoices')] }],
      baseTree: base,
      heads,
      newId: () => 'n1',
      pushBranch: vi.fn(),
    })
    expect(outcome).toEqual({ kind: 'refused', missing: ['invoices'] })
  })

  it('reports a conflict on one branch and keeps the branches that were accepted', async () => {
    const pending2 = [
      { id: 'local-1', message: 'Users', tree: [folder('users', 'U2'), folder('orders', 'Orders')] },
      { id: 'local-2', message: 'Orders', tree: [folder('users', 'U2'), folder('orders', 'O2')] },
    ]
    let next = 0
    const pushBranch = vi.fn(async (branchId: string) => {
      if (branchId === 'b-orders') throw new ApiError('conflict', 409, null)
      return 'n1'
    })
    const outcome = await pushCollections({ pending: pending2, baseTree: base, heads, newId: () => `n${++next}`, pushBranch })
    expect(outcome.kind).toBe('conflict')
    if (outcome.kind !== 'conflict') return
    expect(outcome.pushedKeys).toEqual(['users'])
    expect(outcome.conflictKeys).toEqual(['orders'])
  })

  it('does nothing when there are no pending commits', async () => {
    expect(await pushCollections({ pending: [], baseTree: base, heads, newId: () => 'x', pushBranch: vi.fn() })).toEqual({
      kind: 'nothing',
    })
  })
})

describe('baseAfterPush', () => {
  it('takes the pushed collections from the tree and keeps the rest of the base', () => {
    const tree = [folder('users', 'Users v2'), folder('orders', 'Orders edited')]
    expect(baseAfterPush(tree, ['users'], base)).toEqual([folder('users', 'Users v2'), folder('orders', 'Orders')])
  })
})
