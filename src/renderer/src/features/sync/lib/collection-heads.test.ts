import { describe, expect, it } from 'vitest'
import {
  canMigrateToCollections,
  collectionHeadsOf,
  isCollectionSynced,
  migrateToCollectionHeads,
} from '@/features/sync/lib/collection-heads'
import type { CollectionBranch } from '@/features/sync/models/collection-branch.model'

const branch = (id: string, key: string, head: string | null, name = 'main'): CollectionBranch => ({
  id,
  collectionKey: key,
  name,
  headCommitId: head,
  createdBy: 'u',
  createdAt: '2026-11-04T00:00:00Z',
})
const copy = (patch: Partial<LocalWorkspace> = {}): LocalWorkspace => ({
  id: 'w',
  cloudId: 'c',
  name: 'Testing',
  tree: [],
  baseTree: [],
  baseCommitId: 'head-1',
  localHeadId: 'head-1',
  ...patch,
})
const branches = [
  branch('b-users', 'users', 'h-users'),
  branch('b-orders', 'orders', 'h-orders'),
  branch('b-orders-feat', 'orders', 'h-feat', 'feat'),
]

describe('canMigrateToCollections', () => {
  it('allows a clean copy whose base is the cloud head', () => {
    expect(canMigrateToCollections(copy(), 'head-1')).toBe(true)
  })

  it('refuses when the cloud head moved, so a pull comes first', () => {
    expect(canMigrateToCollections(copy(), 'head-2')).toBe(false)
  })

  it('refuses when local commits are not pushed', () => {
    expect(canMigrateToCollections(copy({ localHeadId: 'local-9' }), 'head-1')).toBe(false)
  })

  it('refuses a copy that is already synced by collection', () => {
    expect(canMigrateToCollections(copy({ collectionHeads: {} }), 'head-1')).toBe(false)
  })
})

describe('migrateToCollectionHeads', () => {
  it('sets each collection head from its main branch and keeps the base', () => {
    const migrated = migrateToCollectionHeads(copy(), branches)
    expect(migrated.collectionHeads).toEqual({
      users: { branchId: 'b-users', headCommitId: 'h-users' },
      orders: { branchId: 'b-orders', headCommitId: 'h-orders' },
    })
    expect(migrated.baseCommitId).toBe('head-1')
    expect(isCollectionSynced(migrated)).toBe(true)
  })
})

describe('collectionHeadsOf', () => {
  it('keeps a stored head and adds the main branch of a collection that has none', () => {
    const stored = copy({ collectionHeads: { users: { branchId: 'b-users-old', headCommitId: 'old' } } })
    const heads = collectionHeadsOf(stored, branches)
    expect(heads.users).toEqual({ branchId: 'b-users-old', headCommitId: 'old' })
    expect(heads.orders).toEqual({ branchId: 'b-orders', headCommitId: 'h-orders' })
  })
})
