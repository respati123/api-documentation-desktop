import { describe, expect, it } from 'vitest'
import { localWorkspaceSchema } from '@/features/workspace/models/local-workspace.model'

const stored = {
  id: 'w',
  cloudId: 'c',
  name: 'Testing',
  tree: [],
  baseTree: [],
  baseCommitId: 'head-1',
  localHeadId: 'head-1',
}

describe('local workspace collection heads', () => {
  it('reads a copy saved before collection heads existed as not yet synced by collection', () => {
    const parsed = localWorkspaceSchema.parse(stored)
    expect(parsed.collectionHeads ?? null).toBeNull()
  })

  it('keeps the stored collection heads', () => {
    const heads = { users: { branchId: 'b-users', headCommitId: 'h-users' } }
    const parsed = localWorkspaceSchema.parse({ ...stored, collectionHeads: heads })
    expect(parsed.collectionHeads).toEqual(heads)
  })
})
