import { describe, expect, it } from 'vitest'
import { collectionKeys, collectionOf, replaceCollection } from '@/features/collection/lib/collection-tree'
import type { ApiNode } from '@/shared/models/api-node.model'

const users: ApiNode = { id: 'users', kind: 'folder', name: 'Users', children: [] }
const orders: ApiNode = { id: 'orders', kind: 'folder', name: 'Orders', children: [] }
const ordersV2: ApiNode = { id: 'orders', kind: 'folder', name: 'Orders v2', children: [] }
const tree = [users, orders]

describe('collection tree', () => {
  it('lists the collection keys in tree order', () => {
    expect(collectionKeys(tree)).toEqual(['users', 'orders'])
  })

  it('returns one collection as a one-node tree', () => {
    expect(collectionOf(tree, 'orders')).toEqual([orders])
    expect(collectionOf(tree, 'missing')).toEqual([])
  })

  it('replaces a collection in place and leaves the others alone', () => {
    expect(replaceCollection(tree, 'orders', [ordersV2])).toEqual([users, ordersV2])
  })

  it('removes a collection when its content is empty', () => {
    expect(replaceCollection(tree, 'users', [])).toEqual([orders])
  })

  it('adds a collection that is not in the tree yet, at the end', () => {
    const invoices: ApiNode = { id: 'invoices', kind: 'folder', name: 'Invoices', children: [] }
    expect(replaceCollection(tree, 'invoices', [invoices])).toEqual([users, orders, invoices])
  })
})
