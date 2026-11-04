import { describe, expect, it } from 'vitest'
import { applyBranchHeads, type CollectionHead, changedCollections, planBranchCommits } from '@/features/sync/lib/branch-sync'
import type { ApiNode } from '@/shared/models/api-node.model'

const folder = (id: string, name: string): ApiNode => ({ id, kind: 'folder', name, children: [] })
const base: ApiNode[] = [folder('users', 'Users'), folder('orders', 'Orders')]
const heads: Record<string, CollectionHead> = {
  users: { branchId: 'b-users', headCommitId: 'h-users' },
  orders: { branchId: 'b-orders', headCommitId: 'h-orders' },
}

describe('changedCollections', () => {
  it('lists only the collections whose content differs', () => {
    expect(changedCollections(base, [folder('users', 'Users v2'), folder('orders', 'Orders')])).toEqual(['users'])
  })

  it('counts added and removed collections as changed', () => {
    expect(changedCollections(base, [folder('users', 'Users')])).toEqual(['orders'])
    expect(changedCollections(base, [...base, folder('invoices', 'Invoices')])).toEqual(['invoices'])
  })
})

describe('planBranchCommits', () => {
  it('chains each collection on its own head and skips untouched collections', () => {
    let next = 0
    const newId = () => `n${++next}`
    const plan = planBranchCommits({
      commits: [{ id: 'local-1', message: 'Rename users', tree: [folder('users', 'Users v2'), folder('orders', 'Orders')] }],
      baseTree: base,
      heads,
      newId,
    })
    expect(plan.commits).toEqual([
      {
        id: 'n1',
        branchId: 'b-users',
        collectionKey: 'users',
        parentIds: ['h-users'],
        message: 'Rename users',
        tree: [folder('users', 'Users v2')],
      },
    ])
    expect(plan.heads.users.headCommitId).toBe('n1')
    expect(plan.heads.orders.headCommitId).toBe('h-orders')
    expect(plan.missing).toEqual([])
  })

  it('chains two local commits that change the same collection', () => {
    let next = 0
    const newId = () => `n${++next}`
    const plan = planBranchCommits({
      commits: [
        { id: 'local-1', message: 'First', tree: [folder('users', 'A'), folder('orders', 'Orders')] },
        { id: 'local-2', message: 'Second', tree: [folder('users', 'B'), folder('orders', 'Orders')] },
      ],
      baseTree: base,
      heads,
      newId,
    })
    expect(plan.commits.map((commit) => [commit.id, commit.parentIds])).toEqual([
      ['n1', ['h-users']],
      ['n2', ['n1']],
    ])
  })

  it('reports a changed collection that has no branch, and plans nothing for it', () => {
    const plan = planBranchCommits({
      commits: [{ id: 'local-1', message: 'New', tree: [...base, folder('invoices', 'Invoices')] }],
      baseTree: base,
      heads,
      newId: () => 'n1',
    })
    expect(plan.commits).toEqual([])
    expect(plan.missing).toEqual(['invoices'])
  })
})

describe('applyBranchHeads', () => {
  it('puts each pulled collection in place and keeps the others', () => {
    const tree = applyBranchHeads(base, [{ collectionKey: 'orders', tree: [folder('orders', 'Orders v3')] }])
    expect(tree).toEqual([folder('users', 'Users'), folder('orders', 'Orders v3')])
  })

  it('removes a collection whose branch head has no content', () => {
    expect(applyBranchHeads(base, [{ collectionKey: 'users', tree: [] }])).toEqual([folder('orders', 'Orders')])
  })
})
