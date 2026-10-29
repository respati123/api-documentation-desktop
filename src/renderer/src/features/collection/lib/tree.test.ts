import { describe, expect, it } from 'vitest'
import { addToTree } from '@/features/collection/lib/tree'
import type { ApiNode, FolderNode, RequestNode } from '@/shared/models/api-node.model'

const request = (id: string): RequestNode => ({ id, kind: 'request', name: id, method: 'GET', url: '', body: '' })
const folder = (id: string, children: ApiNode[] = []): FolderNode => ({ id, kind: 'folder', name: id, children })

describe('addToTree', () => {
  it('adds an item at the end of the named folder, even when the folder is nested', () => {
    const tree = [folder('outer', [folder('inner', [request('a')])])]
    expect(addToTree(tree, 'inner', request('b'))).toEqual([folder('outer', [folder('inner', [request('a'), request('b')])])])
  })

  it('adds an item at the root when the parent is missing or is a request', () => {
    const tree = [request('a')]
    expect(addToTree(tree, 'missing', request('b'))).toEqual([request('a'), request('b')])
    expect(addToTree(tree, 'a', request('c'))).toEqual([request('a'), request('c')])
  })

  it('does not change the tree it was given', () => {
    const tree = [folder('f')]
    addToTree(tree, 'f', request('a'))
    expect(tree).toEqual([folder('f')])
  })
})
